from shiny.types import SilentException
from shiny.express import input, render, ui
from shiny import reactive
import duckdb
import os
import pandas as pd
from pathlib import Path

import shinyswatch

import plots

_db_path = os.environ["MAKO_DIFFERENTIAL_DB"]
_reads_path = os.environ["MAKO_MODIFICATION_DB"]

# Validate that database files exist
if not os.path.exists(_db_path):
    raise FileNotFoundError(f"Differential sites database not found: {_db_path}")
if not os.path.exists(_reads_path):
    raise FileNotFoundError(f"Modification database not found: {_reads_path}")


# load from db into a Pandas dataframe in-memory for faster access
def load_data_into_memory(db_path) -> pd.DataFrame:
    conn = duckdb.connect(database=db_path, read_only=True)
    df = conn.execute("SELECT * FROM sites").fetchdf()
    conn.close()
    return df


df = load_data_into_memory(_db_path)


# UI Definition
ui.page_opts(title="makoview", theme=shinyswatch.theme.lumen)
ui.include_css(Path(__file__).parent / "styles.css")
# ui.page_opts(title="Mako modification lookup", fillable=True)

read_cache: reactive.Value[pd.DataFrame] = reactive.value()


with ui.sidebar(width="400px", open="always"):
    with ui.card(fill=False):
        ui.card_header("Search for a transcript...")
        # with ui.layout_columns(col_widths=(8, 4), gap="0.75rem", row_heights="auto"):
        ui.input_text(
            "transcript_id",
            "Transcript ID",
            placeholder="e.g. ENST00000000233.10",
            width="100%",
        )

        ui.input_selectize(
            "transcript_position",
            "Transcript Position",
            choices=[],
            multiple=False,
            options={
                "placeholder": "transcript not found...",
                "dropdownParent": "body",
            },
            width="100%",
        )
        ui.input_action_button(
            "search_btn", "Search", class_="btn-primary", style="margin-top: 0.5rem;"
        )

    @render.data_frame
    @reactive.event(input.search_btn, ignore_none=False)
    def on_search():
        """Generate boxplot of probability_modified by group and sample."""
        transcript_id: str = input.transcript_id()
        transcript_position: int = input.transcript_position()

        if not transcript_id or not transcript_id.strip():
            return None

        # Get matching reads as a dataframe
        reads_df = get_matching_reads(transcript_id.strip(), int(transcript_position))

        site_df = df.loc[
            (df["transcript_id"] == transcript_id.strip())
            & (df["transcript_position"] == int(transcript_position))
        ]
        site_df_tidy = site_df.melt(var_name="column", value_name="value")

        read_cache.set(reads_df)

        return render.DataGrid(data=site_df_tidy, width="100%", height="auto")


def get_matching_reads(transcript_id: str, transcript_position: int) -> pd.DataFrame:
    """
    Find rnames for the given transcript_id and transcript_position,
    then query reads database for matching non-ignored reads.
    """
    # Find matching rnames from the sites dataframe
    matching_rnames = (
        df.loc[
            (df["transcript_id"] == transcript_id)
            & (df["transcript_position"] == transcript_position),
            "rname",
        ]
        .unique()
        .tolist()
    )

    print(matching_rnames)

    if not matching_rnames:
        return pd.DataFrame()

    # Query reads database for matching, non-ignored reads
    conn = duckdb.connect(database=_reads_path, read_only=True)

    # Use parameterized query to avoid SQL injection
    placeholders = ", ".join(["?" for _ in matching_rnames])
    query = f"""
        SELECT * FROM reads
        WHERE rname IN ({placeholders})
          AND transcript_position = {transcript_position}
          AND ignored = FALSE
    """

    reads_df = conn.execute(query, matching_rnames).fetchdf()
    conn.close()

    return reads_df


# Server logic
@reactive.effect
@reactive.event(input.transcript_id)
def update_transcript_pos():
    """Update the transcript position options based on the entered transcript ID."""
    transcript_id: str = input.transcript_id()

    if transcript_id and transcript_id.strip():
        positions = df.loc[
            df["transcript_id"] == transcript_id.strip(), "transcript_position"
        ].unique()
        positions = sorted(positions.tolist())
    else:
        positions = []

    ui.update_selectize(
        "transcript_position",
        choices=positions,
    )


@render.data_frame
def plot_counts():
    try:
        subset = read_cache.get()
    except SilentException:
        return None

    binarized_df = (
        subset.groupby(["sample_name", "group_name"])
        .agg(
            successes=("probability_modified", lambda x: (x >= 0.5).sum()),
            failures=("probability_modified", lambda x: (x < 0.5).sum()),
        )
        .sort_values(["group_name", "sample_name"])
        .reset_index()
    )

    return binarized_df


@render.plot(height=750)
def plot_modification():
    try:
        subset = read_cache.get()
    except SilentException:
        return None

    return plots.plot_binarised_violin_by_site(subset)
