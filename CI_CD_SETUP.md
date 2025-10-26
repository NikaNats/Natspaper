# CI/CD Setup (Vercel Official)

## Workflows

**3 simple workflows using Vercel's official best practices:**

1. **CI** - Runs on all PRs
   - Lint & format check
   
2. **Preview** - Runs on push to any branch except `master`
   - Build & deploy preview to Vercel
   
3. **Production** - Runs on push to `master`
   - Build & deploy production to Vercel

## How It Works

- **Preview Deployments**: Every branch gets a preview URL
- **Production**: Merge to `master` = automatic production deploy
- **Build Output**: Uses `vercel build` to generate `.vercel/output` folder
- **Prebuilt Deploy**: `vercel deploy --prebuilt` skips Vercel's build step

## Setup

### 1. Link Your Project to Vercel

```bash
vercel login
vercel link
```

This creates `.vercel/project.json` with your `projectId` and `orgId`.

### 2. Add GitHub Secrets

Get these values and add them to your GitHub repo settings:

- `VERCEL_TOKEN` - [Create token](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - From `.vercel/project.json` (orgId)
- `VERCEL_PROJECT_ID` - From `.vercel/project.json` (projectId)

### 3. Done!

- **Push to any branch** → Preview deployment
- **Merge to `master`** → Production deployment

That's it! Following Vercel's official guide.

