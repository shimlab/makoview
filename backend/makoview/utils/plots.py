import io

import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

matplotlib.use("Agg")


def plot_violin_by_site(subset: pd.DataFrame, binarised: bool) -> str:
    subset = subset.copy()

    if binarised:
        subset["pmod"] = (subset["probability_modified"] >= 0.5).astype(int)
    else:
        subset["pmod"] = subset["probability_modified"]

    subset["label"] = subset["sample_name"] + " (" + subset["group_name"] + ")"
    subset.sort_values(["group_name", "sample_name"], inplace=True)
    label_order = subset["label"].unique()

    counts = subset.groupby("label")["pmod"]
    n = counts.size().reindex(label_order)
    T = counts.sum().reindex(label_order)
    F = n - T
    T_over_n = (T / n).round(3)

    if binarised:
        label_order_with_stats = [
            f"{lbl}\n(n={n[lbl]}, T={T[lbl]}, F={F[lbl]}, T/n={T_over_n[lbl]})"
            for lbl in label_order
        ]
    else:
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
    ax.set_xlabel("Sample (Group)")
    ax.set_ylabel(
        "Binarised Probability Modified" if binarised else "Probability Modified"
    )
    ax.set_title(
        "Violin Plot of Binarised Probability Modified for each Sample"
        if binarised
        else "Violin Plot of Probability Modified for each Sample"
    )
    ax.set_ylim(-0.05, 1.05)
    ax.grid(True, linestyle="--", alpha=0.6)

    buf = io.BytesIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)
    return buf.getvalue().decode("utf-8")
