from fastapi import APIRouter, Request

router = APIRouter()


@router.get(path="/search")
async def search(q: str, request: Request):
    conn = request.app.state.gtf_db
    result = conn.execute(f"""
        SELECT DISTINCT gene_id
        FROM gtf
        WHERE gene_name ILIKE '%{q}%' OR gene_id ILIKE '%{q}%' OR transcript_id ILIKE '%{q}%'
        LIMIT 50;
    """).fetchall()
    return [row[0] for row in result]
