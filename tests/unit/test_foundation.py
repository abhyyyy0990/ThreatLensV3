from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_foundation_files_exist():
    assert (ROOT / "run.py").exists() or (ROOT / "backend/main.py").exists()
    assert (ROOT / "requirements.txt").exists()
    assert (ROOT / ".env.example").exists()


def test_ml_structure_exists():
    assert (ROOT / "src/ml").is_dir()
    assert (ROOT / "models/registry").is_dir()
    assert (ROOT / "models/production").is_dir()


def test_data_structure_exists():
    assert (ROOT / "data/raw").is_dir()
    assert (ROOT / "data/processed").is_dir()
    assert (ROOT / "data/splits").is_dir()
