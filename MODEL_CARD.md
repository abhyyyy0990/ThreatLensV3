# ThreatLens Model Card

## Model identity

**Model name:** ThreatLens production classifier\
**Version:** TBD after first validated training run\
**Task:** Security-threat classification\
**Primary domains:** phishing URLs, suspicious email indicators, related
threat signals

## Intended use

The model is intended for: - threat triage - educational analysis -
security workflow assistance - prioritizing suspicious inputs for human
review

## Not intended for

-   guaranteed malware detection
-   automatic attribution of attackers
-   irreversible security decisions without human review
-   claiming that a low score means an input is definitely safe

## Training requirements

The training pipeline must record: - dataset name/version -
source/provenance - number of samples - class distribution - duplicate
count - leakage checks - split strategy - feature version - model
algorithm - hyperparameters - random seed - training date

## Evaluation requirements

Report: - Accuracy - Precision - Recall - F1 - ROC-AUC - PR-AUC -
Specificity - False-positive rate - False-negative rate - Confusion
matrix - Calibration error

Report metrics overall and by meaningful subsets.

## Calibration

The production probability must be calibrated on validation data using
an approved calibration method such as: - Platt scaling - Isotonic
regression

The calibration model must not see the locked test set.

## Model acceptance

A candidate model must: 1. beat or justify its performance versus
baseline 2. pass leakage checks 3. have stable validation behavior 4.
have documented threshold selection 5. have calibration results 6. have
a locked test result 7. have a saved artifact checksum

## Limitations

Threat behavior changes over time. A model can become stale even when
software is unchanged.

Therefore: - monitor drift - collect hard negatives - periodically
retrain - version every dataset/model - never silently replace
production artifacts

## Evaluated Model: RandomForest v001

**Evaluated:** 2026-08-20T06:08:49.569534+00:00
**Dataset version:** v001
**Feature version:** v001
**Threshold:** 0.39
**Calibration:** isotonic

### Locked Test Results

| Metric      | Value    |
|-------------|----------|
| Accuracy    | 0.8919 |
| Precision   | 0.8941 |
| Recall      | 0.7686 |
| F1          | 0.8266 |
| ROC-AUC     | 0.9417 |
| PR-AUC      | 0.9103 |
| Specificity | 0.9541 |
| FPR         | 0.0459 |
| FNR         | 0.2314 |

Confusion matrix: TP=24143  FP=2860  FN=7268  TN=59411

