"""Basic Phase 0 project validation."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "app.py",
    "requirements.txt",
    ".env.example",
    ".gitignore",
    "PRD.md",
    "AGENTS.md",
    "ARCHITECTURE.md",
    "MODEL_CARD.md",
    "DATASET_SPEC.md",
    "API_SPEC.md",
    "SECURITY.md",
    "TEST_PLAN.md",
    "ROADMAP.md",
]

REQUIRED_DIRS = [
    "data/raw",
    "data/processed",
    "data/splits",
    "models/registry",
    "models/production",
    "src/ml",
    "src/features",
    "src/threat_intel",
    "src/engine",
    "tests/unit",
    "tests/integration",
    "tests/regression",
    "tests/security",
]

missing = [x for x in REQUIRED if not (ROOT / x).exists()]
missing_dirs = [x for x in REQUIRED_DIRS if not (ROOT / x).is_dir()]

if missing or missing_dirs:
    print("FOUNDATION FAILED")
    if missing:
        print("Missing files:", ", ".join(missing))
    if missing_dirs:
        print("Missing directories:", ", ".join(missing_dirs))
    raise SystemExit(1)

print("ThreatLens V3 foundation: PASS")
