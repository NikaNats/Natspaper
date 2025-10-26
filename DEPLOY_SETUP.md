# Deploy Setup - Step by Step

## ✅ Setup Instructions

- Link your project to Vercel first
- GitHub should be connected

## 🔧 Next Step: Add GitHub Secrets

Go to: https://github.com/NikaNats/Natspaper/settings/secrets/actions

Add these 3 secrets:

### 1. VERCEL_TOKEN
- Go to: https://vercel.com/account/tokens
- Create new token (name: `github-actions`, no expiration)
- Copy the token value
- Add as secret: `VERCEL_TOKEN`

### 2. VERCEL_ORG_ID
- Go to: https://vercel.com/account/settings
- Find your Team ID / Org ID in account settings
- Copy the value
- Add as secret: `VERCEL_ORG_ID`

### 3. VERCEL_PROJECT_ID
- Go to: Your project on Vercel → Settings → General
- Find "Project ID" in the project settings
- Copy the value
- Add as secret: `VERCEL_PROJECT_ID`

## 🚀 Deploy

After adding secrets:

```bash
git push origin master
```

GitHub Actions will:
1. Run CI (lint & format check)
2. Build with `vercel build`
3. Deploy to production with `vercel deploy --prebuilt --prod`

Done! 🎉
