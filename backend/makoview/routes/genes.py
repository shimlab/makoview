from fastapi import APIRouter, HTTPException, Request
from ..utils.gff import GeneDatabase, GeneNotFoundError, GeneDataError

router = APIRouter()


@router.get(path="/genes")
async def get_gene(id: str, request: Request):
    gtf_db: GeneDatabase = request.app.state.gtf_db
    try:
        return gtf_db.get_gene_data(id)
    except GeneNotFoundError:
        raise HTTPException(status_code=404, detail=f"Gene {id} not found")
    except GeneDataError as e:
        raise HTTPException(status_code=500, detail=str(e))
