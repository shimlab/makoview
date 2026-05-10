import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from ..utils.plots import plot_violin_by_site
from ..utils.gff import GeneDatabase

router = APIRouter()


@router.get("/binarisedProbabilities")
async def plotBinarisedProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    rows = gtf_db.get_sample_site_data(id, position)
    if not rows:
        raise HTTPException(status_code=404, detail="No data found for this site")
    df = pd.DataFrame(rows)
    svg = plot_violin_by_site(df, binarised=True)
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/probabilities")
async def plotProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    rows = gtf_db.get_sample_site_data(id, position)
    if not rows:
        raise HTTPException(status_code=404, detail="No data found for this site")
    df = pd.DataFrame(rows)
    svg = plot_violin_by_site(df, binarised=False)
    return Response(content=svg, media_type="image/svg+xml")
