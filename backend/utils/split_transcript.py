from pprint import pprint
import typing


class Exon(typing.NamedTuple):
    chromosome: str
    start: int
    end: int
    strand: str
    type: str


def split_tx_into_regions(features: list[Exon]) -> list[Exon]:
    pprint(features)
    # note: pyranges coordinates are 0-based, half-open, while GTF is 1-based, closed
    # so we need to convert the coordinates before creating the PyRanges object
    # and convert back to 1-based closed coordinates before returning the result

    features = sorted(features, key=lambda x: x.start)
    exons = [f for f in features if f.type.lower() == "exon"]
    cds_features = [f for f in features if f.type.lower() == "cds"]

    if not cds_features:
        return exons

    cds_left = min(f.start for f in cds_features)
    cds_right = max(f.end for f in cds_features)

    left_exons, remainder = _split_exons_at(exons, cds_left)
    cds_exons, right_exons = _split_exons_at(remainder, cds_right + 1)

    # determine strand
    strand = features[0].strand

    # fmt: off
    left_exons = [e._replace(type="5UTR" if strand == "+" else "3UTR") for e in left_exons]
    right_exons = [e._replace(type="3UTR" if strand == "+" else "5UTR") for e in right_exons]
    cds_exons = [e._replace(type="CDS") for e in cds_exons]
    # fmt: on

    pprint([*left_exons, *cds_exons, *right_exons])
    return []


def _split_exons_at(exons, split_point):
    """
    Split a list of exons at a given split point. Exons that overlap the split point will be split into two.
    """
    left_exons = []
    right_exons = []
    for exon in exons:
        if exon.end <= split_point:
            left_exons.append(exon)
        elif exon.start >= split_point:
            right_exons.append(exon)
        else:
            # exon overlaps the split point, need to split it into two
            left_exons.append(
                exon._replace(
                    start=exon.start,
                    end=split_point - 1,
                )
            )
            right_exons.append(
                exon._replace(
                    start=split_point,
                    end=exon.end,
                )
            )
    return left_exons, right_exons
