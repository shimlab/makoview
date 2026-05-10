import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from functools import lru_cache

from ..utils.plots import plot_violin_by_site
from ..utils.gff import GeneDatabase

router = APIRouter()


@lru_cache(maxsize=128)
def cache_plot_wrapper(gtf_db: GeneDatabase, id: str, position: int, binarised: bool):
    rows = gtf_db.get_sample_site_data(id, position)
    if not rows:
        raise HTTPException(status_code=404, detail="No data found for this site")
    df = pd.DataFrame(rows)
    svg = plot_violin_by_site(df, binarised=binarised)
    return svg


@router.get("/binarisedProbabilities")
async def plotBinarisedProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    svg = cache_plot_wrapper(gtf_db, id, position, binarised=True)
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/probabilities")
async def plotProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    svg = cache_plot_wrapper(gtf_db, id, position, binarised=False)
    return Response(content=svg, media_type="image/svg+xml")
