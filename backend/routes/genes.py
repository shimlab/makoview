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
    first_exon = next(iter(transcripts.values()))[0]
    chromosome = first_exon["chromosome"]
    gene_id = first_exon["gene_id"]
    gene_name = first_exon["gene_name"]
    start, end = None, None

    new_transcripts = {}
    for id, tx in transcripts.items():
        exons = []
        for exon in tx:
            if exon["chromosome"] != chromosome:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gene {id} has exons on multiple chromosomes",
                )
            if exon["gene_id"] != gene_id:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gene {id} has inconsistent gene_id across exons",
                )
            if exon["gene_name"] != gene_name:
                raise HTTPException(
                    status_code=500,
                    detail=f"Gene {id} has inconsistent gene_name across exons",
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

        new_transcripts[id] = exons

    result = {
        "metadata": {
            "chr": chromosome,
            "start": start,
            "end": end,
            "gene_id": gene_id,
            "gene_name": gene_name,
        },
        "transcripts": new_transcripts,
    }

    return result
