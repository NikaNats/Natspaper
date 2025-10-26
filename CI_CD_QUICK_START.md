# 🔧 CI/CD Setup Guide

**Quick Setup Instructions for Production Deployment**

---

## ⚡ 5-Minute Setup

### Step 1: Get Your Secrets

#### From Vercel
1. Go to: https://vercel.com/account/tokens
2. Create new token
3. Copy these three values:
   - Vercel Token (keep secret!)
   - Organization ID (from settings)
   - Project ID (from project settings)

#### From Sentry
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. **Delete old token** (the exposed one)
3. Create new token
4. Copy the token value

### Step 2: Add Secrets to GitHub

1. Go to: `https://github.com/NikaNats/Natspaper/settings/secrets/actions`
2. Click **New repository secret**
3. Add these 6 secrets:

```
VERCEL_TOKEN          → Your Vercel token
VERCEL_ORG_ID         → Your Vercel org ID
VERCEL_PROJECT_ID     → Your Vercel project ID
SENTRY_AUTH_TOKEN     → New Sentry token (after deletion)
SENTRY_DSN            → (optional) Your Sentry DSN
PUBLIC_SENTRY_DSN     → (optional) Public Sentry DSN
```

### Step 3: Verify Setup

1. Go to: `https://github.com/NikaNats/Natspaper/actions`
2. Check all 6 workflows are listed:
   - ✅ CI
   - ✅ CD - Deploy to Production
   - ✅ Security Checks
   - ✅ Tests
   - ✅ PR Checks
   - ✅ Scheduled Tasks
   - ✅ Release

3. Push a test commit to master
4. Watch the deployment in Actions tab

---

## 🎯 What Each Workflow Does

| Workflow | Trigger | Purpose | Time |
|----------|---------|---------|------|
| **CI** | Pull Request | Build & lint check | 3 min |
| **Test** | Push/PR | Unit, integration, E2E | 15 min |
| **Security** | Push/PR/Weekly | Dependency audit, secrets | 15 min |
| **CD Deploy** | Push to master | Build & deploy to Vercel | 15 min |
| **PR Checks** | PR events | Validate & welcome | 10 min |
| **Release** | Tag push | Create release artifact | 15 min |
| **Schedule** | Daily 2 AM UTC | Daily build check | 10 min |

---

## 🚀 First Deployment

1. All workflows are enabled automatically
2. Push to master branch:
   ```bash
   git push origin master
   ```
3. Watch in Actions tab
4. Site should deploy to: https://nika-natsvlishvili.dev

---

## 📊 Workflow Status

### After Setup
✅ Workflows are enabled  
✅ Secrets configured  
✅ Ready for first push  

### What Happens on Push
1. CI workflow runs (lint, format, build)
2. Test workflow runs (unit, integration, E2E)
3. Security workflow runs (audit, secrets, CodeQL)
4. If all pass → CD Deploy workflow runs
5. Site is deployed to Vercel!

---

## 🔄 Deployment Flow

```
Your Local Machine
    ↓
git push origin master
    ↓
GitHub receives push
    ↓
Triggers: CI + Test + Security workflows
    ↓
All pass? → CD Deploy workflow
    ↓
Build project
    ↓
Deploy to Vercel
    ↓
https://nika-natsvlishvili.dev updated ✅
```

---

## ⚠️ Important Notes

### Before First Push
- [ ] Revoke old Sentry token (CRITICAL!)
- [ ] Add all 6 secrets to GitHub
- [ ] Verify Vercel credentials
- [ ] Check workflows are enabled

### Ongoing
- Monitor Actions tab for failures
- Update secrets if rotated
- Keep dependencies up to date
- Review security reports weekly

---

## 🆘 Troubleshooting

### Deploy Failed
**Check:**
1. Vercel secrets correct? `Settings → Secrets`
2. Can you build locally? `pnpm run build`
3. Sentry token valid? (not the old one)

**Fix:**
1. View error in Actions tab
2. Update secret if needed
3. Re-run workflow

### Tests Failing
**Check:**
1. Run locally: `pnpm run test:run`
2. Check environment setup
3. Review error output in Actions

### Secrets Error
**Fix:**
1. Go to `Settings → Secrets → Actions`
2. Verify secret names match exactly
3. Verify values are correct
4. Re-run workflow

---

## 📞 Need Help?

- **GitHub Actions:** https://github.com/NikaNats/Natspaper/actions
- **Vercel Deploy:** https://vercel.com/dashboard
- **Sentry Management:** https://sentry.io/settings/

---

**Status:** ✅ Ready to deploy!

Push to master and watch your site go live. 🚀
