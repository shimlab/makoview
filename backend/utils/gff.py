import duckdb
from pathlib import Path


class GeneDatabase:
    def __init__(self, gtf_path: Path, sites_path: Path, fits_path: Path):
        self.conn = duckdb.connect(":memory:")
        self.conn.execute("ATTACH 'gff_index.duckdb' AS gff_db (READ_ONLY)")
        self.conn.execute(f"ATTACH '{sites_path}' AS sites_db (READ_ONLY)")
        self.conn.execute("CREATE VIEW gtf AS SELECT * FROM gff_db.gtf")
        self.conn.execute(f"""
            CREATE TABLE fits AS
            SELECT * FROM read_csv('{fits_path}', delim='\t', header=true)
        """)

    def _process_gene(self, gene_id) -> tuple[dict, dict]:
        """Query and validate all exons for a gene.

        Returns (metadata, transcripts) where:
          metadata = {chr, start, end, gene_id, gene_name, ranges}
          transcripts = {tx_id: [{chromosome, start, end, strand}]}
        """
        query = "SELECT * FROM gtf WHERE gene_id = ?"
        db_result = self.conn.execute(query, [gene_id]).fetchall()
        if not db_result:
            raise GeneNotFoundError(f"Gene {gene_id} not found")

        raw: dict = {}
        for i in db_result:
            tx_id = i[6]
            raw[tx_id] = raw.get(tx_id, list()) + [
                {
                    "chromosome": i[0],
                    "start": i[1],
                    "end": i[2],
                    "strand": i[3],
                    "gene_id": i[4],
                    "gene_name": i[5],
                }
            ]

        first_exon = next(iter(raw.values()))[0]
        chromosome = first_exon["chromosome"]
        db_gene_id = first_exon["gene_id"]
        gene_name = first_exon["gene_name"]
        start, end = None, None

        transcripts: dict = {}
        for tid, tx in raw.items():
            exons = []
            for exon in tx:
                if exon["chromosome"] != chromosome:
                    raise GeneDataError(
                        f"Gene {gene_id} has exons on multiple chromosomes"
                    )
                if exon["gene_id"] != db_gene_id:
                    raise GeneDataError(
                        f"Gene {gene_id} has inconsistent gene_id across exons"
                    )
                if exon["gene_name"] != gene_name:
                    raise GeneDataError(
                        f"Gene {gene_id} has inconsistent gene_name across exons"
                    )

                if start is None or exon["start"] < start:
                    start = exon["start"]
                if end is None or exon["end"] > end:
                    end = exon["end"]

                exons.append(
                    {
                        "chromosome": exon["chromosome"],
                        "start": exon["start"],
                        "end": exon["end"],
                        "strand": exon["strand"],
                    }
                )

            transcripts[tid] = exons

        all_intervals = sorted(
            (exon["start"], exon["end"])
            for tx in transcripts.values()
            for exon in tx
        )
        ranges = []
        for s, e in all_intervals:
            if ranges and s <= ranges[-1][1]:
                ranges[-1][1] = max(ranges[-1][1], e)
            else:
                ranges.append([s, e])

        metadata = {
            "chr": chromosome,
            "start": start,
            "end": end,
            "gene_id": db_gene_id,
            "gene_name": gene_name,
            "ranges": ranges,
        }
        return metadata, transcripts

    def get_gene_metadata(self, gene_id) -> dict:
        metadata, _ = self._process_gene(gene_id)
        return metadata

    def get_transcripts(self, gene_id) -> dict:
        _, transcripts = self._process_gene(gene_id)
        return transcripts

    def get_tested_sites(self, transcript_ids: list[str]) -> list:
        """Return statistically-tested sites from the fits table."""
        if not transcript_ids:
            return []
        placeholders = ", ".join("?" * len(transcript_ids))
        rows = self.conn.execute(f"""
            SELECT transcript_id, transcript_position, chr, chr_position,
                   estimate, std_err, test_statistic, p_value, model_type, bh_corrected_p_value
            FROM fits
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """, transcript_ids).fetchall()
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
        rows = self.conn.execute(f"""
            SELECT transcript_id, transcript_position, chr, chr_position,
                   sample_count, total_read_count, max_prob, min_prob,
                   avg_probability_modified, selected
            FROM sites_db.sites
            WHERE transcript_id IN ({placeholders})
            ORDER BY transcript_id, transcript_position
        """, transcript_ids).fetchall()
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
