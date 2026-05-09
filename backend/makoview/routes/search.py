from fastapi import APIRouter, Request

router = APIRouter()


GENES_WITH_SITES = """
    gene_id IN (
        SELECT DISTINCT g.gene_id
        FROM gtf.transcripts g
        INNER JOIN sites_db.sites s ON g.transcript_id = s.transcript_id
    )
"""


@router.get(path="/search")
async def search(q: str, request: Request):
    gtf_db = request.app.state.gtf_db
    q = q.strip()

    results = []
    for field in "gene_name", "gene_id", "transcript_id":
        result = gtf_db.conn.execute(f"""
            SELECT DISTINCT ON({field}) {field}, gene_name, gene_id
            FROM gtf.transcripts
            WHERE {field} ILIKE '%{q}%'
            AND {GENES_WITH_SITES}
            LIMIT 50;
        """).fetchall()

        results.extend(result)
    return results


@router.get(path="/searchTranscripts")
async def search_transcripts(q: str, request: Request):
    gtf_db = request.app.state.gtf_db
    q = q.strip()
    results = gtf_db.conn.execute("""
        SELECT DISTINCT transcript_id
        FROM gtf.transcripts
        WHERE transcript_id ILIKE $1
        AND transcript_id IN (
            SELECT DISTINCT transcript_id FROM sites_db.sites
        )
        LIMIT 50;
    """, [f"%{q}%"]).fetchall()
    return [row[0] for row in results]


@router.get(path="/searchTranscriptPositions")
async def search_transcript_positions(transcript_id: str, request: Request):
    gtf_db = request.app.state.gtf_db
    results = gtf_db.conn.execute("""
        SELECT DISTINCT transcript_position
        FROM sites_db.sites
        WHERE transcript_id = $1
        ORDER BY transcript_position ASC;
    """, [transcript_id]).fetchall()
    return [row[0] for row in results]
