# CI/CD Setup

## Workflows

**2 simple workflows:**

1. **CI** - Runs on pull requests
   - Lint, format check, build
   
2. **Deploy** - Runs on push to `master`
   - Build and deploy to Vercel

## Setup

Add these GitHub Secrets:

- `VERCEL_TOKEN` - [Get from Vercel](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - [Get from Vercel settings](https://vercel.com/account/settings)
- `VERCEL_PROJECT_ID` - [Get from Vercel project settings](https://vercel.com/login)
- `SENTRY_AUTH_TOKEN` - [Get from Sentry](https://sentry.io/settings/account/api/auth-tokens/)
- `SENTRY_DSN` - [Get from Sentry project settings]
- `PUBLIC_SENTRY_DSN` - [Get from Sentry project settings]

That's it! Push to `master` and it will deploy automatically.
