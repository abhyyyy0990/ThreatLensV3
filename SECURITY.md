# ThreatLens Security Requirements

## Secrets

-   `.env` must be Git-ignored.
-   No real API keys in source.
-   No API keys in frontend JavaScript.
-   No secrets in screenshots, logs or error messages.
-   Rotate any credential accidentally committed.

## URL safety

Treat submitted URLs as attacker-controlled.

Controls: - validate URL syntax - restrict protocols - block
localhost/private IP targets where network fetching occurs - protect
against DNS rebinding - enforce redirect limits - enforce timeouts -
limit response sizes - never execute returned content

## File uploads

Allow only expected file types.

Apply: - size limits - MIME/content validation - safe filenames -
temporary storage - cleanup - no execution - parser timeouts

## Email parsing

Email HTML is untrusted. Do not render raw email HTML directly in the
application without sanitization.

## QR and image processing

Images are untrusted. Use size limits and safe decoding libraries.

## Logging

Never log: - API keys - authorization headers - full sensitive emails -
credentials - session tokens

Prefer: - scan ID - event type - timing - provider status - sanitized
indicator hashes

## Dependency security

Pin important dependencies and periodically review: - vulnerabilities -
abandoned packages - transitive dependencies

## Threat model

ThreatLens itself may be targeted through: - malicious URLs - malicious
email HTML - oversized files - parser exploits - SSRF - API abuse -
credential theft - prompt injection through scanned content

Scanned content must always be treated as data, never as instructions.
