from dataclasses import dataclass


@dataclass
class Exon:
    chromosome: str
    start: int
    end: int
    strand: str
    type: str


def get_ranges(features: list[Exon]) -> list[tuple[int, int]]:
    all_intervals = sorted((exon.start, exon.end) for exon in features)
    ranges = []

    for s, e in all_intervals:
        if ranges and s <= ranges[-1][1] + 1:
            ranges[-1][1] = max(ranges[-1][1], e)
        else:
            ranges.append([s, e])

    return ranges
