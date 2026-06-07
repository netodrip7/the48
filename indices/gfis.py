"""
GFIS — Geopolitical Fragility Impact Score
The 48 | World Cup 2026 Analytics Platform

Higher score = more stable = better for the team.
Scale: 0 to 100.

Weights:
    Governance      25%
    Economic        25%
    Conflict        25%
    Football        15%
    Squad           10%
"""

import pandas as pd
import numpy as np
import os

# ── File paths ────────────────────────────────────────────────────────────────
INPUT_PATH  = r"C:/Users/Deepak Singh/Downloads/geopolitical.csv"
OUTPUT_PATH = r"C:/Users/Deepak Singh/OneDrive/Desktop/wc26/data/processed/gfis_scores.csv"

# ── Name standardisation ──────────────────────────────────────────────────────
NAME_MAP = {
    "Turkey":           "Türkiye",
    "Ivory Coast":      "Côte d'Ivoire",
    "Czech Republic":   "Czechia",
    "Congo DR":         "DR Congo",
    "USA":              "United States",
    "Korea Republic":   "South Korea",
    "Bosnia & H.":      "Bosnia and Herzegovina",
}

# ── Weights ───────────────────────────────────────────────────────────────────
WEIGHTS = {
    "governance":   0.25,
    "economic":     0.25,
    "conflict":     0.25,
    "football":     0.15,
    "squad":        0.10,
}

# ── Columns per category ──────────────────────────────────────────────────────
GOVERNANCE_COLS = [
    "control_of_corruption",
    "government_effectiveness",
    "political_stability",
    "rule_of_law",
]

ECONOMIC_COLS = [
    "gdp_per_capita",
    "gdp_growth_rate",
    "inflation_rate",
    "unemployment_rate",
]

CONFLICT_COLS = [
    "conflict_level",
    "conflict_severity",
    "active_conflict",
    "conflict_fatalities",
    "conflict_danger",
]

FOOTBALL_COLS = [
    "fifa_suspension_history",
    "state_fragility_legacy",
    "manager_changes_2022_2026",
]

SQUAD_COLS = [
    "dual_dataset_total",
    "diaspora_players_known",
    "eligibility_switchers",
    "naturalized_players",
]

# Columns where HIGHER raw value = MORE fragility (need to be inverted)
# Columns where HIGHER raw value = MORE stability (no inversion needed)
INVERT = {
    # governance: world bank indicators — higher = better governance = more stable
    "control_of_corruption":      False,
    "government_effectiveness":   False,
    "political_stability":        False,
    "rule_of_law":                False,
    # economic: higher gdp_per_capita / growth = stable; higher inflation/unemployment = fragile
    "gdp_per_capita":             False,
    "gdp_growth_rate":            False,
    "inflation_rate":             True,
    "unemployment_rate":          True,
    # conflict: all higher = more fragile
    "conflict_level":             True,
    "conflict_severity":          True,
    "active_conflict":            True,
    "conflict_fatalities":        True,
    "conflict_danger":            True,
    # football: all higher = more fragile
    "fifa_suspension_history":    True,
    "state_fragility_legacy":     True,
    "manager_changes_2022_2026":  True,
    # squad: all higher = more disruption = more fragile
    "dual_dataset_total":         True,
    "diaspora_players_known":     True,
    "eligibility_switchers":      True,
    "naturalized_players":        True,
}


def min_max_scale(series: pd.Series, invert: bool = False) -> pd.Series:
    """Scale a series to [0, 1]. If invert=True, higher raw = lower score."""
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series([0.5] * len(series), index=series.index)
    scaled = (series - mn) / (mx - mn)
    return 1 - scaled if invert else scaled


def score_category(df: pd.DataFrame, cols: list) -> pd.Series:
    """Return mean of min-max scaled columns for a category."""
    scaled = pd.DataFrame(index=df.index)
    for col in cols:
        scaled[col] = min_max_scale(df[col].fillna(df[col].median()),
                                    invert=INVERT[col])
    return scaled.mean(axis=1)


def main():
    # ── Load ──────────────────────────────────────────────────────────────────
    df = pd.read_csv(INPUT_PATH)

    # ── Standardise names ─────────────────────────────────────────────────────
    df["country"] = df["country"].replace(NAME_MAP)

    # ── Score each category ───────────────────────────────────────────────────
    df["gov_score"]      = score_category(df, GOVERNANCE_COLS)
    df["econ_score"]     = score_category(df, ECONOMIC_COLS)
    df["conflict_score"] = score_category(df, CONFLICT_COLS)
    df["football_score"] = score_category(df, FOOTBALL_COLS)
    df["squad_score"]    = score_category(df, SQUAD_COLS)

    # ── Weighted composite ────────────────────────────────────────────────────
    df["gfis_raw"] = (
        df["gov_score"]      * WEIGHTS["governance"] +
        df["econ_score"]     * WEIGHTS["economic"]   +
        df["conflict_score"] * WEIGHTS["conflict"]   +
        df["football_score"] * WEIGHTS["football"]   +
        df["squad_score"]    * WEIGHTS["squad"]
    )

    # ── Scale to 0–100 and round to 2dp ──────────────────────────────────────
    df["gfis_score"] = (df["gfis_raw"] * 100).round(2)

    # ── Rank (1 = most stable) ────────────────────────────────────────────────
    df["gfis_rank"] = df["gfis_score"].rank(ascending=False).astype(int)

    # ── Output ────────────────────────────────────────────────────────────────
    output_cols = [
        "country",
        "gfis_score",
        "gfis_rank",
        "gov_score",
        "econ_score",
        "conflict_score",
        "football_score",
        "squad_score",
    ]

    result = df[output_cols].sort_values("gfis_rank").reset_index(drop=True)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    result.to_csv(OUTPUT_PATH, index=False)

    print("GFIS complete. Output saved to:")
    print(OUTPUT_PATH)
    print()
    print(result.to_string(index=False))


if __name__ == "__main__":
    main()
