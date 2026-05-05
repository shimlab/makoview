import typing
from dataclasses import dataclass, replace


@dataclass
class Exon:
    chromosome: str
    start: int
    end: int
    strand: str
    type: str


def split_tx_into_regions(features: list[Exon]) -> list[Exon]:
    features = sorted(features, key=lambda x: x.start)
    exons = [f for f in features if f.type.lower() == "exon"]
    cds_features = [f for f in features if f.type.lower() == "cds"]
    utr_features = [f for f in features if "utr" in f.type.lower()]

    if not cds_features:
        return exons

    cds_left = min(f.start for f in cds_features)
    cds_right = max(f.end for f in cds_features)

    left_utrs = [f for f in utr_features if f.end <= cds_left]
    right_utrs = [f for f in utr_features if f.start >= cds_right]

    # determine strand
    strand = features[0].strand

    # fmt: off
    left_exons = [replace(e, type="5UTR" if strand == "+" else "3UTR") for e in left_utrs]
    right_exons = [replace(e, type="3UTR" if strand == "+" else "5UTR") for e in right_utrs]
    cds_exons = [replace(e, type="CDS") for e in cds_features]
    # fmt: on

    return [*left_exons, *cds_exons, *right_exons]


def get_ranges(features: list[Exon]) -> list[tuple[int, int]]:
    all_intervals = sorted((exon.start, exon.end) for exon in features)
    ranges = []

    for s, e in all_intervals:
        if ranges and s <= ranges[-1][1]:
            ranges[-1][1] = max(ranges[-1][1], e)
        else:
            ranges.append([s, e])

    return ranges
