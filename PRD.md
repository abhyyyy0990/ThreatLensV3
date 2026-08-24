# ThreatLens --- Product Requirements Document (PRD)

**Version:** 3.0 --- Clean Rebuild\
**Status:** Implementation baseline\
**Primary objective:** Build a reliable, explainable cybersecurity
threat-analysis platform with materially better detection accuracy than
the current model.

## 1. Product vision

ThreatLens is a multi-scanner threat-analysis platform for detecting
phishing, malicious URLs, suspicious emails, QR-code abuse, and
suspicious screenshots/messages.

The rebuild must prioritize **accuracy, validation, reproducibility, and
explainability** over adding flashy features.

### Core principle

> ThreatLens must never pretend a prediction is certain when the
> evidence is weak.

Every verdict must be traceable to model signals, deterministic rules,
and external threat-intelligence evidence.

## 2. Problems with the current implementation

The current Streamlit application has multiple scanners and trained
artifacts, but the main weakness is unreliable prediction quality. The
rebuild therefore starts with the **data/model pipeline**, not UI
polish.

Known current components include: - Email scanner - URL scanner - QR
scanner - Screenshot analyzer - History - Batch CSV analysis - ML model
artifacts - Feature extraction - Threat-intelligence integration -
Streamlit frontend

The old codebase is reference material only. Do not blindly copy its
architecture.

## 3. Goals

### P0 --- Accuracy

-   Build a reproducible dataset pipeline.
-   Prevent train/test leakage.
-   Use stratified and time-aware validation where appropriate.
-   Compare baseline models before selecting the production model.
-   Tune decision thresholds using validation data.
-   Calibrate probabilities.
-   Track precision, recall, F1, ROC-AUC, PR-AUC, confusion matrix,
    false-positive rate and false-negative rate.
-   Evaluate separately on phishing, benign, suspicious and
    hard-negative samples.
-   Keep a locked holdout test set that is never used for tuning.

### P0 --- Trustworthy threat intelligence

Integrate approved external intelligence through a server-side service
layer. The initial documented providers are: - Google Safe Browsing -
PhishTank - Additional reputable providers may be added only after being
explicitly approved and documented.

No secret key is placed in frontend code.

### P0 --- Explainability

Every result should answer: 1. What was analyzed? 2. What evidence was
found? 3. What did the ML model predict? 4. What did deterministic rules
detect? 5. What did external intelligence report? 6. Why did the final
score reach its level? 7. What should the user do next?

### P1 --- Multi-scanner coverage

-   Email
-   URL/domain
-   QR code
-   Screenshot/message
-   Batch CSV
-   Analysis history

### P1 --- Reliability

-   Graceful API failure
-   Timeouts
-   Retries only where safe
-   Caching
-   Input validation
-   Structured logging
-   Deterministic local fallback behavior

### P1 --- Security

-   Environment-based secrets
-   No API keys in Git
-   Sanitized user input
-   Upload restrictions
-   File-type validation
-   Request limits
-   Safe parsing of email/HTML
-   No execution of submitted files or URLs

## 4. Non-goals

-   Claiming 100% detection accuracy.
-   Training directly on unverified scraped data without cleaning.
-   Exposing provider API keys to the browser.
-   Automatically trusting a single external provider.
-   Treating an LLM explanation as the source of truth.
-   Rewriting the entire project every time a bug appears.

## 5. Users

### Primary

Students, security learners, analysts and developers who need
understandable threat-analysis results.

### Secondary

Small teams that need quick triage of suspicious emails, URLs, QR codes
and screenshots.

## 6. Functional requirements

### FR-01 Email scanner

Input: - Raw email text - .eml upload - Optional headers

Extract: - Sender - Reply-To - Return-Path - Authentication results when
available - Subject - URLs - Domains - IPs - Attachments metadata - HTML
indicators - Urgency/social-engineering indicators

Output: - Threat score - Classification - Evidence - Extracted
indicators - ML confidence - Rule hits - Threat-intelligence results

### FR-02 URL scanner

Extract: - Scheme - Host - Port - Path - Query - Redirect behavior where
safely supported - Domain age when an approved source supplies it - TLS
information where safely obtainable - URL lexical features - Host/domain
features - Reputation results

Never fetch arbitrary URLs in a way that creates SSRF risk.

### FR-03 QR scanner

Pipeline: 1. Decode QR. 2. Validate decoded content. 3. If it contains a
URL, pass it through the URL-analysis pipeline. 4. Preserve QR-specific
evidence. 5. Display the decoded payload clearly.

### FR-04 Screenshot/message scanner

Pipeline: 1. Image validation. 2. OCR. 3. Text normalization. 4.
Indicator extraction. 5. URL/domain extraction. 6. Threat-intelligence
checks. 7. Rule analysis. 8. ML analysis where applicable. 9.
Explainable final result.

OCR/LLM services are enrichment layers, not ground truth.

### FR-05 Batch analysis

-   CSV upload
-   Column mapping
-   Validation
-   Batch inference
-   Result export
-   Error rows
-   Summary metrics

### FR-06 History

Store: - Timestamp - Scan type - Input fingerprint/hash - Verdict -
Score - Key evidence - Provider statuses

Do not store sensitive raw content unnecessarily.

## 7. Unified decision engine

All scanners should converge on a common result contract:

``` text
ThreatResult
├── scan_id
├── scanner_type
├── verdict
├── risk_score
├── calibrated_probability
├── confidence_band
├── model
│   ├── name
│   ├── version
│   └── probability
├── rules[]
├── indicators[]
├── threat_intelligence[]
├── evidence[]
├── recommendations[]
├── provider_status[]
└── timestamp
```

### Verdict policy

Recommended initial bands: - 0--24: Low risk - 25--49: Suspicious -
50--74: High risk - 75--100: Critical

These thresholds are **not final**. They must be tuned on validation
data and versioned.

## 8. Accuracy architecture

The final score must not simply average arbitrary signals.

Recommended evidence hierarchy:

1.  High-confidence external intelligence
2.  Strong deterministic security indicators
3.  Calibrated ML probability
4.  Weak heuristic indicators
5.  AI-generated explanation

The scoring system must be documented and tested.

### Important rule

A model probability of 0.99 does not automatically mean the final
verdict is 99% certain.

The final engine must account for: - calibration - provider
reliability - conflicting evidence - missing data - known false-positive
patterns

## 9. Machine-learning requirements

### Dataset

The dataset must: - contain labeled benign and malicious/phishing
samples - remove duplicates - normalize URLs/emails - remove obvious
leakage - record provenance - preserve class balance information -
contain hard negatives - separate train/validation/test data

### Split policy

Never randomly split near-duplicate URLs across train and test.

Preferred: - Grouped split by domain/campaign where possible. -
Time-aware split when timestamps exist. - Locked final holdout.

### Baselines

At minimum evaluate: - Logistic Regression - Random Forest - Gradient
Boosting / XGBoost or equivalent approved model

Select the production model based on validation performance and
operational stability, not just accuracy.

### Feature families

URL: - URL length - Host length - path/query length - number of dots -
subdomain count - digit ratio - special-character ratio - entropy -
suspicious TLD - IP-as-host - punycode - encoded characters - keyword
features - domain/host reputation features

Email: - sender/reply-to mismatch - authentication indicators - URL
count - suspicious domain count - urgency language - credential/payment
requests - attachment indicators - HTML structure - brand impersonation
signals

### Evaluation

Track: - Accuracy - Precision - Recall - F1 - ROC-AUC - PR-AUC -
Specificity - False-positive rate - False-negative rate - Calibration
error - Confusion matrix

For phishing/security detection, **false negatives and precision must be
explicitly monitored**.

## 10. Model lifecycle

Every production model must have: - Model version - Dataset version -
Feature version - Training date - Training configuration - Validation
metrics - Test metrics - Threshold configuration - Calibration method -
Artifact checksum

No model artifact enters production without passing the model acceptance
checklist.

## 11. API requirements

All external API integrations must: - use server-side environment
variables - have explicit timeouts - return normalized provider
responses - expose provider health/status - handle quota/rate-limit
responses - avoid leaking secrets into logs - support caching where
appropriate

Required environment configuration should follow `.env.example`.

Do not commit real API keys.

## 12. UI requirements

The UI should be clean, modern and readable: - Clear
sidebar/navigation - Large readable results - Strong visual hierarchy -
No hidden controls - Buttons must have real handlers -
Loading/error/empty states - Mobile-friendly layout - Accessible
contrast - No UI redesign should modify scanner logic

## 13. Testing requirements

Before release: - Unit tests for feature extraction - Unit tests for
scoring - API adapter tests with mocked responses - Dataset validation
tests - Model regression tests - End-to-end scanner tests - Upload
validation tests - Security tests - Production build test

A change that reduces model metrics beyond the accepted tolerance must
fail CI or require explicit approval.

## 14. Acceptance criteria

ThreatLens V3 is considered ready only when: - all scanners return the
unified result schema - API keys are not exposed client-side - training
is reproducible - evaluation is reproducible - final holdout is
untouched during tuning - model metrics are documented - probability
calibration is evaluated - provider failures do not crash the
application - all core buttons work - automated tests pass - production
build runs cleanly - README and AGENTS.md are complete

## 15. Phase plan

### Phase 0 --- Foundation

Project structure, environment, Git, dependency pinning, configuration.

### Phase 1 --- Data

Dataset ingestion, cleaning, deduplication, leakage detection, splits.

### Phase 2 --- ML

Feature extraction, baselines, training, evaluation, calibration, model
registry.

### Phase 3 --- Threat intelligence

Google Safe Browsing, PhishTank and approved providers through
normalized adapters.

### Phase 4 --- Unified engine

Rules + ML + intelligence + calibration + explainability.

### Phase 5 --- Scanners

Email, URL, QR, screenshot and batch.

### Phase 6 --- UI

Dashboard, scanner pages, history and evidence presentation.

### Phase 7 --- Testing

Unit, integration, regression, security and end-to-end testing.

### Phase 8 --- Deployment

Production configuration, secrets, monitoring and release.

## 16. Definition of done

A feature is not done because the page renders.

It is done only when: - logic works, - error paths work, - tests
exist, - results are explainable, - security constraints are
satisfied, - documentation is updated, - and the feature does not
silently reduce detection quality.
