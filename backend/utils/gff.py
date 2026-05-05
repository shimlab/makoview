from dotenv.cli import get
import duckdb
import os
from pathlib import Path
from .split_transcript import Exon, split_tx_into_regions, get_ranges


class GeneDatabase:
    def __init__(self, gtf_path: Path, sites_path: Path, fits_path: Path):
        self.conn = duckdb.connect(":memory:")
        self.conn.execute(f"ATTACH '{sites_path}' AS sites_db (READ_ONLY)")
        self.conn.execute(f"""
            CREATE TABLE fits AS
            SELECT * FROM read_csv('{fits_path}', delim='\t', header=true)
        """)

        self.create_gene_annotation_db(gtf_path, gtf_path.with_suffix(".db"))

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

        print("Creating gene annotation database...")
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
        chromosome = transcript_features.values().__iter__().__next__()[0].chromosome
        ranges = get_ranges([x for xs in transcript_features.values() for x in xs])

        metadata = {
            "chr": chromosome,
            "start": ranges[0][0],
            "end": ranges[-1][1],
            "gene_id": gene_id,
            "gene_name": gene_name,
            "ranges": ranges,
        }
        return metadata, transcript_features

    def get_tested_sites(self, transcript_ids: list[str]) -> list:
        """Return statistically-tested sites from the fits table."""
        if not transcript_ids:
            return []
        placeholders = ", ".join("?" * len(transcript_ids))
        rows = self.conn.execute(
            f"""
            SELECT transcript_id, transcript_position, chr, chr_position,
                   estimate, std_err, test_statistic, p_value, model_type, bh_corrected_p_value
            FROM fits
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """,
            transcript_ids,
        ).fetchall()
        return [
            {
                "transcript_id": row[0],
                "transcript_position": row[1],
                "chr": row[2],
                "chr_position": int(row[3]),
                "estimate": row[4],
                "std_err": row[5],
                "test_statistic": row[6],
                "p_value": row[7],
                "model_type": row[8],
                "bh_corrected_p_value": row[9],
            }
            for row in rows
        ]

    def get_all_sites(self, transcript_ids: list[str]) -> list:
        """Return all candidate DRACH sites from sites_db.sites."""
        if not transcript_ids:
            return []
        placeholders = ", ".join("?" * len(transcript_ids))
        rows = self.conn.execute(
            f"""
            SELECT transcript_id, transcript_position, chr, chr_position,
                   sample_count, total_read_count, max_prob, min_prob,
                   avg_probability_modified, selected
            FROM sites_db.sites
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """,
            transcript_ids,
        ).fetchall()
        return [
            {
                "transcript_id": row[0],
                "transcript_position": row[1],
                "chr": row[2],
                "chr_position": row[3],
                "sample_count": row[4],
                "total_read_count": row[5],
                "max_prob": row[6],
                "min_prob": row[7],
                "avg_probability_modified": row[8],
                "selected": row[9],
            }
            for row in rows
        ]

    def get_gene_data(self, gene_id) -> dict:
        metadata, transcripts = self._process_gene(gene_id)
        transcript_ids = list(transcripts.keys())
        return {
            "metadata": metadata,
            "transcripts": transcripts,
            "tested_sites": self.get_tested_sites(transcript_ids),
            "all_sites": self.get_all_sites(transcript_ids),
        }


class GeneNotFoundError(Exception):
    pass


class GeneDataError(Exception):
    pass


class FeaturesNotFoundError(Exception):
    pass
