"""ThreatLens V3 — Email Scanner page.

Native Streamlit layout. st.dataframe for URL results table.
No complex HTML string generation.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.scanners import email_scanner
from src.ui.style import (
    badge, error_box, flag_chips, info_box, inject_css,
    risk_bar, section_header, sidebar_nav, spacer, warning_box,
)

st.set_page_config(
    page_title="ThreatLens — Email Scanner",
    page_icon="📧",
    layout="wide",
    initial_sidebar_state="expanded",
)
inject_css()

# ── Sidebar ────────────────────────────────────────────────────────────
selected = sidebar_nav("📧  Email Scanner")
if selected == "🏠  Dashboard":
    st.switch_page("app.py")
elif selected == "🔗  URL Scanner":
    st.switch_page("pages/1_url_scanner.py")
elif selected == "🔍  Model Info":
    st.switch_page("pages/3_model_info.py")

# ── Header ─────────────────────────────────────────────────────────────
section_header(
    "Email Scanner",
    "Paste raw email content — all embedded URLs will be extracted and analysed.",
)
spacer(16)

# ── Input card ─────────────────────────────────────────────────────────
st.markdown(
    '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
    'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
    unsafe_allow_html=True,
)

email_text = st.text_area(
    "Raw email content (headers + body)",
    height=200,
    placeholder=(
        "From: attacker@phishing-example.com\n"
        "Subject: Urgent: Verify Your Account\n\n"
        "Dear user, please click: http://malicious-login.xyz/verify?token=abc\n"
        "Or visit: https://paypal-secure-update.net/login"
    ),
)

c1, c2, _ = st.columns([2, 1, 8])
with c1:
    scan_clicked = st.button("📧  Scan Email", use_container_width=True)
with c2:
    if st.button("Clear", use_container_width=True):
        st.session_state.pop("email_result", None)
        st.rerun()

st.markdown("</div>", unsafe_allow_html=True)

info_box(
    "<strong>Privacy:</strong> Raw email content is <em>not</em> stored. "
    "Only the aggregate verdict, URL count, and subject/from fields are recorded."
)

# ── Run scan ────────────────────────────────────────────────────────────
if scan_clicked:
    if not email_text or not email_text.strip():
        warning_box("⚠ Please paste email content before scanning.")
    else:
        with st.spinner("Extracting URLs and analysing…"):
            result = email_scanner.scan_email(email_text)
        st.session_state["email_result"] = result

# ── Result ──────────────────────────────────────────────────────────────
if "email_result" in st.session_state:
    res = st.session_state["email_result"]
    spacer(8)

    if res.get("error") and res["verdict"] == "Error":
        error_box(f"⚠ {res['error']}")

    else:
        verdict  = res["verdict"]
        score    = res["risk_score"]
        conf     = res["confidence"]
        urls     = res["extracted_urls"]
        url_res  = res["url_results"]
        headers  = res["headers"]

        accent = {
            "Malicious":  "#ba1a1a",
            "Safe":       "#2b6954",
            "Suspicious": "#d97706",
        }.get(verdict, "#c3c6d7")

        # ── Summary card ───────────────────────────────────────────────
        st.markdown(
            f'<div style="background:#fff;border:1px solid #c3c6d7;'
            f'border-left:4px solid {accent};border-radius:10px;'
            f'padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">',
            unsafe_allow_html=True,
        )

        hc1, hc2 = st.columns([3, 1])
        with hc1:
            st.markdown(
                f'{badge(verdict)}'
                f'<span style="font-size:13px;color:#737686;margin-left:12px">'
                f'Confidence: <strong>{conf}</strong></span>'
                f'<span style="font-size:13px;color:#737686;margin-left:12px">'
                f'{len(urls)} URL{"s" if len(urls)!=1 else ""} extracted</span>',
                unsafe_allow_html=True,
            )
            spacer(8)
            # Headers table via native Streamlit
            if headers:
                for k, v in list(headers.items())[:5]:
                    st.markdown(
                        f'<span style="font-size:12px;color:#737686;min-width:80px;display:inline-block">{k}:</span>'
                        f'<span style="font-size:12px;color:#191c1e"> {v[:100]}</span><br>',
                        unsafe_allow_html=True,
                    )
        with hc2:
            st.markdown(
                f'<div style="text-align:right">'
                f'<div style="font-size:11px;color:#737686">Overall Risk</div>'
                f'<div style="font-size:28px;font-weight:700;color:#191c1e;line-height:1.1">'
                f'{score}/100</div></div>',
                unsafe_allow_html=True,
            )

        risk_bar(score)
        st.markdown("</div>", unsafe_allow_html=True)
        spacer(10)

        if not urls:
            info_box("No HTTP/HTTPS URLs found in the pasted content.")
        else:
            # ── URL results table ─────────────────────────────────────
            st.markdown(
                '<p style="font-size:13px;font-weight:600;color:#191c1e;margin:0 0 8px 0">'
                "URL Analysis Results</p>",
                unsafe_allow_html=True,
            )

            table_rows = []
            for i, (url, r) in enumerate(zip(urls, url_res), 1):
                table_rows.append({
                    "#":          i,
                    "URL":        url[:70] + ("…" if len(url) > 70 else ""),
                    "Verdict":    r["verdict"],
                    "Risk":       f"{r['risk_score']}/100",
                    "Prob.":      f"{r['probability']:.4f}",
                    "Confidence": r["confidence"],
                })

            tdf = pd.DataFrame(table_rows)
            st.dataframe(
                tdf,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "#":          st.column_config.NumberColumn("#", width="small"),
                    "URL":        st.column_config.TextColumn("URL",        width="large"),
                    "Verdict":    st.column_config.TextColumn("Verdict",    width="medium"),
                    "Risk":       st.column_config.TextColumn("Risk",       width="small"),
                    "Prob.":      st.column_config.TextColumn("Probability",width="small"),
                    "Confidence": st.column_config.TextColumn("Confidence", width="small"),
                },
            )

            # ── Flagged URL details ────────────────────────────────────
            flagged = [
                (url, r) for url, r in zip(urls, url_res)
                if r["verdict"] in ("Malicious", "Suspicious")
            ]
            if flagged:
                spacer(10)
                st.markdown(
                    '<p style="font-size:13px;font-weight:600;color:#191c1e;margin:0 0 8px 0">'
                    "🚩 Flagged URLs — Details</p>",
                    unsafe_allow_html=True,
                )
                for url, r in flagged:
                    with st.expander(
                        f"{r['verdict']} · {url[:80]}",
                        expanded=False,
                    ):
                        risk_bar(r["risk_score"])
                        st.markdown(
                            '<p style="font-size:13px;font-weight:600;color:#191c1e;'
                            'margin:8px 0 4px 0">Suspicious Indicators</p>',
                            unsafe_allow_html=True,
                        )
                        flag_chips(r.get("suspicious_flags", []))

else:
    # Empty state
    spacer(8)
    st.markdown(
        '<div style="background:#fff;border:1px solid #c3c6d7;border-radius:10px;'
        'padding:48px 20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04)">'
        '<div style="font-size:36px;margin-bottom:12px">📧</div>'
        '<p style="font-size:15px;font-weight:600;color:#191c1e;margin:0 0 6px 0">Ready to analyse</p>'
        '<p style="font-size:13px;color:#737686;max-width:400px;margin:0 auto">'
        'Paste raw email content above and click <strong>Scan Email</strong>.<br>'
        'All embedded URLs will be extracted and scanned individually.'
        '</p></div>',
        unsafe_allow_html=True,
    )
