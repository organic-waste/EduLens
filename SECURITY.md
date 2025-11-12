# Security & Privacy Disclosure Policy

## Purpose
EduLens is committed to protecting the privacy and security of every educator and learner who uses our browser extension. This policy explains how we handle sensitive information and how researchers can report vulnerabilities that may affect user data.

## Reporting a Vulnerability
- Email: o.organic.waste.o@gmail.com
- Include a clear description of the issue, reproduction steps, and any proof-of-concept code.
- Do not publicly disclose details until we confirm a fix or mutually agree on a disclosure date.

## Data Handling Overview
- Default local mode stores annotations, bookmarks, images, and settings only inside the user’s browser storage.
- Optional collaboration features sync account credentials (username, email, salted password hash) and shared annotations to our managed server over TLS.
- We never collect browsing history, advertising identifiers, or third-party analytics data.

## Access Controls
- Server access is limited to named EduLens operators using MFA-protected accounts.
- Production data is separated from development environments; anonymized datasets are used for testing.

## Encryption & Transmission
- All traffic between the extension and EduLens services uses HTTPS/TLS 1.2+.
- Secrets and API keys are stored using environment variables and rotated every 90 days or when staff changes occur.

## Incident Response
1. Triage and verify the report.
2. Contain and remediate the vulnerability.
3. Notify affected users via email if personal data might be exposed.
4. Publish a post-incident summary without sensitive proofs.

## Requesting Data Deletion
Users can clear local data from the extension settings. For server data removal, email o.organic.waste.o@gmail.com with the account email; we delete collaboration records within 15 days unless legal obligations require retention.
