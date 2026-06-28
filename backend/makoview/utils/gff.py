import duckdb
import logging
import os
from pathlib import Path
from typing import Optional
from .split_transcript import Exon, split_tx_into_regions, get_ranges
from .motifs import DRACH
from pyfaidx import Fasta

logger = logging.getLogger(__name__)


class GeneDatabase:
    def __init__(
        self,
        gtf_path: Path,
        sites_path: Path,
        fits_path: Path,
        genome_ref_path: Path,
        reads_path: Path,
        coverage_path: Path,
    ):
        logger.info("↪ Indexing GTF:                %s", gtf_path)

        self.conn = duckdb.connect(":memory:")
        self.conn.execute(f"ATTACH '{sites_path}' AS sites_db (READ_ONLY)")
        self.conn.execute(f"ATTACH '{reads_path}' AS reads_db (READ_ONLY)")
        self.conn.execute(f"ATTACH '{coverage_path}' AS coverage_db (READ_ONLY)")
        self.conn.execute(f"""
            CREATE TABLE fits AS
            SELECT * FROM read_csv('{fits_path}', delim='\t', header=true)
        """)

        self.create_gene_annotation_db(gtf_path, gtf_path.with_suffix(".db"))

        logger.info("↪ Indexing genome reference:   %s", genome_ref_path)
        self.genes = Fasta(genome_ref_path)

    def create_gene_annotation_db(self, gtf_path: Path, db_path: Path):
        """
        Create a DuckDB database from the GTF file for fast querying.
        Will attempt to attach an existing database if it exists, otherwise will create a new one.
        Will modify self.conn to attach the database as a readonly gtf.

        Schema for gtf:
            CREATE TABLE transcripts (
                gene_id VARCHAR,
                transcript_id VARCHAR,
                gene_type VARCHAR,
                gene_name VARCHAR
            );

            CREATE TABLE features (
                chromosome VARCHAR,
                type VARCHAR,
                start INTEGER,
                end INTEGER,
                strand VARCHAR,
                transcript_id VARCHAR
            );
        """
        # if db already exists, try to attach
        if os.path.exists(db_path):
            try:
                self.conn.execute(f"ATTACH '{db_path}' AS gtf (READ_ONLY)")
                return
            except:  # noqa: E722
                pass

        logger.info("↪ Creating gene annotation database...")
        db_conn = duckdb.connect(db_path)

        try:
            # fmt: off
            rel = db_conn.read_csv(
                str(gtf_path),
                delimiter="\t",
                comment="#",
                header=False,
                quotechar="",
                names=[
                    "chromosome", "source", "type", "start", "end",
                    "score", "strand", "phase", "attributes"
                ],
                dtype={"start": "int", "end": "int"},
            )
            rel.create_view("gtf")
            # fmt: on

            db_conn.execute("""
                CREATE TABLE transcripts AS
                SELECT DISTINCT
                    regexp_extract(attributes, 'gene_id "([^"]+)"', 1) AS gene_id,
                    regexp_extract(attributes, 'transcript_id "([^"]+)"', 1) AS transcript_id,
                    regexp_extract(attributes, 'gene_type "([^"]+)"', 1) AS gene_type,
                    regexp_extract(attributes, 'gene_name "([^"]+)"', 1) AS gene_name
                FROM gtf WHERE "type" = 'transcript';
            """)

            db_conn.execute("""
                CREATE TABLE features AS
                SELECT chromosome, "type", "start", "end", strand,
                    regexp_extract(attributes, 'transcript_id "([^"]+)"', 1) AS transcript_id
                FROM gtf WHERE "type" NOT IN ('gene', 'transcript');
            """)
        except Exception as e:
            # delete db if this fails
            db_conn.close()
            os.remove(db_path)
            raise e

        db_conn.close()
        self.conn.execute(f"ATTACH '{db_path}' AS gtf (READ_ONLY)")
        print("Successfully created gene annotation database.")

    def _process_gene(self, gene_id) -> tuple[dict, dict[str, list[Exon]]]:
        """Query and validate all exons for a gene.

        Returns (metadata, transcripts) where:
          metadata = {chr, start, end, gene_id, gene_name, ranges}
          transcripts = {tx_id: [Exon]}
        """

        result = self.conn.execute(
            """
            SELECT gene_name, array_agg(transcript_id) AS transcript_ids
            FROM gtf.transcripts
            WHERE gene_id = ?
            GROUP BY gene_name
        """,
            [gene_id],
        ).fetchone()

        if result is None:
            raise GeneNotFoundError(f"Gene {gene_id} not found")

        gene_name, transcripts = result
        transcript_features = dict()

        # fetch features for each transcript
        for transcript_id in transcripts:
            # fmt: off
            result = self.conn.execute("""
                SELECT chromosome, "type", "start", "end", strand
                FROM gtf.features
                WHERE transcript_id = ?
            """, [transcript_id],
            ).fetchall()

            if not result:
                raise FeaturesNotFoundError(f"Features not found for transcript {transcript_id}")

            features = [
                Exon(chromosome=r[0], type=r[1], start=r[2], end=r[3], strand=r[4])
                for r in result
            ]

            regions = split_tx_into_regions(features)

            transcript_features[transcript_id] = regions
            # fmt: on

        # get metadata
        first_exon = transcript_features.values().__iter__().__next__()[0]
        chromosome = first_exon.chromosome
        strand = first_exon.strand
        ranges = get_ranges([x for xs in transcript_features.values() for x in xs])

        metadata = {
            "chr": chromosome,
            "strand": strand,
            "start": ranges[0][0],
            "end": ranges[-1][1],
            "gene_id": gene_id,
            "gene_name": gene_name,
            "ranges": ranges,
        }
        return metadata, transcript_features

    def get_sites(self, transcript_ids: list[str]) -> list:
        tested_sites = self.get_test_results(transcript_ids)
        all_sites = self.get_site_information(transcript_ids)

        tested_site_dict = {
            (site["transcript_id"], site["transcript_position"]): site
            for site in tested_sites
        }
        for site in all_sites:
            test_result = tested_site_dict.get(
                (site["transcript_id"], site["transcript_position"])
            )
            site["test"] = test_result

        return all_sites

    def get_test_results(self, transcript_ids: list[str]) -> list:
        """Return statistically-tested sites from the fits table."""
        if not transcript_ids:
            return []
        placeholders = ", ".join("?" * len(transcript_ids))
        res = self.conn.execute(
            f"""
            SELECT transcript_id, transcript_position, chr, chr_position, model_type,
                   p_value, bh_corrected_p_value, test_statistic, estimate, std_err
            FROM fits
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """,
            transcript_ids,
        )
        columns = [desc[0] for desc in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]

    def get_site_information(self, transcript_ids: list[str]) -> list:
        """Return all candidate DRACH sites from sites_db.sites."""
        if not transcript_ids:
            return []
        placeholders = ", ".join("?" * len(transcript_ids))

        res = self.conn.execute(
            f"""
            SELECT transcript_id, transcript_position, chr, chr_position,
                   sample_count, total_read_count, max_prob, min_prob,
                   avg_probability_modified, selected
            FROM sites_db.sites
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """,
            transcript_ids,
        )
        columns = [desc[0] for desc in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]

    def get_coverage(self, transcript_ids: list[str]) -> dict[str, list[dict]]:
        if not transcript_ids:
            return {}
        placeholders = ", ".join("?" * len(transcript_ids))
        res = self.conn.execute(
            f"""
            SELECT transcript_id, "sample", "group", count
            FROM coverage_db.coverage
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, "sample", "group"
            """,
            transcript_ids,
        )
        result: dict[str, list] = {}
        for tx_id, sample, group, count in res.fetchall():
            result.setdefault(tx_id, []).append(
                {"sample": sample, "group": group, "read_count": count}
            )
        return result

    def get_mod_counts(self, transcript_ids: list[str]) -> dict[str, dict]:
        # TODO: this function (and therefore total_site_count and called_site_count) is incorrect
        #   and needs to be properly implemented.

        if not transcript_ids:
            return {}
        placeholders = ", ".join("?" * len(transcript_ids))
        res = self.conn.execute(
            f"""
            SELECT rname,
                   COUNT(DISTINCT transcript_position) AS total_site_count,
                   COUNT(DISTINCT CASE WHEN NOT ignored THEN transcript_position END) AS called_site_count
            FROM reads_db.reads
            WHERE rname IN ({placeholders})
            GROUP BY rname
            """,
            transcript_ids,
        )
        return {row[0]: {"total": row[1], "called": row[2]} for row in res.fetchall()}

    def get_gene_data(self, gene_id) -> dict:
        metadata, transcripts = self._process_gene(gene_id)

        transcript_ids = list(transcripts.keys())

        coverage = self.get_coverage(transcript_ids)
        total_reads = sum(
            e["read_count"] for entries in coverage.values() for e in entries
        )
        metadata["total_reads"] = total_reads

        site_counts = self.get_mod_counts(transcript_ids)

        transcripts_with_reads = {
            tx_id: {
                "total_site_count": site_counts.get(tx_id, {}).get("total", 0),
                "called_site_count": site_counts.get(tx_id, {}).get("called", 0),
                "reads": coverage.get(tx_id, []),
                "ranges": regions,
            }
            for tx_id, regions in sorted(
                transcripts.items(),
                key=lambda item: sum(
                    e["read_count"] for e in coverage.get(item[0], [])
                ),
                reverse=True,
            )
        }

        return {
            "metadata": metadata,
            "transcripts": transcripts_with_reads,
            "sites": self.get_sites(transcript_ids),
            "candidate_sites": self.get_candidate_sites(gene_id, metadata),
        }

    def get_candidate_sites(self, gene_id, metadata) -> list[tuple[int, str]]:
        chr = metadata["chr"]
        chr_start = metadata["start"]
        chr_end = metadata["end"]
        strand = metadata["strand"]

        motif_set = set(DRACH())
        sequence = str(self.genes[chr][chr_start - 1 : chr_end]).upper()

        positions = []
        if strand == "-":
            _comp = str.maketrans("ACGT", "TGCA")
            sequence = sequence.translate(_comp)[::-1]
            for r_start, r_end in metadata["ranges"]:
                i_start = chr_end - r_end
                i_end = chr_end - r_start
                for i in range(i_start, i_end - 3):
                    candidate_seq = sequence[i : i + 5]
                    if candidate_seq in motif_set:
                        positions.append((chr_start - i - 2, candidate_seq))
        else:
            for r_start, r_end in metadata["ranges"]:
                i_start = r_start - chr_start
                i_end = r_end - chr_start
                for i in range(i_start, i_end - 3):
                    candidate_seq = sequence[i : i + 5]
                    if candidate_seq in motif_set:
                        positions.append((chr_start + i + 2, candidate_seq))

        return positions

    def get_site_info(self, transcript_id: str, position: int) -> Optional[dict]:
        """Return all information for a single modification site, or None if not found.

        Returns a dict with three keys:

        - site: aggregated statistics from sites_db.sites:
            transcript_id, transcript_position, chr, chr_position,
            rname, sample_count, total_read_count, max_prob,
            min_prob, avg_probability_modified, selected, gene_id, gene_name.

        - test: statistical fit results from the fits table:
            transcript_id, transcript_position, chr, chr_position,
            model_type, p_value, bh_corrected_p_value,
            test_statistic, estimate, std_err.
            None if the site was not statistically tested.

        - reads: list of per-sample entries, each with:
            sample_name, group_name, and probabilities_modified (list of float) —
            one element per read at this site for that sample/group combination.
        """
        site_res = self.conn.execute(
            """
            SELECT transcript_id, transcript_position, chr, chr_position, rname,
                   sample_count, total_read_count, max_prob, min_prob,
                   avg_probability_modified, selected
            FROM sites_db.sites
            WHERE transcript_id = ? AND transcript_position = ?
        """,
            [transcript_id, position],
        )
        cols = [d[0] for d in site_res.description]
        row = site_res.fetchone()
        if row is None:
            return None
        site_info = dict(zip(cols, row))

        test_res = self.conn.execute(
            """
            SELECT transcript_id, transcript_position, chr, chr_position, model_type,
                   p_value, bh_corrected_p_value, test_statistic, estimate, std_err
            FROM fits
            WHERE transcript_id = ? AND transcript_position = ?
        """,
            [transcript_id, position],
        )
        test_cols = [d[0] for d in test_res.description]
        test_row = test_res.fetchone()
        test_info = dict(zip(test_cols, test_row)) if test_row else None

        raw_reads = self.get_sample_site_data(transcript_id, position)

        reads_grouped: dict[tuple, list] = {}
        for r in raw_reads:
            key = (r["sample_name"], r["group_name"])
            reads_grouped.setdefault(key, []).append(r["probability_modified"])
        reads = [
            {"sample_name": k[0], "group_name": k[1], "probabilities_modified": v}
            for k, v in reads_grouped.items()
        ]

        gene_res = self.conn.execute(
            "SELECT gene_id, gene_name FROM gtf.transcripts WHERE transcript_id = ? LIMIT 1",
            [transcript_id],
        ).fetchone()
        site_info["gene_id"] = gene_res[0] if gene_res else None
        site_info["gene_name"] = gene_res[1] if gene_res else None

        return {"site": site_info, "test": test_info, "reads": reads}

    def get_sample_site_data(self, transcript_id: str, position: int) -> list[dict]:
        res = self.conn.execute(
            """
            SELECT r.sample_name, r.group_name, r.probability_modified
            FROM reads_db.reads r
            INNER JOIN sites_db.sites s
                ON r.rname = s.rname AND r.transcript_position = s.transcript_position
            WHERE s.transcript_id = ? AND s.transcript_position = ?
        """,
            [transcript_id, position],
        )
        columns = [d[0] for d in res.description]
        return [dict(zip(columns, row)) for row in res.fetchall()]


class GeneNotFoundError(Exception):
    pass


class GeneDataError(Exception):
    pass


class FeaturesNotFoundError(Exception):
    pass
