# ThreatLens Architecture

## High-level flow

``` text
User
  |
  v
UI
  |
  v
Scanner Controller
  |
  +--> Email Analyzer
  +--> URL Analyzer
  +--> QR Analyzer
  +--> Screenshot Analyzer
  +--> Batch Analyzer
  |
  v
Indicator Extraction
  |
  +--> Rules Engine
  +--> ML Inference
  +--> Threat Intelligence Adapters
  |
  v
Evidence Fusion / Risk Engine
  |
  v
Calibration + Verdict
  |
  v
Explainable ThreatResult
  |
  v
UI / History / Export
```

## Recommended project structure

``` text
ThreatLens/
├── app.py
├── README.md
├── AGENTS.md
├── PRD.md
├── ARCHITECTURE.md
├── MODEL_CARD.md
├── DATASET_SPEC.md
├── API_SPEC.md
├── SECURITY.md
├── TEST_PLAN.md
├── ROADMAP.md
├── .env.example
├── .gitignore
├── requirements.txt
├── config/
├── data/
│   ├── raw/
│   ├── processed/
│   └── splits/
├── models/
│   ├── registry/
│   └── production/
├── src/
│   ├── scanners/
│   ├── features/
│   ├── ml/
│   ├── rules/
│   ├── threat_intel/
│   ├── engine/
│   ├── storage/
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── regression/
│   └── security/
├── scripts/
│   ├── prepare_data.py
│   ├── train.py
│   ├── evaluate.py
│   └── validate_dataset.py
└── reports/
    ├── model/
    └── data/
```

## Separation of concerns

### Scanner

Understands the input type.

### Feature extractor

Converts input into measurable features.

### Rules engine

Runs deterministic security rules.

### ML layer

Produces calibrated model probabilities.

### Threat-intelligence layer

Queries external providers.

### Fusion engine

Combines evidence using a versioned scoring policy.

### Presentation layer

Displays the result without changing the underlying verdict.

## Reliability principle

No single dependency should be able to crash the entire scan.

Example: - ML unavailable → rules + intelligence can still produce a
partial result. - Provider unavailable → provider status becomes
unavailable. - OCR fails → display OCR failure and preserve other
evidence.
