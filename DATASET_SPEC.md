# ThreatLens Dataset Specification

## Objective

Create a clean, representative and leakage-resistant dataset for threat
classification.

## Required fields

At minimum: - `id` - `label` - `raw_input` or normalized
representation - `source` - `collection_timestamp` when available -
`domain` when applicable - `campaign_id` when available

## Labels

Recommended canonical labels: - `benign` - `phishing` - `malicious` -
`suspicious`

If the first model is binary, map labels explicitly and document the
mapping.

## Cleaning

Before training: - normalize URLs - normalize email fields - remove
exact duplicates - identify near-duplicates - remove malformed records -
record rejected rows - validate labels - inspect class distribution

## Leakage prevention

Check: - same domain in train and test - same campaign in train and
test - duplicated URLs - templated email duplicates - generated variants
of the same sample - labels derived from future information

Where possible, group by domain/campaign.

## Splits

Recommended: - Train: 70% - Validation: 15% - Locked test: 15%

These percentages may change based on dataset size.

The split must be reproducible with a recorded seed.

## Hard negatives

The dataset must contain legitimate examples that resemble attacks: -
long legitimate URLs - tracking URLs - login pages from real
organizations - marketing emails - password-reset notifications - QR
codes containing legitimate links

Hard negatives are critical for reducing false positives.

## Dataset report

Every training run must generate: - sample counts - class counts -
duplicate counts - split counts - source distribution - label
distribution - validation warnings
