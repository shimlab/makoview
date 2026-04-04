import duckdb
from pathlib import Path


def build_index(gtf_path: Path):
    conn = duckdb.connect("gff_index.duckdb")

    should_create_index = False
    if should_create_index:
        conn.execute(f"""
        CREATE TABLE gtf AS
        SELECT
            column0  AS chromosome,
            column3  AS start,
            column4  AS end,
            column6  AS strand,
            regexp_extract(column8, 'gene_id "([^"]+)"',  1) AS gene_id,
            regexp_extract(column8, 'gene_name "([^"]+)"', 1) AS gene_name,
            regexp_extract(column8, 'transcript_id "([^"]+)"', 1) AS transcript_id
        FROM read_csv('{gtf_path}',
            delim       => '\t',
            header      => false,
            quote       => '',
            comment     => '#'
        )
        WHERE column2 = 'exon';
        """)

    return GeneIndex(conn)


class GeneIndex:
    def __init__(self, conn):
        self.conn = conn

    def get_gene(self, gene_id) -> dict:
        query = f"""
        SELECT *
        FROM gtf
        WHERE gene_id = '{gene_id}'
        """
        db_result = self.conn.execute(query).fetchall()
        if not db_result:
            raise GeneNotFoundError(f"Gene {gene_id} not found")

        result = {}

        for i in db_result:
            tx_id = i[6]
            result[tx_id] = result.get(tx_id, list()) + [
                {
                    "chromosome": i[0],
                    "start": i[1],
                    "end": i[2],
                    "strand": i[3],
                    "gene_id": i[4],
                    "gene_name": i[5],
                }
            ]

        return result


class GeneNotFoundError(Exception):
    pass
