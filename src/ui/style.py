"""ThreatLens V3 — Stitch design system for Streamlit.

Strategy:
  - Use st.markdown(CSS) for global overrides injected once per page.
  - Use short, self-contained HTML strings for badge/chip components only.
  - Use native Streamlit (st.columns, st.metric, st.dataframe) for layout.
  - Never build large HTML tables via f-strings — use st.dataframe instead.

Design tokens match the approved Google Stitch ThreatLens V3 export exactly.
"""
from __future__ import annotations
import streamlit as st

# ── Tokens ─────────────────────────────────────────────────────────────
PRIMARY       = "#004ac6"
BG            = "#f7f9fb"
SURFACE       = "#ffffff"
SURFACE_LOW   = "#f2f4f6"
BORDER        = "#c3c6d7"
TEXT          = "#191c1e"
TEXT_MUTED    = "#434655"
TEXT_OUTLINE  = "#737686"
RED           = "#ba1a1a"
RED_BG        = "#ffdad6"
GREEN         = "#2b6954"
GREEN_BG      = "#adedd3"
AMBER         = "#b45309"
AMBER_BG      = "#fef3c7"


GLOBAL_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ── Reset & Root ─────────────────────────────────────────────────── */
html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
    background-color: #f7f9fb !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    color: #191c1e !important;
    font-size: 14px !important;
}

/* Hide Streamlit chrome */
#MainMenu { display: none !important; }
footer { display: none !important; }
[data-testid="stDecoration"] { display: none !important; }
[data-testid="stHeader"] { display: none !important; }
.stDeployButton { display: none !important; }

/* ── Sidebar ──────────────────────────────────────────────────────── */
[data-testid="stSidebar"] {
    background-color: #f2f4f6 !important;
    border-right: 1px solid #c3c6d7 !important;
}
[data-testid="stSidebar"] > div:first-child {
    padding: 0 !important;
    background-color: #f2f4f6 !important;
}
[data-testid="stSidebarContent"] {
    padding: 0 !important;
    background-color: #f2f4f6 !important;
}

/* Nav items via radio */
[data-testid="stSidebar"] .stRadio > label { display: none !important; }
[data-testid="stSidebar"] .stRadio [role="radiogroup"] {
    gap: 1px !important;
    flex-direction: column !important;
}
[data-testid="stSidebar"] .stRadio [data-baseweb="radio"] {
    background: transparent !important;
    border: none !important;
    padding: 9px 16px !important;
    border-radius: 8px !important;
    margin: 0 8px !important;
    cursor: pointer !important;
    transition: background 0.12s !important;
}
[data-testid="stSidebar"] .stRadio [data-baseweb="radio"]:hover {
    background: #e0e3e5 !important;
}
[data-testid="stSidebar"] .stRadio [aria-checked="true"][data-baseweb="radio"] {
    background: rgba(0, 74, 198, 0.10) !important;
}
[data-testid="stSidebar"] .stRadio [aria-checked="true"] p {
    color: #004ac6 !important;
    font-weight: 600 !important;
}
[data-testid="stSidebar"] .stRadio p {
    font-size: 13.5px !important;
    color: #434655 !important;
    margin: 0 !important;
    font-family: 'Inter', sans-serif !important;
}
[data-testid="stSidebar"] [data-baseweb="radio"] div:first-child {
    display: none !important;
}

/* ── Main content ─────────────────────────────────────────────────── */
[data-testid="stMainBlockContainer"] {
    padding: 24px 32px !important;
}
[data-testid="block-container"] {
    padding-top: 16px !important;
    max-width: 1300px !important;
}

/* ── Metric widget ────────────────────────────────────────────────── */
[data-testid="stMetric"] {
    background: #ffffff;
    border: 1px solid #c3c6d7;
    border-radius: 10px;
    padding: 16px 18px !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
[data-testid="stMetricLabel"] {
    font-size: 11px !important;
    font-weight: 700 !important;
    color: #737686 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    font-family: 'Inter', sans-serif !important;
}
[data-testid="stMetricValue"] {
    font-size: 26px !important;
    font-weight: 700 !important;
    color: #191c1e !important;
    font-family: 'Inter', sans-serif !important;
    line-height: 1.15 !important;
}
[data-testid="stMetricDelta"] { display: none !important; }

/* ── Inputs ───────────────────────────────────────────────────────── */
[data-testid="stTextInput"] input {
    border: 1.5px solid #c3c6d7 !important;
    border-radius: 8px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 13px !important;
    padding: 10px 14px !important;
    background: #ffffff !important;
    color: #191c1e !important;
    transition: border-color 0.15s !important;
}
[data-testid="stTextInput"] input:focus {
    border-color: #004ac6 !important;
    box-shadow: 0 0 0 3px rgba(0,74,198,0.12) !important;
    outline: none !important;
}
[data-testid="stTextArea"] textarea {
    border: 1.5px solid #c3c6d7 !important;
    border-radius: 8px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 12px !important;
    padding: 10px 14px !important;
    background: #ffffff !important;
    color: #191c1e !important;
}
[data-testid="stTextArea"] textarea:focus {
    border-color: #004ac6 !important;
    box-shadow: 0 0 0 3px rgba(0,74,198,0.12) !important;
    outline: none !important;
}
[data-testid="stTextInput"] label,
[data-testid="stTextArea"] label {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #434655 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
}

/* ── Buttons ──────────────────────────────────────────────────────── */
.stButton > button {
    background: #004ac6 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    font-size: 13.5px !important;
    padding: 10px 20px !important;
    letter-spacing: 0.01em !important;
    transition: background 0.15s, transform 0.1s !important;
}
.stButton > button:hover {
    background: #003da8 !important;
}
.stButton > button:active {
    transform: scale(0.98) !important;
}

/* ── DataFrame table ─────────────────────────────────────────────── */
[data-testid="stDataFrame"] {
    border: 1px solid #c3c6d7 !important;
    border-radius: 10px !important;
    overflow: hidden !important;
}
[data-testid="stDataFrame"] table {
    font-family: 'Inter', sans-serif !important;
    font-size: 13px !important;
}
[data-testid="stDataFrame"] thead tr th {
    background: #f7f9fb !important;
    color: #737686 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    border-bottom: 1px solid #c3c6d7 !important;
    padding: 8px 12px !important;
}
[data-testid="stDataFrame"] tbody tr td {
    padding: 9px 12px !important;
    border-bottom: 1px solid #eceef0 !important;
    color: #191c1e !important;
    font-size: 13px !important;
}
[data-testid="stDataFrame"] tbody tr:hover td {
    background: #f7f9fb !important;
}

/* ── Expander ─────────────────────────────────────────────────────── */
[data-testid="stExpander"] {
    border: 1px solid #c3c6d7 !important;
    border-radius: 10px !important;
    background: #ffffff !important;
    margin-bottom: 6px !important;
}
[data-testid="stExpander"] summary {
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #191c1e !important;
    padding: 12px 16px !important;
}

/* ── Tabs ─────────────────────────────────────────────────────────── */
.stTabs [role="tablist"] {
    border-bottom: 1px solid #c3c6d7 !important;
    gap: 0 !important;
}
.stTabs [role="tab"] {
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #737686 !important;
    padding: 8px 16px !important;
    border-radius: 0 !important;
}
.stTabs [aria-selected="true"] {
    color: #004ac6 !important;
    font-weight: 600 !important;
    border-bottom: 2px solid #004ac6 !important;
}

/* ── Spinner ──────────────────────────────────────────────────────── */
.stSpinner > div { border-top-color: #004ac6 !important; }

/* ── Divider ──────────────────────────────────────────────────────── */
hr {
    border: none !important;
    border-top: 1px solid #c3c6d7 !important;
    margin: 16px 0 !important;
}

/* ── Remove default st.write spacing ─────────────────────────────── */
.stMarkdown p { margin-bottom: 0 !important; }
</style>
"""


def inject_css() -> None:
    """Inject Stitch design CSS. Call once at top of every page."""
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)


# ── Sidebar components ─────────────────────────────────────────────────
def sidebar_nav(active: str) -> str:
    """Render sidebar brand + nav. Returns selected page name."""
    # Brand header
    st.sidebar.markdown(
        """<div style="padding:20px 20px 14px 20px;border-bottom:1px solid #c3c6d7;margin-bottom:8px">
  <div style="display:flex;align-items:center;gap:10px">
    <div style="width:36px;height:36px;background:#004ac6;border-radius:9px;
                display:flex;align-items:center;justify-content:center;
                color:#fff;font-size:18px;font-weight:700;flex-shrink:0">🛡</div>
    <div>
      <div style="font-size:16px;font-weight:700;color:#004ac6;line-height:1.2">ThreatLens</div>
      <div style="font-size:10px;color:#737686;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Cyber Intelligence</div>
    </div>
  </div>
</div>""",
        unsafe_allow_html=True,
    )

    st.sidebar.markdown(
        '<div style="font-size:10px;letter-spacing:0.07em;text-transform:uppercase;'
        'color:#737686;font-weight:700;padding:8px 20px 4px 20px">SCANNERS</div>',
        unsafe_allow_html=True,
    )

    options = [
        "🏠  Dashboard",
        "🔗  URL Scanner",
        "📧  Email Scanner",
        "🔍  Model Info",
    ]

    selected = st.sidebar.radio(
        "nav",
        options,
        index=options.index(active) if active in options else 0,
        label_visibility="collapsed",
    )

    st.sidebar.markdown(
        '<div style="font-size:10px;letter-spacing:0.07em;text-transform:uppercase;'
        'color:#737686;font-weight:700;padding:12px 20px 4px 20px">COMING SOON</div>',
        unsafe_allow_html=True,
    )
    st.sidebar.markdown(
        '<div style="padding:6px 20px;font-size:13px;color:#737686;opacity:0.5">'
        "📷  QR Scanner<br>🖼  Screenshot Scanner"
        "</div>",
        unsafe_allow_html=True,
    )
    return selected


# ── Inline HTML components (short, safe strings only) ─────────────────

def badge(verdict: str) -> str:
    """Return a small verdict badge HTML string."""
    styles = {
        "Malicious":  ("background:#ffdad6;color:#ba1a1a", "⚠"),
        "Safe":       ("background:#adedd3;color:#2b6954", "✓"),
        "Suspicious": ("background:#fef3c7;color:#b45309", "⚡"),
        "Error":      ("background:#e0e3e5;color:#434655", "•"),
    }
    style, icon = styles.get(verdict, ("background:#e0e3e5;color:#434655", "•"))
    return (
        f'<span style="{style};display:inline-flex;align-items:center;gap:4px;'
        f'padding:3px 9px;border-radius:5px;font-size:12px;font-weight:600;'
        f'letter-spacing:0.01em">{icon} {verdict}</span>'
    )


def section_header(title: str, subtitle: str = "") -> None:
    """Render a compact Stitch-style section heading."""
    sub = (
        f'<p style="font-size:13px;color:#737686;margin:2px 0 0 0">{subtitle}</p>'
        if subtitle else ""
    )
    st.markdown(
        f'<h1 style="font-size:22px;font-weight:700;color:#191c1e;margin:0 0 2px 0;'
        f'letter-spacing:-0.01em">{title}</h1>{sub}',
        unsafe_allow_html=True,
    )


def card_begin(border_accent: str = "") -> None:
    """Open a Stitch-style white card container."""
    accent = f"border-left:3px solid {border_accent};" if border_accent else ""
    st.markdown(
        f'<div style="background:#fff;border:1px solid #c3c6d7;{accent}'
        f'border-radius:10px;padding:18px 20px;'
        f'box-shadow:0 1px 3px rgba(0,0,0,0.04);margin-bottom:12px">',
        unsafe_allow_html=True,
    )


def card_end() -> None:
    """Close a card container."""
    st.markdown("</div>", unsafe_allow_html=True)


def risk_bar(score: int) -> None:
    """Render a Stitch-style risk score bar."""
    color = RED if score >= 60 else ("#d97706" if score >= 30 else GREEN)
    track_pct = score
    st.markdown(
        f"""<div style="margin:10px 0">
  <div style="display:flex;justify-content:space-between;
              font-size:12px;color:#737686;margin-bottom:5px">
    <span>Risk Score</span>
    <span style="color:{color};font-weight:700;font-family:'JetBrains Mono',monospace">{score}/100</span>
  </div>
  <div style="height:7px;background:#e0e3e5;border-radius:99px;overflow:hidden">
    <div style="height:100%;width:{track_pct}%;background:{color};border-radius:99px;
                transition:width 0.4s ease"></div>
  </div>
</div>""",
        unsafe_allow_html=True,
    )


def flag_chips(flags: list[str]) -> None:
    """Render a row of red flag chips."""
    if not flags:
        st.markdown(
            '<p style="font-size:13px;color:#737686;margin:4px 0">None detected</p>',
            unsafe_allow_html=True,
        )
        return
    chips = "".join(
        f'<span style="display:inline-flex;align-items:center;gap:4px;'
        f'background:#ffdad6;color:#ba1a1a;border-radius:5px;'
        f'padding:3px 9px;font-size:12px;font-weight:500;margin:2px">'
        f'<span style="width:5px;height:5px;border-radius:50%;background:#ba1a1a;flex-shrink:0"></span>'
        f'{f}</span>'
        for f in flags
    )
    st.markdown(
        f'<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">{chips}</div>',
        unsafe_allow_html=True,
    )


def info_box(text: str) -> None:
    st.markdown(
        f'<div style="background:rgba(0,74,198,0.06);border-left:3px solid #004ac6;'
        f'border-radius:6px;padding:10px 14px;font-size:13px;color:#191c1e;margin:10px 0">'
        f'{text}</div>',
        unsafe_allow_html=True,
    )


def warning_box(text: str) -> None:
    st.markdown(
        f'<div style="background:#fef3c7;border-left:3px solid #d97706;'
        f'border-radius:6px;padding:10px 14px;font-size:13px;color:#92400e;margin:10px 0">'
        f'{text}</div>',
        unsafe_allow_html=True,
    )


def error_box(text: str) -> None:
    st.markdown(
        f'<div style="background:#ffdad6;border-left:3px solid #ba1a1a;'
        f'border-radius:6px;padding:10px 14px;font-size:13px;color:#7f1d1d;margin:10px 0">'
        f'{text}</div>',
        unsafe_allow_html=True,
    )


def success_box(text: str) -> None:
    st.markdown(
        f'<div style="background:#adedd3;border-left:3px solid #2b6954;'
        f'border-radius:6px;padding:10px 14px;font-size:13px;color:#1a3d2f;margin:10px 0">'
        f'{text}</div>',
        unsafe_allow_html=True,
    )


def spacer(px: int = 12) -> None:
    st.markdown(f'<div style="height:{px}px"></div>', unsafe_allow_html=True)


def kv_row(label: str, value: str, mono: bool = False, color: str = TEXT) -> None:
    font = "font-family:'JetBrains Mono',monospace;" if mono else ""
    st.markdown(
        f'<div style="display:flex;justify-content:space-between;'
        f'padding:5px 0;border-bottom:1px solid #f2f4f6">'
        f'<span style="color:#737686;font-size:13px">{label}</span>'
        f'<span style="color:{color};font-size:13px;font-weight:600;{font}">{value}</span>'
        f'</div>',
        unsafe_allow_html=True,
    )
