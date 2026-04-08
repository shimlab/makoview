from fastapi import APIRouter, Request

router = APIRouter()


GENES_WITH_SITES = """
    gene_id IN (
        SELECT DISTINCT g.gene_id
        FROM gtf g
        INNER JOIN sites_db.sites s ON g.transcript_id = s.transcript_id
    )
"""


@router.get(path="/search")
async def search(q: str, request: Request):
    gtf_db = request.app.state.gtf_db
    results = []
    for field in "gene_name", "gene_id", "transcript_id":
        result = gtf_db.conn.execute(f"""
            SELECT DISTINCT ON({field}) {field}, gene_name, gene_id
            FROM gtf
            WHERE {field} ILIKE '%{q}%'
            AND {GENES_WITH_SITES}
            LIMIT 50;
        """).fetchall()

        results.extend(result)
    return results
