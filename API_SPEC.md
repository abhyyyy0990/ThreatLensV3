# ThreatLens API / Integration Specification

## Secret management

All secrets are loaded server-side from environment variables.

The repository contains only `.env.example`.

Real values belong in `.env` or the deployment secret manager.

## Initial threat-intelligence providers

### Google Safe Browsing

Purpose: - URL threat lookup - malicious/phishing reputation signals

Required configuration:

``` text
GOOGLE_SAFE_BROWSING_API_KEY=
```

### PhishTank

Purpose: - phishing URL intelligence

Required configuration:

``` text
PHISHTANK_API_KEY=
```

If the currently approved PhishTank access method does not require a
key, leave the variable unused and document the actual access method.
Never invent credentials.

## Optional future providers

Add providers only after approval and documentation.

Every provider adapter must implement a normalized interface
conceptually equivalent to:

``` text
check_indicator(indicator) -> ProviderResult
```

## ProviderResult

``` text
provider
indicator
status
is_malicious
confidence
categories[]
raw_reference
checked_at
latency_ms
error_code
```

## API behavior

-   timeout every external request
-   validate response schema
-   handle 401/403/429/5xx
-   do not expose provider response secrets
-   redact sensitive values from logs
-   cache safe repeated lookups
-   never let provider failure crash the scanner

## Internal configuration

Recommended environment variables:

``` text
APP_ENV=development
LOG_LEVEL=INFO
GOOGLE_SAFE_BROWSING_API_KEY=
PHISHTANK_API_KEY=
MODEL_PATH=
DATABASE_URL=
```

Add provider-specific variables only when the integration is actually
implemented.

## Key verification

Create a startup/config validation command that checks: - variable
exists when required - value is non-empty - no secret is printed -
provider connectivity can be tested safely

Do not test keys by placing them in frontend requests.
