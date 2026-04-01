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

    return conn
