from shiny import run_app
import os
import argparse
from pathlib import Path


def main():
    """Launch the MakoView Shiny visualization application."""

    parser = argparse.ArgumentParser(
        description="Launch makoview",
    )

    parser.add_argument(
        "--differential-results",
        type=Path,
        required=True,
        dest="differential_results",
        help="Path to differential sites database file",
    )

    parser.add_argument(
        "--modification-db",
        type=Path,
        required=True,
        dest="modification_db",
        help="Path to modification database file",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for the Shiny application (default: 8000)",
    )

    args = parser.parse_args()

    # Use explicitly provided paths
    diff_db_path = args.differential_results
    mod_db_path = args.modification_db

    # Validate files exist
    if not diff_db_path.exists():
        parser.error(f"Differential results file not found: {diff_db_path}")
    if not mod_db_path.exists():
        parser.error(f"Modification database file not found: {mod_db_path}")

    # Set environment variables for app.py to consume
    os.environ["MAKO_DIFFERENTIAL_DB"] = str(diff_db_path.absolute())
    os.environ["MAKO_MODIFICATION_DB"] = str(mod_db_path.absolute())

    print(f"Starting Mako Shiny app on port {args.port}...")
    print(f"  Differential DB: {diff_db_path.absolute()}")
    print(f"  Modification DB: {mod_db_path.absolute()}")

    run_app("src/makoview/app.py", port=args.port)  # type: ignore[call-non-callable]


if __name__ == "__main__":
    main()
