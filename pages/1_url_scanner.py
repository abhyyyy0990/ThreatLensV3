"""ThreatLens V3 — URL Scanner page.

Uses native Streamlit components + CSS for Stitch-faithful rendering.
No complex HTML f-string tables.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.scanners import url_scanner
from src.ui.style import (
    badge, error_box, flag_chips, inject_css,
    risk_bar, section_header, sidebar_nav, spacer, success_box,
    warning_box,
)

st.set_page_config(
    page_title="ThreatLens — URL Scanner",
    page_icon="🔗",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# ── Sidebar ────────────────────────────────────────────────────────────
selected = sidebar_nav("🔗  URL Scanner")
if selected == "🏠  Dashboard":
    st.switch_page("app.py")
elif selected == "📧  Email Scanner":
    st.switch_page("pages/2_email_scanner.py")
elif selected == "🔍  Model Info":
    st.switch_page("pages/3_model_info.py")

# ── Page header ────────────────────────────────────────────────────────
section_header(
    "URL Scanner",
    "Submit a suspicious link for ML-based threat analysis.",
)
spacer(16)

# ── Input card ─────────────────────────────────────────────────────────
with st.container():
    st.markdown(
        '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
        'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
        unsafe_allow_html=True,
    )
    url_input = st.text_input(
        "URL",
        placeholder="https://example.com/path?param=value",
        label_visibility="visible",
    )
    c1, c2, _ = st.columns([2, 1, 8])
    with c1:
        scan_clicked = st.button("🔍  Scan URL", use_container_width=True)
    with c2:
        clear_clicked = st.button("Clear", use_container_width=True)
    st.markdown("</div>", unsafe_allow_html=True)

if clear_clicked:
    st.session_state.pop("url_result", None)
    st.rerun()

if scan_clicked:
    if not url_input or not url_input.strip():
        warning_box("⚠ Please enter a URL before scanning.")
    else:
        with st.spinner("Analysing through ML pipeline…"):
            result = url_scanner.scan_url(url_input.strip())
        st.session_state["url_result"] = result

# ── Result ─────────────────────────────────────────────────────────────
if "url_result" in st.session_state:
    res = st.session_state["url_result"]
    spacer(8)

    if res.get("error") and res["verdict"] == "Error":
        error_box(f"⚠ {res['error']}")
    else:
        verdict = res["verdict"]
        score   = res["risk_score"]
        prob    = res["probability"]
        conf    = res["confidence"]
        flags   = res.get("suspicious_flags", [])
        url_str = res["url"]

        accent = {
            "Malicious":  "#ba1a1a",
            "Safe":       "#2b6954",
            "Suspicious": "#d97706",
        }.get(verdict, "#c3c6d7")

        # ── Verdict card ───────────────────────────────────────────────
        st.markdown(
            f'<div style="background:#fff;border:1px solid #c3c6d7;'
            f'border-left:4px solid {accent};border-radius:10px;'
            f'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
            unsafe_allow_html=True,
        )

        vc1, vc2 = st.columns([3, 1])
        with vc1:
            st.markdown(
                f'<code style="font-size:12px;color:#737686;background:none;padding:0">'
                f'{url_str[:100]}{"…" if len(url_str)>100 else ""}</code>',
                unsafe_allow_html=True,
            )
            spacer(8)
            st.markdown(
                f'{badge(verdict)}'
                f'<span style="font-size:13px;color:#737686;margin-left:12px">'
                f'Confidence: <strong style="color:#191c1e">{conf}</strong></span>'
                f'<span style="font-size:13px;color:#737686;margin-left:12px">'
                f'Threshold: <code style="font-size:12px">{res.get("threshold","—")}</code></span>',
                unsafe_allow_html=True,
            )
        with vc2:
            st.markdown(
                f'<div style="text-align:right">'
                f'<div style="font-size:11px;color:#737686">Raw probability</div>'
                f'<div style="font-size:28px;font-weight:700;font-family:JetBrains Mono,monospace;'
                f'color:#191c1e;line-height:1.1">{prob:.4f}</div>'
                f'<div style="font-size:11px;color:#737686">{res.get("algorithm","—")} {res.get("model_version","—")}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

        risk_bar(score)
        st.markdown("</div>", unsafe_allow_html=True)
        spacer(10)

        # ── Flags ──────────────────────────────────────────────────────
        st.markdown(
            '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
            'padding:16px 20px">'
            '<p style="font-size:13px;font-weight:600;color:#191c1e;margin:0 0 8px 0">'
            '🚩 Suspicious Indicators</p>',
            unsafe_allow_html=True,
        )
        flag_chips(flags)
        st.markdown("</div>", unsafe_allow_html=True)
        spacer(10)

        # ── Feature breakdown ──────────────────────────────────────────
        st.markdown(
            '<p style="font-size:13px;font-weight:600;color:#191c1e;margin:0 0 8px 0">'
            "Feature Breakdown</p>",
            unsafe_allow_html=True,
        )

        families = res.get("features_by_family", {})
        if families:
            tabs = st.tabs(list(families.keys()))
            for tab, (family, feats) in zip(tabs, families.items()):
                with tab:
                    rows = [
                        {"Feature": name.replace("_", " "), "Value": str(val)}
                        for name, val in feats.items()
                    ]
                    feat_df = pd.DataFrame(rows)
                    st.dataframe(
                        feat_df,
                        use_container_width=True,
                        hide_index=True,
                        height=280,
                        column_config={
                            "Feature": st.column_config.TextColumn("Feature", width="large"),
                            "Value":   st.column_config.TextColumn("Value",   width="small"),
                        },
                    )

else:
    # Empty state
    spacer(8)
    st.markdown(
        '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
        'padding:48px 20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04)">'
        '<div style="font-size:36px;margin-bottom:12px">🔗</div>'
        '<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 6px 0">Ready to analyse</p>'
        '<p style="font-size:13px;color:#737686;max-width:380px;margin:0 auto">'
        'Enter any URL above and click <strong>Scan URL</strong>. '
        'The ML model will return a real verdict, risk score, and feature breakdown.'
        '</p></div>',
        unsafe_allow_html=True,
    )
