# Security Guidelines

## Critical Security Issues Fixed

### Hardcoded Sentry DSN Exposure ✅ FIXED

**Severity:** HIGH | **Status:** RESOLVED

#### Previous Issue
- Sentry DSN was hardcoded in `sentry.client.config.ts` and `sentry.server.config.ts`
- Exposed in public repository and version control history
- Attackers could:
  - Replay errors and spam your Sentry dashboard
  - Extract user data from error messages
  - Impersonate your application in Sentry
  - Conduct denial-of-service attacks

#### Solution Implemented
1. ✅ Removed all hardcoded DSNs from source files
2. ✅ Moved to environment variables (`.env.local`)
3. ✅ Updated Sentry config files to use `import.meta.env.PUBLIC_SENTRY_DSN`
4. ✅ Changed `sendDefaultPii: true` to `false` (privacy protection)
5. ✅ `.env.local` is in `.gitignore` (never committed)

#### Action Items

**IMMEDIATE (Before deploying):**
1. **Rotate your Sentry DSN** in Sentry dashboard:
   - Go to https://sentry.io/settings/[org]/projects/[project]/keys/
   - Delete old DSN keys that were exposed
   - Generate new DSN keys

2. **Set up `.env.local`:**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Add your new Sentry DSNs
   SENTRY_AUTH_TOKEN=your_new_token
   SENTRY_DSN=your_new_server_dsn
   PUBLIC_SENTRY_DSN=your_new_client_dsn
   ```

3. **Verify in version control history:**
   - Check if exposed DSN appears in past commits
   - Consider rewriting history if needed (⚠️ risky, only if not pushed yet)
   - Or mark as compromised and rotate immediately

**RECOMMENDED:**
- Use separate DSN keys for development and production
- Restrict Sentry API token permissions (scope: `project:releases`, `org:read`)
- Enable IP whitelisting in Sentry if available
- Monitor your Sentry dashboard for suspicious activity

## Best Practices

### Environment Variables
- **Never commit `.env.local` or `.env` files**
- Use `.env.example` as a template with placeholder values
- Rotate secrets regularly
- Use separate credentials for each environment (dev, staging, prod)

### Sensitive Information
- Never hardcode API keys, tokens, DSNs, or passwords
- Use environment variables for all secrets
- Check `.gitignore` before committing
- Review git history: `git log --all --full-history -- [file]`

### Dependencies
- Regularly run `npm audit` to check for vulnerabilities
- Keep dependencies updated
- Review dependency changelogs for security fixes

### Sentry Integration
- Keep `SENTRY_AUTH_TOKEN` secret (build-time only)
- Use `PUBLIC_SENTRY_DSN` for client-side (acceptable to be public)
- Use `SENTRY_DSN` for server-side (keep private)
- Set `sendDefaultPii: false` to avoid exposing user data
- Monitor for unusual activity in your Sentry dashboard

## Reporting Security Issues

If you discover a security vulnerability:
1. Do NOT open a public issue on GitHub
2. Contact the maintainer privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## References

- [Sentry Security Best Practices](https://docs.sentry.io/security/)
- [OWASP: Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
