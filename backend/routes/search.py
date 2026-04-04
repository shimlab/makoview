from fastapi import APIRouter, Request

router = APIRouter()


@router.get(path="/search")
async def search(q: str, request: Request):
    gtf_db = request.app.state.gtf_db
    results = []
    for type in "gene_name", "gene_id", "transcript_id":
        result = gtf_db.conn.execute(f"""
            SELECT DISTINCT ON({type}) {type}, gene_name, gene_id
            FROM gtf
            WHERE {type} ILIKE '%{q}%'
            LIMIT 50;
        """).fetchall()

        results.extend(result)
    return results
