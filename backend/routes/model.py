"""ML Model Metadata and Locked-Test Performance Endpoints."""
from __future__ import annotations

import json
from pathlib import Path
from fastapi import APIRouter
from backend.config import ROOT_DIR

router = APIRouter(prefix="/model", tags=["Model Information"])

EVAL_REPORT = ROOT_DIR / "reports" / "model" / "final_evaluation_report.json"
META_FILE = ROOT_DIR / "models" / "production" / "metadata.json"
FEAT_SCHEMA = ROOT_DIR / "models" / "production" / "feature_schema.json"
COMPARE_REPORT = ROOT_DIR / "reports" / "model" / "comparison_report.json"


@router.get("/info")
async def get_model_info_endpoint():
    """Retrieve active production model card and locked-test metrics."""
    eval_data = {}
    meta_data = {}
    feat_schema = {}
    
    try:
        if EVAL_REPORT.exists():
            eval_data = json.loads(EVAL_REPORT.read_text())
    except Exception:
        pass

    try:
        if META_FILE.exists():
            meta_data = json.loads(META_FILE.read_text())
    except Exception:
        pass

    try:
        if FEAT_SCHEMA.exists():
            feat_schema = json.loads(FEAT_SCHEMA.read_text())
    except Exception:
        pass

    metrics = eval_data.get("locked_test_metrics", meta_data.get("validation_metrics", {}))

    return {
        "algorithm": meta_data.get("algorithm", eval_data.get("algorithm", "RandomForest")),
        "version": meta_data.get("version", eval_data.get("model_version", "v001")),
        "calibration_method": meta_data.get("calibration_method", eval_data.get("calibration_method", "Isotonic")),
        "selected_threshold": meta_data.get("selected_threshold", eval_data.get("selected_threshold", 0.39)),
        "random_seed": meta_data.get("random_seed", 42),
        "dataset_version": meta_data.get("dataset_version", "v001"),
        "feature_version": meta_data.get("feature_version", "v001"),
        "training_timestamp": meta_data.get("training_timestamp"),
        "checksum_sha256": meta_data.get("artifact_checksum_sha256", ""),
        "locked_test_metrics": metrics,
        "feature_count": len(feat_schema.get("features", [])),
        "features": feat_schema.get("features", []),
    }


@router.get("/comparison")
async def get_model_comparison_endpoint():
    """Retrieve validation comparison across Logistic Regression, HistGB, and Random Forest."""
    try:
        if COMPARE_REPORT.exists():
            return json.loads(COMPARE_REPORT.read_text())
    except Exception:
        pass
    return {"models_evaluated": [], "best_model": "RandomForest"}
