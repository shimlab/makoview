from fastapi import APIRouter, HTTPException, Request

from ..utils.gff import GeneDatabase

router = APIRouter()


@router.get(path="/siteInfo")
async def get_site_info(id: str, position: int, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    result = gtf_db.get_site_info(id, position)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Site not found: {id}:{position}",
        )
    return result
