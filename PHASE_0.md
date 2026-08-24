# ThreatLens V3 — Phase 0

## Goal

Create a clean, reproducible project foundation before implementing scanners or training models.

## Completed

- Project package structure
- ML/data/model directories
- Threat-intelligence directory
- Test directories
- Environment template
- Git ignore
- Streamlit shell
- Foundation validation script
- Initial pytest test

## Verification

From the project root:

```bash
python3 scripts/validate_foundation.py
python3 -m pytest
streamlit run app.py
```

Do not add scanner logic during Phase 0.

## Next phase

Phase 1 is the data pipeline:
1. identify approved datasets
2. inspect labels
3. normalize samples
4. remove duplicates
5. detect leakage
6. create hard negatives
7. generate reproducible train/validation/locked-test splits
8. produce a dataset quality report
