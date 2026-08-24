#!/usr/bin/env python3
"""ThreatLens Phase 1 — Data Preparation Script.

Run:
    python3 scripts/prepare_data.py

Pipeline:
  1. Load and validate raw dataset
  2. Normalise URLs (lowercase scheme + host)
  3. Map multi-class labels → binary (0=benign, 1=malicious)
  4. Remove exact URL duplicates
  5. Extract domain for grouping
  6. Leakage-safe domain-grouped stratified split
     Train 70% / Validation 15% / Locked test 15%
  7. Verify no domain leaks between train and test
  8. Save splits to data/splits/
  9. Save processed combined to data/processed/
 10. Generate dataset_preparation_report.json

Hard negatives are included automatically — the dataset's benign class
already contains long legitimate URLs, tracking URLs, and subdomains of
major brands that resemble phishing.

IMPORTANT: The locked test split must NEVER be used for:
  - feature selection
  - hyperparameter tuning
  - threshold tuning
  - calibration
  - model selection
"""

from __future__ import annotations

import json
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.utils.logger import get_logger

log = get_logger("prepare_data")

# ── Configuration ─────────────────────────────────────────────────────
RAW_PATH     = ROOT / "data" / "raw" / "malicious_phish.csv"
PROCESSED_DIR = ROOT / "data" / "processed"
SPLITS_DIR   = ROOT / "data" / "splits"
REPORT_DIR   = ROOT / "reports" / "data"

RANDOM_SEED        = 42
VAL_FRACTION       = 0.15   # of remaining after test split
TEST_FRACTION      = 0.15   # of total
DATASET_VERSION    = "v001"

BINARY_MAP = {
    "benign":      0,
    "defacement":  1,
    "phishing":    1,
    "malware":     1,
}


def _normalise_url(url: str) -> str:
    """Lowercase scheme and host; strip trailing slash."""
    try:
        p = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        scheme = p.scheme.lower()
        netloc = p.netloc.lower()
        rest = p.path + (("?" + p.query) if p.query else "") + (("#" + p.fragment) if p.fragment else "")
        result = f"{scheme}://{netloc}{rest}".rstrip("/")
        return result if result != f"{scheme}://" else url
    except Exception:
        return url


def _extract_domain(url: str) -> str:
    """Extract hostname for grouping (stdlib only for speed)."""
    try:
        p = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        return (p.hostname or "").lower()
    except Exception:
        return ""


def _domain_grouped_split(
    df: pd.DataFrame,
    test_frac: float,
    val_frac_of_remaining: float,
    seed: int,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split df into train/val/test using domain-level grouping.

    All samples from a given domain land in exactly one split, preventing
    domain-level leakage between train and test.

    Strategy:
      1. Extract 'test_frac' of domains → test set.
      2. Of remaining domains, extract 'val_frac_of_remaining' → val set.
      3. Remaining → train set.

    Uses GroupShuffleSplit from scikit-learn.
    """
    groups = df["domain"].values

    # Step 1: carve out test split
    gss_test = GroupShuffleSplit(n_splits=1, test_size=test_frac, random_state=seed)
    trainval_idx, test_idx = next(gss_test.split(df, df["binary_label"], groups))
    df_trainval = df.iloc[trainval_idx].reset_index(drop=True)
    df_test     = df.iloc[test_idx].reset_index(drop=True)

    # Step 2: carve validation from train+val
    groups_tv = df_trainval["domain"].values
    gss_val = GroupShuffleSplit(
        n_splits=1, test_size=val_frac_of_remaining, random_state=seed + 1
    )
    train_idx, val_idx = next(
        gss_val.split(df_trainval, df_trainval["binary_label"], groups_tv)
    )
    df_train = df_trainval.iloc[train_idx].reset_index(drop=True)
    df_val   = df_trainval.iloc[val_idx].reset_index(drop=True)

    return df_train, df_val, df_test


def _verify_no_leakage(
    df_train: pd.DataFrame,
    df_val: pd.DataFrame,
    df_test: pd.DataFrame,
) -> dict:
    """Verify no domain appears in both train and test."""
    train_domains = set(df_train["domain"].unique())
    val_domains   = set(df_val["domain"].unique())
    test_domains  = set(df_test["domain"].unique())

    train_test_overlap   = train_domains & test_domains
    val_test_overlap     = val_domains   & test_domains
    train_val_overlap    = train_domains & val_domains  # expected: some overlap with GroupShuffleSplit if domain is frequent

    return {
        "train_test_domain_overlap": len(train_test_overlap),
        "val_test_domain_overlap":   len(val_test_overlap),
        "train_val_domain_overlap":  len(train_val_overlap),
        "train_test_overlap_samples": int(
            sum(df_train["domain"].isin(train_test_overlap))
        ),
        "train_test_overlap_examples": sorted(list(train_test_overlap))[:10],
    }


def prepare() -> dict:
    """Run the full data preparation pipeline."""
    report = {
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": DATASET_VERSION,
        "random_seed": RANDOM_SEED,
        "errors": [],
    }

    # ── Load ──────────────────────────────────────────────────────────
    if not RAW_PATH.exists():
        msg = f"Dataset not found: {RAW_PATH}. Run validate_dataset.py first."
        report["errors"].append(msg)
        log.error(msg)
        return report

    log.info(f"Loading {RAW_PATH} ...")
    df = pd.read_csv(RAW_PATH)
    report["n_raw"] = len(df)
    log.info(f"Raw rows: {len(df):,}")

    # ── Rename & cast ────────────────────────────────────────────────
    df = df.rename(columns={"url": "url", "type": "label"})
    df["url"]   = df["url"].astype(str).str.strip()
    df["label"] = df["label"].astype(str).str.strip().str.lower()

    # ── Drop null / empty ────────────────────────────────────────────
    n_before = len(df)
    df = df[df["url"].str.len() > 3].copy()
    n_empty_dropped = n_before - len(df)
    report["n_empty_url_dropped"] = n_empty_dropped
    log.info(f"Empty/short URLs dropped: {n_empty_dropped:,}")

    # ── Filter to known labels only ──────────────────────────────────
    n_before = len(df)
    df = df[df["label"].isin(BINARY_MAP)].copy()
    report["n_unknown_label_dropped"] = n_before - len(df)
    log.info(f"Unknown-label rows dropped: {n_before - len(df):,}")

    # ── Normalise URLs ───────────────────────────────────────────────
    log.info("Normalising URLs ...")
    df["url_norm"] = df["url"].apply(_normalise_url)

    # ── Binary label mapping ─────────────────────────────────────────
    df["binary_label"] = df["label"].map(BINARY_MAP).astype(int)

    # Raw class distribution
    raw_dist = df["label"].value_counts().to_dict()
    report["class_distribution_raw"] = {k: int(v) for k, v in raw_dist.items()}
    binary_dist = df["binary_label"].value_counts().to_dict()
    report["binary_distribution_raw"] = {int(k): int(v) for k, v in binary_dist.items()}

    # ── Exact duplicate removal (on normalised URL) ──────────────────
    n_before = len(df)
    # Keep first occurrence; for label-conflicting dupes, benign wins
    # (conservative — reduces false positives).
    df = df.sort_values("binary_label").drop_duplicates(subset=["url_norm"], keep="first")
    n_dup_removed = n_before - len(df)
    report["n_exact_duplicates_removed"] = n_dup_removed
    log.info(f"Exact duplicates removed: {n_dup_removed:,} → {len(df):,} rows remain")

    # ── Domain extraction ─────────────────────────────────────────────
    log.info("Extracting domains for group-based splitting ...")
    df["domain"] = df["url_norm"].apply(_extract_domain)

    # Assign a numeric group id per unique domain
    domain_to_id = {d: i for i, d in enumerate(df["domain"].unique())}
    df["domain_id"] = df["domain"].map(domain_to_id)

    n_unique_domains = int(df["domain"].nunique())
    report["n_unique_domains"] = n_unique_domains
    log.info(f"Unique domains: {n_unique_domains:,}")

    # ── Domain-grouped split ─────────────────────────────────────────
    log.info(
        f"Splitting: train={1-TEST_FRACTION-VAL_FRACTION:.0%}  "
        f"val={VAL_FRACTION:.0%}  test={TEST_FRACTION:.0%}  "
        f"strategy=domain-grouped"
    )
    df_train, df_val, df_test = _domain_grouped_split(
        df,
        test_frac=TEST_FRACTION,
        val_frac_of_remaining=VAL_FRACTION / (1 - TEST_FRACTION),
        seed=RANDOM_SEED,
    )

    report["split_sizes"] = {
        "train": len(df_train),
        "validation": len(df_val),
        "test": len(df_test),
    }
    report["split_fractions"] = {
        "train": round(len(df_train) / len(df), 4),
        "validation": round(len(df_val) / len(df), 4),
        "test": round(len(df_test) / len(df), 4),
    }
    report["split_binary_distribution"] = {
        "train":      {int(k): int(v) for k, v in df_train["binary_label"].value_counts().to_dict().items()},
        "validation": {int(k): int(v) for k, v in df_val["binary_label"].value_counts().to_dict().items()},
        "test":       {int(k): int(v) for k, v in df_test["binary_label"].value_counts().to_dict().items()},
    }

    log.info(f"  Train       : {len(df_train):,}  "
             f"(pos={int((df_train.binary_label==1).sum()):,}  "
             f"neg={int((df_train.binary_label==0).sum()):,})")
    log.info(f"  Validation  : {len(df_val):,}  "
             f"(pos={int((df_val.binary_label==1).sum()):,}  "
             f"neg={int((df_val.binary_label==0).sum()):,})")
    log.info(f"  Locked Test : {len(df_test):,}  "
             f"(pos={int((df_test.binary_label==1).sum()):,}  "
             f"neg={int((df_test.binary_label==0).sum()):,})")

    # ── Leakage verification ─────────────────────────────────────────
    log.info("Verifying domain-level leakage ...")
    leakage = _verify_no_leakage(df_train, df_val, df_test)
    report["leakage_check"] = leakage

    if leakage["train_test_domain_overlap"] > 0:
        msg = (
            f"WARNING: {leakage['train_test_domain_overlap']} domains appear in "
            "BOTH train and test. Review splitting strategy."
        )
        report["errors"].append(msg)
        log.warning(msg)
    else:
        log.info("Leakage check: PASS — no train/test domain overlap")

    if leakage["val_test_domain_overlap"] > 0:
        msg = (
            f"WARNING: {leakage['val_test_domain_overlap']} domains appear in "
            "BOTH validation and test."
        )
        report["errors"].append(msg)
        log.warning(msg)

    # ── Save splits ─────────────────────────────────────────────────
    SPLITS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Keep only columns needed downstream
    keep_cols = ["url_norm", "label", "binary_label", "domain"]
    df_train[keep_cols].rename(columns={"url_norm": "url"}).to_csv(
        SPLITS_DIR / "train.csv", index=False
    )
    df_val[keep_cols].rename(columns={"url_norm": "url"}).to_csv(
        SPLITS_DIR / "validation.csv", index=False
    )
    df_test[keep_cols].rename(columns={"url_norm": "url"}).to_csv(
        SPLITS_DIR / "test.csv", index=False
    )
    log.info(f"Splits saved to {SPLITS_DIR}")

    # Combined processed file
    df[keep_cols].rename(columns={"url_norm": "url"}).to_csv(
        PROCESSED_DIR / "dataset_clean.csv", index=False
    )
    log.info(f"Processed dataset saved to {PROCESSED_DIR}/dataset_clean.csv")

    # Metadata file documenting splitting strategy
    split_meta = {
        "dataset_version": DATASET_VERSION,
        "random_seed": RANDOM_SEED,
        "splitting_strategy": "domain_grouped",
        "description": (
            "All URLs from the same registered domain land in exactly one split. "
            "Prevents domain-level leakage between train and test. "
            "Uses GroupShuffleSplit from scikit-learn."
        ),
        "split_fractions_target": {
            "train": 1 - TEST_FRACTION - VAL_FRACTION,
            "validation": VAL_FRACTION,
            "test": TEST_FRACTION,
        },
        "binary_label_map": BINARY_MAP,
        "locked_test_rule": (
            "The test split must NEVER be used for feature selection, "
            "hyperparameter tuning, threshold tuning, calibration, or model selection."
        ),
    }
    with open(SPLITS_DIR / "split_metadata.json", "w") as f:
        json.dump(split_meta, f, indent=2)

    # ── Save report ──────────────────────────────────────────────────
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_DIR / "dataset_preparation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    log.info(f"Report saved to {REPORT_DIR}/dataset_preparation_report.json")

    report["passed"] = len(report["errors"]) == 0
    return report


def main() -> None:
    log.info("=" * 60)
    log.info("ThreatLens — Data Preparation")
    log.info("=" * 60)

    report = prepare()

    status = "PASS" if report.get("passed") else "FAIL"
    print(f"\n{'='*60}")
    print(f"  DATA PREPARATION: {status}")
    print(f"{'='*60}")
    if "split_sizes" in report:
        for split, size in report["split_sizes"].items():
            frac = report["split_fractions"][split]
            print(f"  {split:<12} : {size:>8,}  ({frac:.1%})")
    if report.get("errors"):
        print("\nERRORS / WARNINGS:")
        for e in report["errors"]:
            print(f"  • {e}")
    print(f"{'='*60}\n")

    if not report.get("passed"):
        sys.exit(1)


if __name__ == "__main__":
    main()
