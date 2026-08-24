# ThreatLens Agent Instructions

## Mission

Build ThreatLens as a reliable cybersecurity analysis platform. The
highest priority is **detection accuracy and trustworthy evidence**, not
speed of implementation.

## Non-negotiable rules

1.  Do not rewrite the whole project to fix a local issue.
2.  Do not change working scanner logic without inspecting it first.
3.  Do not invent threat-intelligence results.
4.  Never hardcode API keys.
5.  Never expose secrets to frontend/client code.
6.  Never commit `.env`.
7.  Do not claim model accuracy without measured validation/test
    results.
8.  Never tune against the locked test set.
9.  Do not use an LLM as the authoritative malware/phishing classifier.
10. Every production model must have a version and evaluation report.
11. Every external provider must have timeout/error handling.
12. Every scanner must return the common `ThreatResult` structure.
13. Make small changes and run tests after each meaningful change.
14. Prefer deterministic, reproducible behavior.
15. If requirements conflict, preserve security and accuracy over UI
    convenience.

## Development workflow

Before editing: 1. Inspect the relevant files. 2. Identify dependencies
and callers. 3. Make the smallest safe change. 4. Run the relevant
tests. 5. Run a broader regression test when scanner/model behavior
changes. 6. Update documentation.

## ML rules

-   Check dataset provenance.
-   Check duplicates before splitting.
-   Check leakage.
-   Use train/validation/test separation.
-   Preserve a locked holdout.
-   Compare multiple baselines.
-   Tune thresholds on validation data only.
-   Calibrate probabilities.
-   Record metrics and model version.
-   Save the exact feature configuration used for the model.
-   Never silently retrain a production model.

## Threat-intelligence rules

Approved initial providers: - Google Safe Browsing - PhishTank

Do not assume a provider is authoritative. Store: - provider - status -
timestamp - indicator - result - error/quota state

Provider failures must degrade gracefully.

## Security rules

Treat every URL, email, image and uploaded file as untrusted.

Never: - execute uploaded files - execute extracted scripts - follow
arbitrary redirects without SSRF controls - expose local filesystem
paths - log API secrets - log raw sensitive content unnecessarily

## UI rules

UI changes must not change backend semantics.

Every interactive control must: - have a working handler - show loading
state when needed - show errors clearly - avoid duplicate submissions -
provide meaningful feedback

## Git rules

Use focused commits: - `feat:` - `fix:` - `ml:` - `security:` -
`test:` - `docs:` - `refactor:`

Never commit: - `.env` - API keys - local databases containing sensitive
data - model training dumps containing sensitive data - credentials

## When uncertain

Stop and inspect. Do not guess.
