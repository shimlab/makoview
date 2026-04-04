from fastapi import APIRouter, HTTPException, Request
from ..utils.gff import GeneIndex, GeneNotFoundError

router = APIRouter()


@router.get(path="/genes")
async def get_gene(id: str, request: Request):
    gtf_db: GeneIndex = request.app.state.gtf_db
    try:
        transcripts = gtf_db.get_gene(id)
    except GeneNotFoundError:
        raise HTTPException(status_code=404, detail=f"Gene {id} not found")

    # sanity checks
    chromosome = next(iter(transcripts.values()))[0]["chromosome"]
    start, end = None, None
    for tx in transcripts.values():
        for exon in tx:
            if exon["chromosome"] != chromosome:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gene {id} has exons on multiple chromosomes",
                )

            if start is None or exon["start"] < start:
                start = exon["start"]
            if end is None or exon["end"] > end:
                end = exon["end"]

    result = {
        "metadata": {"chr": chromosome, "start": start, "end": end},
        "transcripts": transcripts,
    }

    return result
