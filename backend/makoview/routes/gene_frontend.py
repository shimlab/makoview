from pathlib import Path
import json
from pydantic import TypeAdapter
import base64

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, FileResponse

from ..utils.gff import GeneNotFoundError

router = APIRouter()

static_dir = Path(__file__).parent.parent / "static"

TEMPLATE_DATA = (static_dir / "_gene_template.html").read_text()
ta = TypeAdapter(dict)

@router.get("/gene/{gene_id}")
async def gene_page(gene_id: str, request: Request):
    try:
        payload_raw = request.app.state.gtf_db.get_gene_data(gene_id)
        payload_py = ta.dump_python(payload_raw)
        payload = json.dumps(payload_py)
        encoded = base64.b64encode(payload.encode()).decode()

        html_content = TEMPLATE_DATA.replace("__VITE_DATA__", payload)
        return HTMLResponse(html_content)
    except GeneNotFoundError:
        return FileResponse(static_dir / "404.html", status_code=404)
