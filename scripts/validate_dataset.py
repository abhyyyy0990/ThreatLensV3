#!/usr/bin/env python3
"""ThreatLens Phase 1 — Dataset Validation Script.

Run:
    python3 scripts/validate_dataset.py

Validates the raw dataset at data/raw/malicious_phish.csv.

Checks:
  1. File existence
  2. Required columns present
  3. Label set validity
  4. Missing-value report
  5. Malformed URL detection
  6. Class distribution
  7. Exact duplicate detection
  8. Domain-level duplicate analysis
  9. Provenance metadata
 10. Saves a structured JSON report to reports/data/dataset_validation_report.json

Does NOT modify the raw file.
Does NOT train anything.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.utils.logger import get_logger

log = get_logger("validate_dataset")

# ── Configuration ────────────────────────────────────────────
RAW_PATH = ROOT / "data" / "raw" / "malicious_phish.csv"
REPORT_DIR = ROOT / "reports" / "data"
REPORT_PATH = REPORT_DIR / "dataset_validation_report.json"

REQUIRED_COLUMNS = {"url", "type"}
VALID_LABELS = {"benign", "defacement", "phishing", "malware"}


def _extract_domain(url: str) -> str:
    """Extract registered domain (best-effort, no tldextract for speed)."""
    try:
        parsed = urllib.parse.urlparse(url if "://" in url else "http://" + url)
        return (parsed.hostname or "").lower()
    except Exception:
        return ""


def _is_malformed(url: str) -> bool:
    """Return True if url appears malformed (not parseable as a URL)."""
    if not isinstance(url, str) or not url.strip():
        return True
    try:
        parsed = urllib.parse.urlparse(url)
        return not parsed.scheme and not parsed.netloc and not parsed.path
    except Exception:
        return True


def validate() -> dict:
    """Run all validation checks and return a structured report."""
    report: dict = {
        "validated_at": datetime.now(timezone.utc).isoformat(),
        "raw_file": str(RAW_PATH),
        "errors": [],
        "warnings": [],
        "passed": False,
    }

    # ── 1. File existence ──────────────────────────────────────
    if not RAW_PATH.exists():
        msg = (
            f"Dataset file not found: {RAW_PATH}\n"
            "  → Download malicious_phish.csv from:\n"
            "    https://www.kaggle.com/datasets/sid321axn/malicious-urls-dataset\n"
            "  → Place it at: data/raw/malicious_phish.csv"
        )
        report["errors"].append(msg)
        log.error(msg)
        return report

    log.info(f"Loading dataset from {RAW_PATH} ...")
    df = pd.read_csv(RAW_PATH)
    report["n_rows_raw"] = len(df)
    report["n_cols"] = len(df.columns)
    report["columns"] = list(df.columns)
    log.info(f"Loaded {len(df):,} rows, {len(df.columns)} columns")

    # ── 2. Required columns ────────────────────────────────────
    missing_cols = REQUIRED_COLUMNS - set(df.columns)
    if missing_cols:
        msg = f"Missing required columns: {sorted(missing_cols)}"
        report["errors"].append(msg)
        log.error(msg)
        return report
    log.info("Required columns: OK")

    # Standardise column names
    df = df.rename(columns={"url": "url", "type": "label"})
    df["url"] = df["url"].astype(str)
    df["label"] = df["label"].astype(str).str.strip().str.lower()

    # ── 3. Label validation ────────────────────────────────────
    unique_labels = set(df["label"].unique())
    unknown_labels = unique_labels - VALID_LABELS
    report["unique_labels"] = sorted(unique_labels)
    if unknown_labels:
        msg = f"Unknown labels found: {sorted(unknown_labels)}"
        report["warnings"].append(msg)
        log.warning(msg)
    log.info(f"Labels: {sorted(unique_labels)}")

    # ── 4. Missing values ──────────────────────────────────────
    missing = df.isnull().sum().to_dict()
    report["missing_values"] = missing
    total_missing = sum(missing.values())
    if total_missing > 0:
        report["warnings"].append(f"Missing values detected: {missing}")
        log.warning(f"Missing values: {missing}")
    else:
        log.info("Missing values: none")

    # ── 5. Class distribution ──────────────────────────────────
    class_counts = df["label"].value_counts().to_dict()
    report["class_distribution"] = class_counts
    log.info("Class distribution:")
    for lbl, cnt in sorted(class_counts.items(), key=lambda x: -x[1]):
        pct = cnt / len(df) * 100
        log.info(f"  {lbl:<15} {cnt:>8,}  ({pct:.1f}%)")

    # ── 6. Malformed URL detection ─────────────────────────────
    malformed_mask = df["url"].apply(_is_malformed)
    n_malformed = int(malformed_mask.sum())
    report["n_malformed_urls"] = n_malformed
    if n_malformed > 0:
        report["warnings"].append(
            f"{n_malformed:,} malformed or empty URL rows detected."
        )
        log.warning(f"Malformed URLs: {n_malformed:,}")
        # Show a sample
        samples = df[malformed_mask]["url"].head(5).tolist()
        report["malformed_samples"] = samples
        log.warning(f"  Sample malformed: {samples}")
    else:
        log.info("Malformed URLs: none")

    # ── 7. Exact duplicate detection ───────────────────────────
    n_exact_dup = int(df.duplicated(subset=["url"]).sum())
    report["n_exact_duplicate_urls"] = n_exact_dup
    if n_exact_dup > 0:
        report["warnings"].append(
            f"{n_exact_dup:,} exact duplicate URLs (will be removed in prepare_data.py)."
        )
        log.warning(f"Exact duplicate URLs: {n_exact_dup:,}")
    else:
        log.info("Exact duplicates: none")

    # Check for label-inconsistent duplicates (same URL, different labels)
    dup_mask = df.duplicated(subset=["url"], keep=False)
    if dup_mask.any():
        dup_df = df[dup_mask]
        label_conflicts = (
            dup_df.groupby("url")["label"].nunique()
        )
        conflicts = int((label_conflicts > 1).sum())
        report["n_label_conflicted_urls"] = conflicts
        if conflicts > 0:
            report["warnings"].append(
                f"{conflicts:,} URLs have conflicting labels across duplicates."
            )
            log.warning(f"Label-conflicted duplicate URLs: {conflicts:,}")
    else:
        report["n_label_conflicted_urls"] = 0

    # ── 8. Domain-level duplicate analysis ─────────────────────
    log.info("Extracting domains for domain-level analysis ...")
    df["domain"] = df["url"].apply(_extract_domain)

    n_unique_domains = int(df["domain"].nunique())
    report["n_unique_domains"] = n_unique_domains

    # Top-20 most frequent domains
    top_domains = df["domain"].value_counts().head(20).to_dict()
    report["top_20_domains_by_frequency"] = {k: int(v) for k, v in top_domains.items()}
    log.info(f"Unique domains: {n_unique_domains:,}")
    log.info(f"Top domain: {list(top_domains.items())[0]}")

    # ── 9. Provenance note ─────────────────────────────────────
    report["provenance"] = {
        "source": "Kaggle: sid321axn/malicious-urls-dataset",
        "original_sources": [
            "PhishTank", "OpenPhish", "Alexa Top 1M", "Malware Domain Blocklist",
        ],
        "license": "CC0 Public Domain",
        "file": "malicious_phish.csv",
        "note": "Aggregated multi-source dataset. No timestamps available for time-aware splitting.",
    }

    # ── 10. Binary label mapping preview ──────────────────────
    binary_map = {
        "benign": 0,
        "defacement": 1,
        "phishing": 1,
        "malware": 1,
    }
    df["binary_label"] = df["label"].map(binary_map)
    n_pos = int((df["binary_label"] == 1).sum())
    n_neg = int((df["binary_label"] == 0).sum())
    imbalance_ratio = round(n_pos / max(n_neg, 1), 4)
    report["binary_distribution"] = {
        "malicious": n_pos,
        "benign": n_neg,
        "imbalance_ratio_pos_neg": imbalance_ratio,
    }
    log.info(f"Binary: malicious={n_pos:,}  benign={n_neg:,}  ratio={imbalance_ratio}")

    if imbalance_ratio > 3.0 or imbalance_ratio < 0.33:
        report["warnings"].append(
            f"Class imbalance ratio {imbalance_ratio} is significant. "
            "Consider class_weight='balanced' during training."
        )
        log.warning(f"Significant class imbalance: ratio={imbalance_ratio}")

    # ── Summary ────────────────────────────────────────────────
    report["passed"] = len(report["errors"]) == 0
    report["n_warnings"] = len(report["warnings"])
    report["n_errors"] = len(report["errors"])

    # ── Save report ────────────────────────────────────────────
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    log.info(f"Validation report saved: {REPORT_PATH}")

    return report


def main() -> None:
    log.info("=" * 56)
    log.info("ThreatLens — Dataset Validation")
    log.info("=" * 56)

    report = validate()

    print(f"\n{'='*56}")
    print(f"  DATASET VALIDATION: {'PASS' if report['passed'] else 'FAIL'}")
    print(f"{'='*56}")
    if "n_rows_raw" in report:
        print(f"  Rows loaded  : {report.get('n_rows_raw', 0):,}")
        print(f"  Errors       : {report.get('n_errors', 0)}")
        print(f"  Warnings     : {report.get('n_warnings', 0)}")
        if report.get("class_distribution"):
            print("  Label counts :")
            for lbl, cnt in sorted(report["class_distribution"].items(), key=lambda x: -x[1]):
                print(f"    {lbl:<15} {cnt:,}")
        if "binary_distribution" in report:
            bd = report["binary_distribution"]
            print(f"  Malicious    : {bd['malicious']:,}")
            print(f"  Benign       : {bd['benign']:,}")
            print(f"  Imbalance    : {bd['imbalance_ratio_pos_neg']}")
    print(f"  Report saved : {REPORT_PATH}")
    print(f"{'='*56}\n")

    if report["errors"]:
        print("ERRORS:")
        for e in report["errors"]:
            print(f"  • {e}")

    if report["warnings"]:
        print("WARNINGS:")
        for w in report["warnings"]:
            print(f"  • {w}")

    if not report["passed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
