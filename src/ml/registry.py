"""ThreatLens model registry.

Saves, loads, and promotes model artifacts.

Rules:
- A version directory can never be silently overwritten.
- The production model is only promoted explicitly.
- Every artifact has a SHA-256 checksum stored alongside it.
- Metadata is stored as JSON for human inspection.

Registry layout:
    models/
    ├── registry/
    │   ├── url_model_v001/
    │   │   ├── model.joblib
    │   │   ├── metadata.json
    │   │   └── feature_schema.json
    │   └── url_model_v002/
    │       └── ...
    └── production/
        ├── model.joblib
        ├── feature_schema.json
        └── metadata.json
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib

from src.utils.logger import get_logger

log = get_logger(__name__)

# Bug 10 fix: use absolute paths so the registry works regardless of CWD.
# __file__ is src/ml/registry.py → parent.parent.parent is the project root.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_ROOT = _PROJECT_ROOT / "models" / "registry"
PRODUCTION_ROOT = _PROJECT_ROOT / "models" / "production"


def _sha256(path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def save(
    model: Any,
    feature_schema: list[str],
    metadata: dict[str, Any],
    version: str,
) -> Path:
    """Save a trained model to the registry.

    Args:
        model:          Any sklearn-compatible estimator or pipeline.
        feature_schema: Ordered list of feature names used during training.
        metadata:       Dict of model provenance / metrics. Must include at
                        minimum: algorithm, training_timestamp, dataset_version,
                        feature_version, random_seed.
        version:        Version string, e.g. "v001". Must be unique.

    Returns:
        Path to the created registry directory.

    Raises:
        FileExistsError: If *version* already exists in the registry.
    """
    dest = REGISTRY_ROOT / version
    if dest.exists():
        raise FileExistsError(
            f"Registry version '{version}' already exists at {dest}. "
            "Increment the version string — never silently overwrite."
        )

    dest.mkdir(parents=True, exist_ok=False)

    # Save model artifact
    model_path = dest / "model.joblib"
    joblib.dump(model, model_path)
    checksum = _sha256(model_path)

    # Save feature schema
    schema_path = dest / "feature_schema.json"
    with open(schema_path, "w") as f:
        json.dump({"feature_version": metadata.get("feature_version"), "features": feature_schema}, f, indent=2)

    # Enrich metadata
    metadata = {
        **metadata,
        "version": version,
        "artifact_checksum_sha256": checksum,
        "registry_path": str(dest),
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    meta_path = dest / "metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    log.info(
        f"Model saved to registry: {dest}  checksum={checksum[:12]}..."
    )
    return dest


def load(version: str) -> tuple[Any, list[str], dict[str, Any]]:
    """Load a model from the registry by version string.

    Returns:
        (model, feature_schema, metadata)
    """
    dest = REGISTRY_ROOT / version
    if not dest.exists():
        raise FileNotFoundError(f"Registry version '{version}' not found at {dest}.")

    model_path = dest / "model.joblib"
    actual_checksum = _sha256(model_path)

    with open(dest / "metadata.json") as f:
        metadata = json.load(f)

    expected = metadata.get("artifact_checksum_sha256", "")
    if actual_checksum != expected:
        raise RuntimeError(
            f"Checksum mismatch for {model_path}! "
            f"Expected {expected}, got {actual_checksum}. "
            "The artifact may have been corrupted or tampered with."
        )

    model = joblib.load(model_path)

    with open(dest / "feature_schema.json") as f:
        schema = json.load(f)
    feature_schema = schema["features"]

    log.info(f"Model loaded from registry: {dest}  checksum OK")
    return model, feature_schema, metadata


def promote(version: str) -> Path:
    """Copy a registry version to production.

    Args:
        version: Registry version string (must already exist).

    Returns:
        Path to the production directory.
    """
    src = REGISTRY_ROOT / version
    if not src.exists():
        raise FileNotFoundError(f"Registry version '{version}' not found.")

    PRODUCTION_ROOT.mkdir(parents=True, exist_ok=True)

    for fname in ("model.joblib", "feature_schema.json", "metadata.json"):
        shutil.copy2(src / fname, PRODUCTION_ROOT / fname)

    # Write a promotion record
    promo = {
        "promoted_version": version,
        "promoted_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(PRODUCTION_ROOT / "promotion.json", "w") as f:
        json.dump(promo, f, indent=2)

    log.info(f"Promoted {version} → {PRODUCTION_ROOT}")
    return PRODUCTION_ROOT


def load_production() -> tuple[Any, list[str], dict[str, Any]]:
    """Load the production model.

    Returns:
        (model, feature_schema, metadata)
    """
    model_path = PRODUCTION_ROOT / "model.joblib"
    if not model_path.exists():
        raise FileNotFoundError(
            "No production model found. Run train.py and promote a model first."
        )

    actual_checksum = _sha256(model_path)

    with open(PRODUCTION_ROOT / "metadata.json") as f:
        metadata = json.load(f)
    expected = metadata.get("artifact_checksum_sha256", "")
    if actual_checksum != expected:
        raise RuntimeError(
            f"Production model checksum mismatch! "
            f"Expected {expected}, got {actual_checksum}."
        )

    model = joblib.load(model_path)

    with open(PRODUCTION_ROOT / "feature_schema.json") as f:
        schema = json.load(f)
    feature_schema = schema["features"]

    log.info("Production model loaded  checksum OK")
    return model, feature_schema, metadata


def list_versions() -> list[str]:
    """Return sorted list of all registered version strings."""
    if not REGISTRY_ROOT.exists():
        return []
    return sorted(p.name for p in REGISTRY_ROOT.iterdir() if p.is_dir())
