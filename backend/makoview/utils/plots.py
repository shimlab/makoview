from pylab import axis
import io

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

matplotlib.use("Agg")


def plot_violin_by_site(subset: pd.DataFrame) -> str:
    subset["pmod"] = subset["probability_modified"]

    subset["label"] = subset["sample_name"] + " (" + subset["group_name"] + ")"
    label_order = subset["label"].unique()
    counts = subset.groupby("label")["pmod"]
    n = counts.size().reindex(label_order)
    label_order_with_stats = [f"{lbl}\n(n={n[lbl]})" for lbl in label_order]

    fig, ax = plt.subplots(1, 1, figsize=(max(10, len(label_order) * 1.5), 8))

    sns.violinplot(
        data=subset,
        x="label",
        y="pmod",
        order=label_order,
        inner=None,
        density_norm="width",
        cut=0,
        color="skyblue",
        ax=ax,
    )

    sns.boxplot(
        data=subset,
        x="label",
        y="pmod",
        order=label_order,
        showcaps=True,
        width=0.15,
        boxprops={"facecolor": "white", "edgecolor": "black", "linewidth": 1},
        whiskerprops={"color": "black", "linewidth": 1},
        capprops={"color": "black", "linewidth": 1},
        medianprops={"color": "black", "linewidth": 1},
        showfliers=False,
        ax=ax,
    )

    sns.stripplot(
        data=subset,
        x="label",
        y="pmod",
        order=label_order,
        color="black",
        size=3,
        jitter=True,
        alpha=0.5,
        ax=ax,
    )

    stats = subset.groupby("label")["pmod"].agg(["mean", "std"]).reindex(label_order)

    for j, label in enumerate(label_order):
        mean_val = stats.loc[label, "mean"]
        std_val = stats.loc[label, "std"]

        ax.plot(j, mean_val, "o", color="red", markersize=6)

        ymin = max(0, mean_val - std_val)
        ymax = min(1, mean_val + std_val)
        ax.errorbar(
            j,
            mean_val,
            yerr=[[mean_val - ymin], [ymax - mean_val]],
            fmt="none",
            ecolor="red",
            elinewidth=1,
            capsize=5,
        )

    ax.set_xticks(range(len(label_order)))
    ax.set_xticklabels(label_order_with_stats, rotation=45, ha="right")
    ax.set_xlabel("")
    ax.set_ylabel("Probability Modified")
    ax.set_title("Violin Plot of Probability Modified for each Sample")
    ax.set_ylim(-0.05, 1.05)
    ax.grid(True, linestyle="--", alpha=0.6)

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)
    return buf.getvalue().decode("utf-8")


def plot_binarised_sites(subset: pd.DataFrame, threshold: float) -> str:
    """
    Plot binarised modification probability (stacked T/F) for a given site.
    Includes:
      1) Per-sample plot
      2) Group aggregated plot (read-level aggregation)
      3) Sample-averaged plot (mean of sample means per group)
    """

    subset["label"] = subset["sample_name"] + " (" + subset["group_name"] + ")"
    label_order = subset["label"].unique()
    n = subset.groupby("label").size()
    label_order_with_stats = [f"{lbl}\n(n={n[lbl]})" for lbl in label_order]

    subset["modified"] = subset["probability_modified"] > threshold
    subset["full"] = 1

    fig, ax = plt.subplots(figsize=(9, 5))

    # grey background bars (full height)
    sns.barplot(
        data=subset,
        x="label",
        y="full",
        order=label_order,
        color="lightgrey",
        ax=ax,
        errorbar=None,
    )

    # blue bars = proportion classified True
    sns.barplot(
        data=subset,
        x="label",
        y="modified",
        errorbar=None,
        order=label_order,
        color="skyblue",
        ax=ax,
    )

    stats = (
        subset.groupby("label")["modified"]
        .agg(mean="mean", sem=lambda x: x.sem(ddof=0))
        .reindex(label_order)
    )

    ax.errorbar(
        x=range(len(label_order)),
        y=stats["mean"],
        yerr=2 * stats["sem"],
        fmt="o",
        color="black",
        elinewidth=1,
        capsize=5,
        antialiased=False,
    )

    ax.hlines(
        y=stats["mean"],
        xmin=np.arange(len(label_order)) - 0.4,
        xmax=np.arange(len(label_order)) + 0.4,
        color="black",
        linewidth=1,
    )

    ax.set_xticks(range(len(label_order)))
    ax.set_xticklabels(label_order_with_stats, rotation=45, ha="right")
    ax.set_xlabel("")
    ax.set_ylabel("Proportion of Reads")

    plt.tight_layout()

    buf = io.StringIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)

    return buf.getvalue()
