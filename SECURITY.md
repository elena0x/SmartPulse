# Security Policy

## Portfolio Scope

SmartPulse is a portfolio prototype and is not approved for production healthcare, clinical, or patient-data use. The included fixtures are synthetic. Do not upload protected health information, confidential company data, or regulated personal data to an unreviewed deployment.

## Reporting a Vulnerability

Please open a private security advisory through the repository's **Security → Advisories** page. Do not disclose a vulnerability in a public issue.

Include:

- The affected component and route or function
- Reproduction steps
- Potential impact
- Suggested mitigation, if available

## Configuration Rules

- Keep `.env`, `.env.local`, database passwords, `service_role` keys, and AI provider keys out of Git
- Expose only the Supabase publishable key to the browser
- Enforce access through Row Level Security rather than client-side checks
- Store Edge Function secrets in the deployment platform
- Rotate credentials immediately if a privileged secret is committed
- Use a separate Supabase project and synthetic data for demonstrations

## Supported Version

Only the latest commit on `main` is maintained for portfolio review.
