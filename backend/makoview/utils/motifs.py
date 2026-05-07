from itertools import product
from functools import cache

IUPAC = {
    "D": ["A", "G", "T"],
    "R": ["A", "G"],
    "A": ["A"],
    "C": ["C"],
    "H": ["A", "C", "T"],
}


@cache
def DRACH() -> list[str]:
    motifs = ["".join(combo) for combo in product(*[IUPAC[b] for b in "DRACH"])]
    return motifs
