"""ThreatLens V3 — Dashboard.

Uses native Streamlit components (st.metric, st.dataframe, st.columns)
styled with CSS overrides to match the Stitch design exactly.
No complex HTML strings that could render as raw text.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from src.storage import db
from src.ui.style import (
    badge, inject_css, kv_row, section_header,
    sidebar_nav, spacer,
)

# ── Page config ────────────────────────────────────────────────────────
st.set_page_config(
    page_title="ThreatLens — Dashboard",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# ── Sidebar / navigation ───────────────────────────────────────────────
selected = sidebar_nav("🏠  Dashboard")
if selected == "🔗  URL Scanner":
    st.switch_page("pages/1_url_scanner.py")
elif selected == "📧  Email Scanner":
    st.switch_page("pages/2_email_scanner.py")
elif selected == "🔍  Model Info":
    st.switch_page("pages/3_model_info.py")

# ── Load data ──────────────────────────────────────────────────────────
EVAL_REPORT = ROOT / "reports" / "model" / "final_evaluation_report.json"
MODEL_META  = ROOT / "models"  / "production" / "metadata.json"

eval_data: dict = {}
model_meta: dict = {}
try:
    eval_data  = json.loads(EVAL_REPORT.read_text())
except Exception:
    pass
try:
    model_meta = json.loads(MODEL_META.read_text())
except Exception:
    pass

stats  = db.fetch_stats()
recent = db.fetch_recent(limit=25)

# ── Page heading ───────────────────────────────────────────────────────
section_header("Dashboard", "Threat intelligence overview · ThreatLens V3")
spacer(16)

# ── KPI row ────────────────────────────────────────────────────────────
k1, k2, k3, k4 = st.columns(4, gap="small")
with k1:
    st.metric("Total Scans", f"{stats['total']:,}")
with k2:
    st.metric("Threats Detected", f"{stats['malicious']:,}")
with k3:
    st.metric("Safe Verdicts", f"{stats['safe']:,}")
with k4:
    metrics = eval_data.get("locked_test_metrics", {})
    f1 = metrics.get("f1", 0)
    st.metric("Model F1 (Locked Test)", f"{f1:.3f}")

# Accent the threat metric with a red left border via CSS patch
st.markdown(
    """<style>
    [data-testid="stMetric"]:nth-child(2) {
        border-left: 3px solid #ba1a1a !important;
    }
    [data-testid="stMetric"]:nth-child(3) {
        border-left: 3px solid #2b6954 !important;
    }
    [data-testid="stMetric"]:nth-child(4) {
        border-left: 3px solid #004ac6 !important;
    }
    </style>""",
    unsafe_allow_html=True,
)

spacer(20)

# ── Two-column layout: scan history table  |  ML model card ───────────
left, right = st.columns([3, 2], gap="large")

with left:
    st.markdown(
        '<h3 style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 10px 0">'
        "Recent Scans</h3>",
        unsafe_allow_html=True,
    )

    if not recent:
        st.markdown(
            '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
            'padding:40px 20px;text-align:center">'
            '<div style="font-size:28px;margin-bottom:10px">🔍</div>'
            '<p style="color:#737686;font-size:14px;margin:0">No scans yet.<br>'
            '<span style="font-size:13px">Submit a URL or email to get started.</span></p>'
            '</div>',
            unsafe_allow_html=True,
        )
    else:
        # Build a clean DataFrame for st.dataframe
        rows = []
        for r in recent:
            try:
                dt = datetime.fromisoformat(r["scanned_at"])
                time_str = dt.strftime("%b %d %H:%M")
            except Exception:
                time_str = r["scanned_at"][:16]

            scan_type_icon = "🔗" if r["scan_type"] == "url" else "📧"
            input_disp = r["input_repr"][:55] + ("…" if len(r["input_repr"]) > 55 else "")

            rows.append({
                "Type": scan_type_icon,
                "Input": input_disp,
                "Verdict": r["verdict"],
                "Risk": f"{r['risk_score']}/100",
                "Conf.": r["confidence"],
                "Time (UTC)": time_str,
            })

        df = pd.DataFrame(rows)

        # Use st.dataframe with column config for proper rendering
        st.dataframe(
            df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Type":       st.column_config.TextColumn("Type", width="small"),
                "Input":      st.column_config.TextColumn("Input / URL", width="large"),
                "Verdict":    st.column_config.TextColumn("Verdict", width="medium"),
                "Risk":       st.column_config.TextColumn("Risk", width="small"),
                "Conf.":      st.column_config.TextColumn("Conf.", width="small"),
                "Time (UTC)": st.column_config.TextColumn("Time", width="medium"),
            },
        )

        # Stat summary below table
        spacer(8)
        url_c  = stats["url_scans"]
        email_c = stats["email_scans"]
        st.markdown(
            f'<p style="font-size:12px;color:#737686;margin:0">'
            f'{url_c:,} URL scans · {email_c:,} Email scans</p>',
            unsafe_allow_html=True,
        )

with right:
    # ── ML Model card ──────────────────────────────────────────────────
    st.markdown(
        '<h3 style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 10px 0">'
        "ML Model Card</h3>",
        unsafe_allow_html=True,
    )

    with st.container():
        st.markdown(
            '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
            'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
            unsafe_allow_html=True,
        )

        alg = model_meta.get("algorithm", eval_data.get("algorithm", "—"))
        ver = model_meta.get("version",   eval_data.get("model_version", "—"))
        cal = model_meta.get("calibration_method", eval_data.get("calibration_method", "—"))
        thr = model_meta.get("selected_threshold",  eval_data.get("selected_threshold", "—"))

        kv_row("Algorithm", alg)
        kv_row("Version", ver, mono=True, color="#004ac6")
        kv_row("Calibration", cal)
        kv_row("Threshold", str(thr), mono=True)

        st.markdown(
            '<div style="font-size:11px;font-weight:700;color:#737686;'
            'text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 8px 0">'
            "Locked Test Metrics</div>",
            unsafe_allow_html=True,
        )

        lm = metrics  # already loaded above
        kv_row("F1 Score",    f"{lm.get('f1', 0):.4f}",        mono=True, color="#004ac6")
        kv_row("Precision",   f"{lm.get('precision', 0):.4f}",  mono=True)
        kv_row("Recall",      f"{lm.get('recall', 0):.4f}",     mono=True)
        kv_row("ROC-AUC",     f"{lm.get('roc_auc', 0):.4f}",   mono=True)
        kv_row("PR-AUC",      f"{lm.get('pr_auc', 0):.4f}",    mono=True)
        kv_row("FPR",         f"{lm.get('fpr', 0):.4f}",        mono=True)
        kv_row("FNR",         f"{lm.get('fnr', 0):.4f}",        mono=True)

        n_samples = lm.get("n_samples", 0)
        if n_samples:
            st.markdown(
                f'<p style="font-size:11px;color:#737686;font-style:italic;margin-top:10px">'
                f'Evaluated on {n_samples:,} locked holdout samples.</p>',
                unsafe_allow_html=True,
            )

        st.markdown("</div>", unsafe_allow_html=True)

    spacer(12)

    # ── Confusion matrix ────────────────────────────────────────────────
    tp = lm.get("tp", 0)
    tn = lm.get("tn", 0)
    fp = lm.get("fp", 0)
    fn = lm.get("fn", 0)

    if tp or tn:
        st.markdown(
            '<h3 style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 10px 0">'
            "Confusion Matrix</h3>",
            unsafe_allow_html=True,
        )
        cm_df = pd.DataFrame(
            {
                "Predicted Safe":      [f"TN {tn:,}", f"FN {fn:,}"],
                "Predicted Malicious": [f"FP {fp:,}", f"TP {tp:,}"],
            },
            index=["Actually Safe", "Actually Malicious"],
        )
        st.dataframe(cm_df, use_container_width=True)
        fpr = lm.get("fpr", 0)
        fnr = lm.get("fnr", 0)
        st.markdown(
            f'<p style="font-size:12px;color:#737686;margin:4px 0">'
            f'FPR (false alarm): <strong style="color:#b45309">{fpr:.2%}</strong>'
            f' &nbsp;·&nbsp; FNR (miss rate): <strong style="color:#ba1a1a">{fnr:.2%}</strong></p>',
            unsafe_allow_html=True,
        )
