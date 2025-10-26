# 🎯 CI/CD Pipeline - Quick Reference Card

**Deployment Ready:** October 26, 2025

---

## 📊 All Workflows at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS WORKFLOWS                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Trigger: Pull Request                                           │
│  ├─ ✅ ci.yml               │ Lint + Format + Build             │
│  ├─ ✅ test.yml             │ Unit + Integration + E2E Tests    │
│  ├─ ✅ pr-checks.yml        │ Semantic validation               │
│  └─ ✅ security.yml         │ Security scanning                 │
│                                                                   │
│  Trigger: Push to master                                         │
│  ├─ ✅ ci.yml               │ Build verification                │
│  ├─ ✅ test.yml             │ Full test suite                   │
│  ├─ ✅ security.yml         │ Security & audit                  │
│  └─ ✅ cd-deploy.yml        │ Deploy to Vercel 🚀              │
│                                                                   │
│  Trigger: Git tag (v*.*.*)                                       │
│  └─ ✅ release.yml          │ Create release + artifacts       │
│                                                                   │
│  Trigger: Daily 2 AM UTC                                         │
│  └─ ✅ schedule.yml         │ Maintenance checks               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Flow

```
Step 1: Developer Commits
   ↓
Step 2: Push to GitHub
   ↓
Step 3: Workflows Run Automatically
   ├─ Lint & Format Check ✅ (3 min)
   ├─ Unit Tests ✅ (5 min)
   ├─ Integration Tests ✅ (3 min)
   ├─ E2E Tests ✅ (5 min)
   ├─ Security Scan ✅ (3 min)
   └─ Build Verification ✅ (2 min)
   ↓
Step 4: All Tests Pass ✅
   ↓
Step 5: Deploy to Vercel 🚀 (2 min)
   ↓
Step 6: Live on Production ✨
   https://nika-natsvlishvili.dev

⏱️ Total Time: ~15 minutes
```

---

## 📋 Setup Checklist

### ⏳ Before Deployment

- [ ] **Revoke old Sentry token**
  - https://sentry.io/settings/account/api/auth-tokens/
  - Delete: `sntrys_eyJpYXQiOjE3NjE1MDIwMDcuMDUyNjc2...`

- [ ] **Create new Sentry token**
  - https://sentry.io/settings/account/api/auth-tokens/
  - Copy the new token value

- [ ] **Get Vercel secrets**
  - https://vercel.com/account/tokens
  - https://vercel.com/account/settings
  - https://vercel.com/projects

- [ ] **Add GitHub Secrets**
  - https://github.com/NikaNats/Natspaper/settings/secrets/actions
  - Add 6 secrets:
    ```
    VERCEL_TOKEN = <from vercel>
    VERCEL_ORG_ID = <from vercel>
    VERCEL_PROJECT_ID = <from vercel>
    SENTRY_AUTH_TOKEN = <new token>
    SENTRY_DSN = <optional>
    PUBLIC_SENTRY_DSN = <optional>
    ```

---

## 🎯 What Each Secret Does

| Secret | Where | Purpose | Required |
|--------|-------|---------|----------|
| `VERCEL_TOKEN` | Vercel account | Authenticate deployment | ✅ Yes |
| `VERCEL_ORG_ID` | Vercel settings | Identify organization | ✅ Yes |
| `VERCEL_PROJECT_ID` | Vercel project | Identify project | ✅ Yes |
| `SENTRY_AUTH_TOKEN` | Sentry account | Build upload auth | ✅ Yes |
| `SENTRY_DSN` | Sentry settings | Server-side errors | ❌ No |
| `PUBLIC_SENTRY_DSN` | Sentry settings | Client-side errors | ❌ No |

---

## 🔄 Example: Making a Change

### You
```bash
# 1. Make changes
vim src/components/Header.astro

# 2. Commit
git commit -m "feat: improve header responsive design"

# 3. Push
git push origin main
```

### GitHub (Automatic)
```
✅ Linting checks
✅ Format verification  
✅ TypeScript compilation
✅ Unit tests
✅ Integration tests
✅ E2E tests
✅ Security scan

All pass? → Deploy to Vercel
↓
✨ Site updated!
```

---

## 📊 Workflow Status Dashboard

Visit: **https://github.com/NikaNats/Natspaper/actions**

```
✅ ci.yml                    Last: 2 min ago
✅ test.yml                  Last: 2 min ago  
✅ security.yml              Last: 2 min ago
✅ pr-checks.yml             Last: 2 min ago
✅ cd-deploy.yml             Last: 2 min ago (+ Vercel deployment)
✅ release.yml               (Waiting for tag)
✅ schedule.yml              Next: Tomorrow 2 AM UTC
```

---

## 🆘 Troubleshooting Quick Fixes

### Issue: Workflow Failed
**Fix:**
1. Go to Actions tab
2. Click failed workflow
3. View error log
4. Fix code locally
5. `git push` again

### Issue: Deployment Not Starting
**Fix:**
1. Check secrets are added
2. Verify secret names match exactly
3. Wait 2-3 minutes after adding
4. Manual re-run workflow

### Issue: "Secret not found" error
**Fix:**
```
1. Settings → Secrets → Actions
2. Add missing secret
3. Re-run workflow
```

### Issue: Tests Failing
**Fix:**
```bash
# Run locally to debug
pnpm run test:run

# Fix the issue
# Commit & push
```

---

## 📈 Performance

| Task | Time | Parallel |
|------|------|----------|
| Lint | 1 min | ✅ Yes |
| Tests | 10 min | ✅ Yes |
| Build | 2 min | ✅ Yes |
| Security | 3 min | ✅ Yes |
| Deploy | 2 min | ⏸️ After tests |
| **Total** | ~15 min | — |

---

## 🔐 Security at Every Step

```
Pull Request
    ↓
✅ Secret scanning (TruffleHog)
✅ Code quality (ESLint)
✅ Type checking (TypeScript)
✅ Vulnerability scan (npm audit)
✅ CodeQL analysis
    ↓
✅ All must pass before merge
    ↓
Push to master
    ↓
✅ Final security scan
✅ Build verification
✅ Production deployment
```

---

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `CI_CD_QUICK_START.md` | Setup guide | 5 min |
| `CI_CD_DOCUMENTATION.md` | Complete reference | 20 min |
| `CI_CD_SETUP_SUMMARY.md` | Overview & checklist | 10 min |
| `CI_CD_IMPLEMENTATION_COMPLETE.md` | Status report | 15 min |
| This file | Quick reference | 3 min |

---

## ✅ Verification Checklist

### After Setup
- [ ] All 7 workflows visible in Actions tab
- [ ] All status checks green
- [ ] GitHub Secrets added (6 items)
- [ ] First push to master in progress

### After First Deployment
- [ ] Workflows completed successfully
- [ ] Site is live at production URL
- [ ] No errors in Actions tab
- [ ] Security scan passed

---

## 🎯 Common Commands

### Check workflow status
```
https://github.com/NikaNats/Natspaper/actions
```

### Manually trigger workflow
```
GitHub UI → Actions → Select workflow → Run workflow
```

### View specific run
```
Actions → Workflow → Click run number
```

### View logs
```
Workflow run → Click job → Expand step
```

---

## 🚀 Go Live in 3 Steps

```
Step 1: Add GitHub Secrets
├─ VERCEL_TOKEN
├─ VERCEL_ORG_ID
├─ VERCEL_PROJECT_ID
└─ SENTRY_AUTH_TOKEN

Step 2: Push to master
git push origin master

Step 3: Wait ~15 minutes
Watch Actions tab for green checkmarks

🎉 Site is live!
```

---

## 📞 Support Links

- **GitHub Actions:** https://docs.github.com/en/actions
- **Vercel:** https://vercel.com/dashboard
- **Sentry:** https://sentry.io/settings/
- **Your Repo:** https://github.com/NikaNats/Natspaper

---

## 💡 Pro Tips

✅ **Enable branch protection** for master
✅ **Require status checks** before merge
✅ **Monitor Actions weekly**
✅ **Update dependencies monthly**
✅ **Review security reports**

---

## 🎉 You're Ready!

All CI/CD pipelines are configured and ready to deploy.

**Next:** Add GitHub Secrets → Push to master → Watch it deploy! 🚀

---

*Production-Ready CI/CD for Natspaper*
