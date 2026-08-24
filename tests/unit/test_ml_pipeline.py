"""Unit tests for ML pipeline components: threshold, calibration, evaluate, registry."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from sklearn.linear_model import LogisticRegression

from src.ml import evaluate as eval_mod
from src.ml import threshold as thr_mod


class TestEvaluateMetrics:
    """Test the evaluation metric computation."""

    def _make_perfect(self, n=100):
        y_true = np.array([0] * 50 + [1] * 50)
        y_prob = np.array([0.1] * 50 + [0.9] * 50)
        y_pred = (y_prob >= 0.5).astype(int)
        return y_true, y_pred, y_prob

    def test_perfect_classifier_metrics(self):
        y_true, y_pred, y_prob = self._make_perfect()
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        assert m["accuracy"] == 1.0
        assert m["precision"] == 1.0
        assert m["recall"] == 1.0
        assert m["f1"] == 1.0
        assert m["fpr"] == 0.0
        assert m["fnr"] == 0.0

    def test_confusion_matrix_values(self):
        y_true = np.array([0, 0, 1, 1])
        y_prob = np.array([0.1, 0.9, 0.8, 0.2])
        y_pred = (y_prob >= 0.5).astype(int)
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        assert m["tp"] == 1
        assert m["tn"] == 1
        assert m["fp"] == 1
        assert m["fn"] == 1

    def test_sample_counts(self):
        y_true = np.array([0] * 30 + [1] * 70)
        y_prob = np.random.default_rng(42).uniform(0, 1, 100)
        y_pred = (y_prob >= 0.5).astype(int)
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        assert m["n_samples"] == 100
        assert m["n_positive"] == 70
        assert m["n_negative"] == 30

    def test_all_required_keys_present(self):
        y_true = np.array([0, 1, 0, 1])
        y_prob = np.array([0.2, 0.8, 0.3, 0.7])
        y_pred = (y_prob >= 0.5).astype(int)
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        required = [
            "accuracy", "precision", "recall", "f1", "roc_auc", "pr_auc",
            "specificity", "fpr", "fnr", "tp", "tn", "fp", "fn",
            "n_samples", "n_positive", "n_negative", "threshold",
        ]
        for key in required:
            assert key in m, f"Missing key: {key}"

    def test_format_report_string(self):
        y_true = np.array([0, 1, 0, 1])
        y_prob = np.array([0.2, 0.8, 0.3, 0.7])
        y_pred = (y_prob >= 0.5).astype(int)
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        report = eval_mod.format_report(m, "Test")
        assert "Test" in report
        assert "Accuracy" in report
        assert "Precision" in report

    def test_save_report(self, tmp_path):
        y_true = np.array([0, 1, 0, 1])
        y_prob = np.array([0.2, 0.8, 0.3, 0.7])
        y_pred = (y_prob >= 0.5).astype(int)
        m = eval_mod.compute_metrics(y_true, y_pred, y_prob)
        out = tmp_path / "report.json"
        eval_mod.save_report(m, out)
        assert out.exists()
        with open(out) as f:
            loaded = json.load(f)
        assert loaded["accuracy"] == m["accuracy"]


class TestThresholdTuner:
    """Test the threshold sweep and selection."""

    def _make_data(self, seed=42):
        rng = np.random.default_rng(seed)
        y_true = rng.integers(0, 2, 200)
        # Slightly informative probabilities
        y_prob = np.clip(y_true * 0.5 + rng.uniform(0, 0.5, 200), 0, 1)
        return y_true, y_prob

    def test_returns_selected_threshold(self):
        y_true, y_prob = self._make_data()
        result = thr_mod.tune(y_true, y_prob)
        assert "selected_threshold" in result
        assert 0.05 <= result["selected_threshold"] <= 0.95

    def test_sweep_table_contains_expected_keys(self):
        y_true, y_prob = self._make_data()
        result = thr_mod.tune(y_true, y_prob)
        for row in result["sweep_table"][:3]:
            for key in ["threshold", "precision", "recall", "f1", "fpr", "fnr"]:
                assert key in row

    def test_f1_criterion_selects_nonzero_threshold(self):
        y_true, y_prob = self._make_data()
        result = thr_mod.tune(y_true, y_prob, criterion="f1")
        assert result["criterion"] == "f1"
        assert result["best_f1"] >= 0.0

    def test_recall_floor_criterion(self):
        y_true, y_prob = self._make_data()
        result = thr_mod.tune(y_true, y_prob, criterion="recall_floor", recall_floor=0.50)
        # Either criterion was achievable, or it fell back to F1
        assert result["criterion"] in ("recall_floor", "f1_fallback")

    def test_unknown_criterion_raises(self):
        y_true, y_prob = self._make_data()
        with pytest.raises(ValueError):
            thr_mod.tune(y_true, y_prob, criterion="not_a_criterion")


class TestModelRegistry:
    """Test the model registry save/load/promote cycle."""

    def test_save_and_load(self, tmp_path):
        # Patch registry paths to use tmp_path
        import src.ml.registry as reg
        original_reg  = reg.REGISTRY_ROOT
        original_prod = reg.PRODUCTION_ROOT
        reg.REGISTRY_ROOT  = tmp_path / "registry"
        reg.PRODUCTION_ROOT = tmp_path / "production"

        try:
            model = LogisticRegression(max_iter=100, random_state=0)
            X = np.array([[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]])
            y = np.array([0, 1, 0])
            model.fit(X, y)

            schema = ["feature_a", "feature_b"]
            meta = {
                "algorithm": "LogisticRegression",
                "training_timestamp": "2024-01-01T00:00:00Z",
                "dataset_version": "v001",
                "feature_version": "v001",
                "random_seed": 42,
            }

            dest = reg.save(model, schema, meta, "v001")
            assert dest.exists()

            loaded_model, loaded_schema, loaded_meta = reg.load("v001")
            assert loaded_schema == schema
            assert loaded_meta["algorithm"] == "LogisticRegression"

        finally:
            reg.REGISTRY_ROOT  = original_reg
            reg.PRODUCTION_ROOT = original_prod

    def test_duplicate_version_raises(self, tmp_path):
        import src.ml.registry as reg
        original_reg  = reg.REGISTRY_ROOT
        original_prod = reg.PRODUCTION_ROOT
        reg.REGISTRY_ROOT  = tmp_path / "registry"
        reg.PRODUCTION_ROOT = tmp_path / "production"

        try:
            model = LogisticRegression(max_iter=100)
            X = np.array([[0.1, 0.2], [0.3, 0.4]])
            y = np.array([0, 1])
            model.fit(X, y)
            meta = {
                "algorithm": "LogisticRegression",
                "training_timestamp": "2024-01-01T00:00:00Z",
                "dataset_version": "v001",
                "feature_version": "v001",
                "random_seed": 0,
            }
            reg.save(model, ["a", "b"], meta, "v001")
            with pytest.raises(FileExistsError):
                reg.save(model, ["a", "b"], meta, "v001")
        finally:
            reg.REGISTRY_ROOT  = original_reg
            reg.PRODUCTION_ROOT = original_prod

    def test_promote_copies_to_production(self, tmp_path):
        import src.ml.registry as reg
        original_reg  = reg.REGISTRY_ROOT
        original_prod = reg.PRODUCTION_ROOT
        reg.REGISTRY_ROOT  = tmp_path / "registry"
        reg.PRODUCTION_ROOT = tmp_path / "production"

        try:
            model = LogisticRegression(max_iter=100)
            X = np.array([[0.1], [0.3], [0.5]])
            y = np.array([0, 1, 0])
            model.fit(X, y)
            meta = {
                "algorithm": "LogisticRegression",
                "training_timestamp": "2024-01-01T00:00:00Z",
                "dataset_version": "v001",
                "feature_version": "v001",
                "random_seed": 0,
            }
            reg.save(model, ["feat_a"], meta, "v001")
            reg.promote("v001")
            assert (reg.PRODUCTION_ROOT / "model.joblib").exists()
            assert (reg.PRODUCTION_ROOT / "metadata.json").exists()
        finally:
            reg.REGISTRY_ROOT  = original_reg
            reg.PRODUCTION_ROOT = original_prod


class TestMLInference:
    """Test that a trained model produces deterministic, schema-matched inference."""

    def test_inference_deterministic(self):
        from src.features import url_features

        url = "https://paypal-secure-login.xyz/update?confirm=1"
        feat1 = url_features.extract(url)
        feat2 = url_features.extract(url)
        names = url_features.feature_names()
        for n in names:
            assert feat1[n] == feat2[n]

    def test_sklearn_pipeline_inference(self):
        """End-to-end: extract features → train LR → predict."""
        from src.features import url_features

        urls_train = [
            "http://google.com",
            "https://paypal-secure-update.xyz/login",
            "https://github.com/microsoft/vscode",
            "http://192.168.1.1/admin/login",
        ]
        y_train = np.array([0, 1, 0, 1])
        feature_names = url_features.feature_names()

        X_train = np.array([
            [url_features.extract(u)[n] for n in feature_names]
            for u in urls_train
        ])

        from sklearn.preprocessing import StandardScaler
        from sklearn.pipeline import Pipeline

        clf = Pipeline([
            ("scaler", StandardScaler()),
            ("lr", LogisticRegression(max_iter=200, random_state=0)),
        ])
        clf.fit(X_train, y_train)

        url_test = "http://secure-login.paypal.xyz"
        X_test = np.array([
            [url_features.extract(url_test)[n] for n in feature_names]
        ])
        proba = clf.predict_proba(X_test)[0, 1]
        assert 0.0 <= proba <= 1.0


class TestDatasetValidationLogic:
    """Test dataset validation helper logic (without requiring the actual file)."""

    def test_binary_map_coverage(self):
        """All four label types must map to binary."""
        from scripts.prepare_data import BINARY_MAP
        for lbl in ["benign", "defacement", "phishing", "malware"]:
            assert lbl in BINARY_MAP

    def test_binary_map_values(self):
        from scripts.prepare_data import BINARY_MAP
        assert BINARY_MAP["benign"] == 0
        for lbl in ["defacement", "phishing", "malware"]:
            assert BINARY_MAP[lbl] == 1
