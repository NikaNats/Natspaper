# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Security Architecture

Natspaper implements defense-in-depth with multiple security layers:

### Content Security Policy (CSP)

All pages are served with a strict Content Security Policy:

```
default-src 'self';
img-src 'self' data: https:;
font-src 'self' data: https://fonts.gstatic.com;
style-src 'unsafe-inline' 'self' https://fonts.googleapis.com;
script-src 'unsafe-inline' 'wasm-unsafe-eval' 'self' data: https://giscus.app;
form-action 'self';
base-uri 'self';
connect-src 'self' https://o4510255602663424.ingest.de.sentry.io https://giscus.app;
frame-src https://giscus.app;
frame-ancestors 'none';
```

### Security Headers

| Header                      | Value                                          | Purpose                               |
| --------------------------- | ---------------------------------------------- | ------------------------------------- |
| `X-Frame-Options`           | `DENY`                                         | Prevents clickjacking attacks         |
| `X-Content-Type-Options`    | `nosniff`                                      | Prevents MIME-sniffing attacks        |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS for 2 years            |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | Controls referrer information leakage |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`     | Disables sensitive browser features   |

### External Resources

| Resource          | Source                           | Security                            |
| ----------------- | -------------------------------- | ----------------------------------- |
| Giscus Comments   | `https://giscus.app`             | SRI hash verified                   |
| Google Fonts      | `fonts.googleapis.com`           | CSP-restricted                      |
| Sentry Monitoring | `https://o*.ingest.de.sentry.io` | CSP-restricted to specific endpoint |
| KaTeX Math        | Bundled locally                  | No external dependency              |

### Input Handling

- **Static Site Generation**: All content is pre-rendered at build time
- **No Server-Side Processing**: No user input reaches the server
- **Markdown Sanitization**: User content in markdown is sanitized by Astro
- **Third-Party Isolation**: Comments are handled by Giscus in an isolated iframe

## Dependency Security

We maintain a secure dependency chain through:

1. **Regular Audits**: `pnpm audit` is run in CI/CD pipeline
2. **Lockfile Integrity**: `pnpm-lock.yaml` ensures reproducible builds
3. **Minimal Dependencies**: We limit runtime dependencies to reduce attack surface

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. **Email**: [security@yourdomain.com] (replace with your actual contact)
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

### Response Timeline

| Stage               | Timeline              |
| ------------------- | --------------------- |
| Initial Response    | 48 hours              |
| Triage & Assessment | 5 business days       |
| Fix Development     | Based on severity     |
| Public Disclosure   | After fix is deployed |

### What to Expect

- We will acknowledge receipt of your report
- We will investigate and keep you informed of our progress
- We will credit you (if desired) in our security advisories
- We will not take legal action against good-faith security researchers

## Security Best Practices for Contributors

When contributing to this project:

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Review dependencies**: Check for known vulnerabilities before adding new packages
3. **Sanitize output**: Always escape user-provided content in templates
4. **Keep CSP strict**: Avoid adding `unsafe-eval` or wildcard sources
5. **Update SRI hashes**: When updating external scripts, regenerate integrity hashes

## Verification

You can verify our security configuration:

```bash
# Check for dependency vulnerabilities
pnpm audit

# Verify build integrity
pnpm build

# Run security-focused tests
pnpm test:run
```

---

_This security policy is reviewed and updated quarterly._
