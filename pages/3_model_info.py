"""ThreatLens V3 — Model Info page.

Shows real ML model card from production artifacts.
Uses native Streamlit + st.dataframe. No HTML table f-strings.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.ui.style import (
    info_box, inject_css, kv_row, section_header,
    sidebar_nav, spacer,
)

st.set_page_config(
    page_title="ThreatLens — Model Info",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# ── Sidebar ────────────────────────────────────────────────────────────
selected = sidebar_nav("🔍  Model Info")
if selected == "🏠  Dashboard":
    st.switch_page("app.py")
elif selected == "🔗  URL Scanner":
    st.switch_page("pages/1_url_scanner.py")
elif selected == "📧  Email Scanner":
    st.switch_page("pages/2_email_scanner.py")

# ── Load artifacts ─────────────────────────────────────────────────────
EVAL_REPORT    = ROOT / "reports" / "model" / "final_evaluation_report.json"
META_FILE      = ROOT / "models"  / "production" / "metadata.json"
FEAT_SCHEMA    = ROOT / "models"  / "production" / "feature_schema.json"
COMPARE_REPORT = ROOT / "reports" / "model" / "comparison_report.json"

eval_data: dict = {}
meta_data: dict = {}
feat_schema: dict = {}
compare_data: dict = {}

for path, target in [
    (EVAL_REPORT, "eval_data"),
    (META_FILE,   "meta_data"),
    (FEAT_SCHEMA, "feat_schema"),
    (COMPARE_REPORT, "compare_data"),
]:
    try:
        locals()[target] = json.loads(path.read_text())
    except Exception:
        pass

metrics  = eval_data.get("locked_test_metrics",
           meta_data.get("validation_metrics", {}))

# ── Page header ────────────────────────────────────────────────────────
section_header(
    "Model Info",
    "Production ML model card — ThreatLens URL Classifier v001",
)
spacer(16)

# ── KPI row (5 metrics) ────────────────────────────────────────────────
k1, k2, k3, k4, k5 = st.columns(5, gap="small")
kpi_items = [
    (k1, "F1 Score",  metrics.get("f1", 0),        "#004ac6"),
    (k2, "Precision", metrics.get("precision", 0),  "#2b6954"),
    (k3, "Recall",    metrics.get("recall", 0),     "#191c1e"),
    (k4, "ROC-AUC",   metrics.get("roc_auc", 0),   "#191c1e"),
    (k5, "PR-AUC",    metrics.get("pr_auc", 0),    "#191c1e"),
]
for col, label, val, color in kpi_items:
    with col:
        st.metric(label, f"{val:.4f}")

spacer(20)

# ── Two-column body ────────────────────────────────────────────────────
left, right = st.columns([1, 1], gap="large")

with left:
    # ── Model config card ──────────────────────────────────────────────
    st.markdown(
        '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
        'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 12px 0">'
        "Model Configuration</p>",
        unsafe_allow_html=True,
    )

    alg  = eval_data.get("algorithm",            meta_data.get("algorithm", "—"))
    ver  = eval_data.get("model_version",         meta_data.get("version", "—"))
    cal  = eval_data.get("calibration_method",    meta_data.get("calibration_method", "—"))
    thr  = eval_data.get("selected_threshold",    meta_data.get("selected_threshold", "—"))
    seed = meta_data.get("random_seed", "—")
    ds_v = meta_data.get("dataset_version", "—")
    fv   = meta_data.get("feature_version", "—")
    ts   = (meta_data.get("training_timestamp", "—") or "—")[:19]
    chk  = meta_data.get("artifact_checksum_sha256", "—")

    kv_row("Algorithm",     alg)
    kv_row("Version",       ver,  mono=True, color="#004ac6")
    kv_row("Calibration",   cal)
    kv_row("Threshold",     str(thr), mono=True)
    kv_row("Random Seed",   str(seed), mono=True)
    kv_row("Dataset Ver.",  ds_v, mono=True)
    kv_row("Feature Ver.",  fv,   mono=True)
    kv_row("Trained At",    ts,   mono=True)

    if chk and chk != "—":
        st.markdown(
            f'<p style="font-size:11px;color:#737686;margin-top:10px;word-break:break-all">'
            f'SHA-256: <code style="font-size:10px">{chk[:48]}…</code></p>',
            unsafe_allow_html=True,
        )
    st.markdown("</div>", unsafe_allow_html=True)

    spacer(14)

    # ── Confusion matrix ───────────────────────────────────────────────
    tp = metrics.get("tp", 0)
    tn = metrics.get("tn", 0)
    fp = metrics.get("fp", 0)
    fn = metrics.get("fn", 0)

    if tp or tn:
        st.markdown(
            '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
            'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
            unsafe_allow_html=True,
        )
        n_samples = metrics.get("n_samples", 0)
        st.markdown(
            f'<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 4px 0">'
            f'Confusion Matrix</p>'
            f'<p style="font-size:12px;color:#737686;margin:0 0 12px 0">'
            f'Locked test · n={n_samples:,} samples</p>',
            unsafe_allow_html=True,
        )
        cm_df = pd.DataFrame(
            {
                "Predicted Safe":      [f"TN  {tn:,}", f"FN  {fn:,}"],
                "Predicted Malicious": [f"FP  {fp:,}", f"TP  {tp:,}"],
            },
            index=["Actually Safe", "Actually Malicious"],
        )
        st.dataframe(cm_df, use_container_width=True)

        fpr_v = metrics.get("fpr", 0)
        fnr_v = metrics.get("fnr", 0)
        st.markdown(
            f'<p style="font-size:12px;color:#737686;margin-top:8px">'
            f'FPR (false alarm): <strong style="color:#b45309">{fpr_v:.2%}</strong>'
            f'&nbsp;·&nbsp;FNR (miss rate): <strong style="color:#ba1a1a">{fnr_v:.2%}</strong></p>',
            unsafe_allow_html=True,
        )
        st.markdown("</div>", unsafe_allow_html=True)

with right:
    # ── Full metrics table ─────────────────────────────────────────────
    st.markdown(
        '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
        'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 4px 0">'
        "Locked Test Metrics</p>"
        '<p style="font-size:12px;color:#737686;margin:0 0 12px 0">'
        "Authoritative — held-out set, never used for tuning</p>",
        unsafe_allow_html=True,
    )

    metric_rows = [
        ("Accuracy",    metrics.get("accuracy",    0)),
        ("Precision",   metrics.get("precision",   0)),
        ("Recall",      metrics.get("recall",      0)),
        ("F1 Score",    metrics.get("f1",          0)),
        ("ROC-AUC",     metrics.get("roc_auc",     0)),
        ("PR-AUC",      metrics.get("pr_auc",      0)),
        ("Specificity", metrics.get("specificity", 0)),
        ("FPR",         metrics.get("fpr",         0)),
        ("FNR",         metrics.get("fnr",         0)),
    ]
    met_df = pd.DataFrame(
        {"Metric": [r[0] for r in metric_rows],
         "Value":  [f"{r[1]:.4f}" for r in metric_rows],
         "%":      [f"{r[1]:.1%}" for r in metric_rows]},
    )
    st.dataframe(
        met_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Metric": st.column_config.TextColumn("Metric", width="medium"),
            "Value":  st.column_config.TextColumn("Value",  width="small"),
            "%":      st.column_config.TextColumn("%",       width="small"),
        },
    )
    st.markdown("</div>", unsafe_allow_html=True)

    spacer(14)

    # ── Feature schema ─────────────────────────────────────────────────
    features = feat_schema.get("features", [])
    if features:
        st.markdown(
            '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
            'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 4px 0">'
            f'Feature Schema</p>'
            f'<p style="font-size:12px;color:#737686;margin:0 0 12px 0">'
            f'{len(features)} features · version {feat_schema.get("feature_version","—")}</p>',
            unsafe_allow_html=True,
        )
        feat_df = pd.DataFrame({
            "#":       list(range(1, len(features) + 1)),
            "Feature": features,
        })
        st.dataframe(
            feat_df,
            use_container_width=True,
            hide_index=True,
            height=300,
            column_config={
                "#":       st.column_config.NumberColumn("#", width="small"),
                "Feature": st.column_config.TextColumn("Feature Name", width="large"),
            },
        )
        st.markdown("</div>", unsafe_allow_html=True)

# ── Model comparison ───────────────────────────────────────────────────
candidates = compare_data.get("models_evaluated", [])
if candidates:
    spacer(20)
    st.markdown(
        '<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 10px 0">'
        "Model Comparison — Validation Set (threshold=0.50)</p>",
        unsafe_allow_html=True,
    )

    best_model = compare_data.get("best_model", "")
    comp_rows = []
    for c in candidates:
        name = c.get("model", "—")
        comp_rows.append({
            "Model":     name + (" ★" if name == best_model else ""),
            "F1":        f"{c.get('f1',0):.4f}",
            "Precision": f"{c.get('precision',0):.4f}",
            "Recall":    f"{c.get('recall',0):.4f}",
            "ROC-AUC":   f"{c.get('roc_auc',0):.4f}",
            "PR-AUC ↑":  f"{c.get('pr_auc',0):.4f}",
            "FPR":       f"{c.get('fpr',0):.4f}",
        })

    comp_df = pd.DataFrame(comp_rows)
    st.dataframe(
        comp_df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Model":     st.column_config.TextColumn("Model",    width="medium"),
            "F1":        st.column_config.TextColumn("F1",       width="small"),
            "Precision": st.column_config.TextColumn("Precision",width="small"),
            "Recall":    st.column_config.TextColumn("Recall",   width="small"),
            "ROC-AUC":   st.column_config.TextColumn("ROC-AUC", width="small"),
            "PR-AUC ↑":  st.column_config.TextColumn("PR-AUC ↑",width="small"),
            "FPR":       st.column_config.TextColumn("FPR",      width="small"),
        },
    )
    info_box(
        "Selection criterion: highest <strong>PR-AUC</strong> on validation set. "
        "PR-AUC is preferred over ROC-AUC for imbalanced threat detection — "
        "it directly measures precision–recall tradeoff without being inflated by the large TN count."
    )
