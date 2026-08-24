# ThreatLens Test Plan

## 1. Unit tests

### Features

-   URL length
-   entropy
-   domain parsing
-   suspicious character ratios
-   email indicator extraction

### Rules

-   each rule has positive and negative tests
-   boundary conditions
-   false-positive cases

### ML

-   model loads
-   feature schema matches training
-   inference is deterministic for fixed inputs
-   calibration is applied
-   threshold version is loaded

## 2. Dataset tests

-   malformed rows rejected
-   duplicate detection
-   label validation
-   class distribution report
-   split reproducibility
-   leakage detection

## 3. Threat-intelligence tests

Mock: - positive response - negative response - timeout - 401/403 -
429 - 500 - malformed JSON

The application must remain usable after provider failure.

## 4. Scanner integration tests

Test: - benign URL - known phishing sample in a controlled test
fixture - benign email - phishing-like email - valid QR - QR containing
a URL - screenshot containing a URL - invalid uploads - empty inputs

## 5. Model regression tests

Store a fixed regression set.

Every model change must compare: - precision - recall - F1 - PR-AUC -
false-positive rate - false-negative rate

A metric regression beyond the configured tolerance requires review.

## 6. Security tests

-   secret exposure scan
-   SSRF cases
-   private IP URLs
-   oversized uploads
-   malformed images
-   malicious HTML
-   path traversal
-   rate limiting

## 7. End-to-end release test

``` text
Install
-> configure .env
-> validate config
-> prepare dataset
-> train
-> evaluate
-> load production model
-> launch application
-> scan fixtures
-> verify results
```

## Release gate

No release if: - tests fail - model artifact cannot be reproduced -
secrets are exposed - required provider failures crash the app - locked
test results are missing
