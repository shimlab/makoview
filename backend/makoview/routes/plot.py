import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from functools import lru_cache
from collections.abc import Callable

from ..utils import plots
from ..utils.gff import GeneDatabase

router = APIRouter()


@lru_cache(maxsize=256)
def cache_plot_wrapper(
    gtf_db: GeneDatabase,
    plotFunction: Callable,
    id: str,
    position: int,
    *args,
    **kwargs,
):
    rows = gtf_db.get_sample_site_data(id, position)
    if not rows:
        raise HTTPException(status_code=404, detail="No data found for this site")

    df = pd.DataFrame(rows).sort_values(["group_name", "sample_name"])

    svg = plotFunction(df, *args, **kwargs)
    return svg


@router.get("/binarisedProbabilities")
def plotBinarisedProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    svg = cache_plot_wrapper(
        gtf_db,
        plots.plot_binarised_sites,
        id,
        position,
        request.app.state.modified_prob_threshold,
    )
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/probabilities")
def plotProbabilities(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    svg = cache_plot_wrapper(gtf_db, plots.plot_violin_by_site, id, position)
    return Response(content=svg, media_type="image/svg+xml")
