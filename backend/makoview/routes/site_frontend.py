import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, FileResponse

router = APIRouter()

static_dir = Path(__file__).parent.parent / "static"
_template_cache: Optional[str] = None


def _get_template() -> str:
    global _template_cache
    if _template_cache is None:
        _template_cache = (static_dir / "_site_template.html").read_text()
    return _template_cache


@router.get("/site/{transcript_id}/{position}")
async def site_page(transcript_id: str, position: int, request: Request):
    result = request.app.state.gtf_db.get_site_info(transcript_id, position)
    if result is None:
        return FileResponse(static_dir / "404.html", status_code=404)
    payload = {**result, "transcript_id": transcript_id, "position": position}
    html = _get_template().replace("__VITE_SITE_DATA__", json.dumps(payload))
    return HTMLResponse(html)
