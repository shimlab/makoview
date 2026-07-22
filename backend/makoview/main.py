import argparse
import copy
import logging
import getpass
from contextlib import asynccontextmanager
from pathlib import Path
from socket import gethostname

import uvicorn
from uvicorn.config import LOGGING_CONFIG
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .utils.gff import GeneDatabase


logger = logging.getLogger(__name__)


STARTUP_MESSAGE = """[blue]
.___  ___.      ___       __  ___   ______   
|   \\/   |     /   \\     |  |/  /  /  __  \\  
|  \\  /  |    /  ^  \\    |  '  /  |  |  |  | 
|  |\\/|  |   /  /_\\  \\   |    <   |  |  |  | 
|  |  |  |  /  _____  \\  |  .  \\  |  `--'  | 
|__|  |__| /__/     \\__\\ |__|\\__\\  \\______/  
                     _   _  _ ___  _   _ 
                    | \\ / || | __|| | | |
                    `\\ V /'| | _| | 'V' |
                      \\_/  |_|___|!_/ \\_![/blue]
                                            
makoview: visualisation of differential RNA
          modifications

Shim Lab @ University of Melbourne

docs:   https://shimlab.github.io/mako

[bright_black]============================================================[/bright_black]
  [bold]Makoview is now running on [bright_green]http://{ip}:{port}[/bright_green][/bold]
  
  [bold bright_yellow]Tip[/bold bright_yellow]: advice on accessing Makoview from other devices
       using SSH port forwarding can be found in the docs:
       https://shimlab.github.io/mako/makoview

       In short: on a client device, run the following SSH
       command to forward the port to your local machine:
    
       $ ssh -NL {port}:localhost:{port} <user>@<server>

       And then access Makoview in your client browser at

       http://localhost:{port}

       Replace <user> and <server> with your username and
       the server address: for instance,
       {user}@{hostname}
[bright_black]============================================================[/bright_black]
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.gtf_db = GeneDatabase(app.state.gtf_path, app.state.genome_ref_path)
    app.state.gtf_db.init_conn(
        app.state.sites_path,
        app.state.fits_path,
        app.state.reads_path,
        app.state.coverage_path,
    )
    yield


def create_app(
    gtf_path: Path,
    sites_path: Path,
    fits_path: Path,
    genome_ref_path: Path,
    reads_path: Path,
    coverage_path: Path,
) -> FastAPI:
    app = FastAPI(title="Makoview v2", lifespan=lifespan)
    app.state.gtf_path = gtf_path
    app.state.sites_path = sites_path
    app.state.fits_path = fits_path
    app.state.genome_ref_path = genome_ref_path
    app.state.reads_path = reads_path
    app.state.coverage_path = coverage_path

    from .routes import genes, search, gene_frontend, site_frontend, plot, site

    app.include_router(search.router, prefix="/api")
    app.include_router(genes.router, prefix="/api")
    app.include_router(site.router, prefix="/api")
    app.include_router(gene_frontend.router)
    app.include_router(site_frontend.router)

    app.include_router(plot.router, prefix="/plot")

    static_dir = Path(__file__).parent / "static"

    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


class _UvicornLogFilter(logging.Filter):
    def __init__(self, host: str, port: int):
        super().__init__()
        self.host = host
        self.port = port

    def filter(self, record: logging.LogRecord) -> bool:
        if (
            record.args
            and len(record.args) > 2
            and str(record.args[2]).startswith("/assets")
        ):
            return False
        if record.msg.startswith("Uvicorn running on"):
            from rich.console import Console

            # Initialize a custom console that skips URL matching
            console = Console(highlight=False)
            console.print(
                STARTUP_MESSAGE.format(
                    ip=self.host,
                    port=self.port,
                    hostname=gethostname(),
                    user=getpass.getuser(),
                )
            )
            return False
        return True


def cli():
    parser = argparse.ArgumentParser(description="Makoview v2 genome browser")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser(
        "init", help="Index GTF and genome reference, then exit"
    )
    init_parser.add_argument("--gtf", required=True, help="Path to GTF file")
    init_parser.add_argument(
        "--genome", required=True, help="Path to genome reference fasta"
    )

    serve_parser = subparsers.add_parser("serve", help="Start the Makoview server")
    serve_parser.add_argument("--gtf", required=True, help="Path to GTF file")
    serve_parser.add_argument("--sites", required=True, help="Path to sites.duckdb")
    serve_parser.add_argument(
        "--fits", required=True, help="Path to adaptive_binomial_fits.tsv"
    )
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", type=int, default=8001)
    serve_parser.add_argument(
        "--modified_prob_threshold",
        type=float,
        required=True,
        help="Probability threshold above which a site is considered modified",
    )
    serve_parser.add_argument(
        "--genome", required=True, help="Path to genome reference fasta"
    )
    serve_parser.add_argument("--reads", required=True, help="Path to reads.duckdb")
    serve_parser.add_argument(
        "--coverage", required=True, help="Path to coverage.duckdb"
    )

    args = parser.parse_args()

    if args.command == "init":
        logging.basicConfig(level=logging.INFO)
        GeneDatabase(Path(args.gtf), Path(args.genome))
        logger.info("Initialisation complete.")
        return

    app = create_app(
        Path(args.gtf),
        Path(args.sites),
        Path(args.fits),
        Path(args.genome),
        Path(args.reads),
        Path(args.coverage),
    )
    app.state.host = args.host
    app.state.port = args.port
    app.state.modified_prob_threshold = args.modified_prob_threshold

    log_config = copy.deepcopy(LOGGING_CONFIG)
    log_config["loggers"]["makoview"] = {
        "handlers": ["default"],
        "level": "INFO",
        "propagate": False,
    }

    _filter = _UvicornLogFilter(args.host, args.port)
    logging.getLogger("uvicorn.access").addFilter(_filter)
    logging.getLogger("uvicorn.error").addFilter(_filter)
    uvicorn.run(app, host=args.host, port=args.port, log_config=log_config)


if __name__ == "__main__":
    cli()
