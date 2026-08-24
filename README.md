# ThreatLens

ThreatLens is a cybersecurity threat-analysis platform designed to
combine machine learning, deterministic rules and external threat
intelligence into explainable threat assessments.

## Accuracy first

The project is being rebuilt because the previous implementation
produced unreliable predictions.

The new architecture treats model quality as a first-class product
requirement.

Read: - `PRD.md` - `AGENTS.md` - `ARCHITECTURE.md` - `MODEL_CARD.md` -
`DATASET_SPEC.md` - `API_SPEC.md` - `SECURITY.md` - `TEST_PLAN.md` -
`ROADMAP.md`

## Initial scanners

-   Email
-   URL/domain
-   QR
-   Screenshot/message
-   Batch CSV
-   History

## Initial intelligence providers

-   Google Safe Browsing
-   PhishTank

Provider integrations must be configured with server-side secrets.

## Development principle

Do not rebuild everything after every error.

Make one controlled change, test it, then continue.

## Model principle

No accuracy claim without a reproducible evaluation report.

## Run

The exact command will be added after the new application framework is
initialized.

For the current legacy project, the screenshot shows:

``` bash
streamlit run app.py
```

That legacy command is not automatically the final command for
ThreatLens V3.
