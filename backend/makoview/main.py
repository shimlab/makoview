import argparse
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .utils.gff import GeneDatabase


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Indexing GTF: {app.state.gtf_path}")
    app.state.gtf_db = GeneDatabase(
        app.state.gtf_path, app.state.sites_path, app.state.fits_path
    )
    yield


def create_app(gtf_path: Path, sites_path: Path, fits_path: Path) -> FastAPI:
    app = FastAPI(title="Makoview v2", lifespan=lifespan)
    app.state.gtf_path = gtf_path
    app.state.sites_path = sites_path
    app.state.fits_path = fits_path

    from .routes import genes, search, gene_frontend

    app.include_router(search.router, prefix="/api")
    app.include_router(genes.router, prefix="/api")
    app.include_router(gene_frontend.router)

    static_dir = Path(__file__).parent / "static"

    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


def cli():
    parser = argparse.ArgumentParser(description="Makoview v2 genome browser")
    parser.add_argument("--gtf", required=True, help="Path to GTF file")
    parser.add_argument("--sites", required=True, help="Path to sites.duckdb")
    parser.add_argument(
        "--fits", required=True, help="Path to adaptive_binomial_fits.tsv"
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    app = create_app(Path(args.gtf), Path(args.sites), Path(args.fits))
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    cli()
