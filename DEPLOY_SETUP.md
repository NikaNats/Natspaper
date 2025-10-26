# Deploy Setup - Step by Step

## ✅ Done

- Project linked to Vercel: `natspaper`
- Project ID: `prj_FJaYQztX23uRhGXPxqjklX0W1LQC`
- Org ID: `team_oIAa5AHZVDCUDA2bORL4unSv`
- GitHub connected ✓

## 🔧 Next Step: Add GitHub Secrets

Go to: https://github.com/NikaNats/Natspaper/settings/secrets/actions

Add these 3 secrets:

### 1. VERCEL_TOKEN
- Go to: https://vercel.com/account/tokens
- Create new token (name: `github-actions`, no expiration)
- Copy the token value
- Add as secret: `VERCEL_TOKEN`

### 2. VERCEL_ORG_ID
- Value: `team_oIAa5AHZVDCUDA2bORL4unSv`

### 3. VERCEL_PROJECT_ID
- Value: `prj_FJaYQztX23uRhGXPxqjklX0W1LQC`

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
