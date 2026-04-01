import argparse
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .utils.gff import build_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Indexing GTF: {app.state.gtf_path}")
    app.state.gtf_db = build_index(app.state.gtf_path)
    yield


def create_app(gtf_path: Path) -> FastAPI:
    app = FastAPI(title="Makoview v2", lifespan=lifespan)
    app.state.gtf_path = gtf_path

    from .routes import search

    app.include_router(search.router, prefix="/api")

    frontend_dir = Path(__file__).parent.parent / "build" / "static"
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

    return app


def cli():
    parser = argparse.ArgumentParser(description="Makoview v2 genome browser")
    parser.add_argument("--gtf", required=True, help="Path to GTF file")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    app = create_app(Path(args.gtf))
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    cli()
