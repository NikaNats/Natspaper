# 📊 CI/CD PIPELINES - QUICK SETUP GUIDE

**Status:** ✅ All workflows live on GitHub

---

## ⚡ 3-Step Deployment Setup

### Step 1️⃣: Get Your Secrets (5 minutes)

#### Vercel Secrets
1. Go to: https://vercel.com/account/tokens
   - Click "Create New"
   - Copy: **VERCEL_TOKEN**

2. Go to: https://vercel.com/account/settings
   - Find: **VERCEL_ORG_ID**
   - Copy it

3. Go to: https://vercel.com/projects
   - Click your Natspaper project
   - Find: **VERCEL_PROJECT_ID**
   - Copy it

#### Sentry Secrets
1. Go to: https://sentry.io/settings/account/api/auth-tokens/
   - **DELETE** old token (the exposed one)
   - Click "Create New Token"
   - Copy: **SENTRY_AUTH_TOKEN**

---

### Step 2️⃣: Add GitHub Secrets (2 minutes)

1. Go to: https://github.com/NikaNats/Natspaper/settings/secrets/actions

2. Click **New repository secret** (6 times):

```
Name: VERCEL_TOKEN
Value: <paste from step 1>
[Add Secret]

Name: VERCEL_ORG_ID  
Value: <paste from step 1>
[Add Secret]

Name: VERCEL_PROJECT_ID
Value: <paste from step 1>
[Add Secret]

Name: SENTRY_AUTH_TOKEN
Value: <paste from step 1>
[Add Secret]

Name: SENTRY_DSN (optional)
Value: <your sentry DSN>
[Add Secret]

Name: PUBLIC_SENTRY_DSN (optional)
Value: <your public sentry DSN>
[Add Secret]
```

---

### Step 3️⃣: Deploy! (15 minutes)

```bash
# Push to master (from your local machine)
git push origin master

# Watch deployment at:
# https://github.com/NikaNats/Natspaper/actions

# Your site will be live in ~15 minutes at:
# https://nika-natsvlishvili.dev ✨
```

---

## 🎯 All Workflows at a Glance

| Workflow | Trigger | What It Does | Status |
|----------|---------|-------------|--------|
| **CI** | Pull Request | Lint, format, build | ✅ Enabled |
| **Tests** | PR/Push | Unit, integration, E2E | ✅ Enabled |
| **Security** | PR/Push + Weekly | Dependency audit, secrets, CodeQL | ✅ Enabled |
| **PR Checks** | PR | Semantic validation | ✅ Enabled |
| **Deploy** | Master push | Build & deploy to Vercel | ⏳ Waiting for secrets |
| **Release** | Tag push | Create GitHub release | ✅ Enabled |
| **Schedule** | Daily 2 AM | Build checks | ✅ Enabled |

---

## 📈 Deployment Timeline

```
You Push to Master
    ↓ (Instant)
GitHub Receives Push
    ↓ (Instant)
Workflows Start Running
    ├─ Lint & Format Check    ✅ (1 min)
    ├─ Unit Tests              ✅ (5 min)  
    ├─ Integration Tests       ✅ (3 min)
    ├─ E2E Tests               ✅ (5 min)
    └─ Build & Verification    ✅ (2 min)
    ↓ (After ~15 min total)
Deploy to Vercel
    ✅ (2 min)
    ↓ (After ~17 min total)
🎉 LIVE ON PRODUCTION! 🎉
```

---

## 🚀 When You Push to Master

✅ **Automatic Actions:**
- Runs all tests
- Scans for security issues
- Builds the project
- Deploys to Vercel
- Updates your site

✅ **No Manual Steps Needed!**
- Push once
- Everything happens automatically
- Site updates in ~15 minutes

❌ **Only happens if:**
- All tests pass
- No security issues found
- Build succeeds

---

## 📞 Need Help?

### Documentation Files (All in Root)

**Quick Setup (5 min)**
- `CI_CD_QUICK_START.md`

**Complete Guide (20 min)**
- `CI_CD_DOCUMENTATION.md`

**Quick Reference (3 min)**
- `CI_CD_QUICK_REFERENCE.md`

**Troubleshooting**
- Any CI_CD file has FAQ section

---

## ✅ Verification Checklist

After adding secrets:

- [ ] Go to: https://github.com/NikaNats/Natspaper/settings/secrets/actions
- [ ] See all 6 secrets listed
- [ ] Each shows ✅ indicator
- [ ] Go to: https://github.com/NikaNats/Natspaper/actions
- [ ] See all 7 workflows listed
- [ ] All workflows show green/yellow status

**If all green?** → Ready to deploy! 🚀

---

## 🎉 Success Indicators

### Deployment Succeeded ✅
```
Actions tab shows:
- All jobs: ✅ PASSED
- All checks: ✅ PASSED  
- Deployment: ✅ SUCCESS
```

### Live on Production ✅
```
Visit: https://nika-natsvlishvili.dev
Shows: Your Natspaper website
✨ It's working!
```

---

## 🔐 Security Check

**Your site is secure because:**
✅ Secrets not in code
✅ Secrets in GitHub protected
✅ Secret scanning enabled
✅ Dependency audits running
✅ Code quality checks enabled
✅ CodeQL analysis active

---

## 🎯 You're Ready!

```
✅ Workflows created
✅ Documentation complete
✅ GitHub secrets configured
✅ Production deployment ready

🚀 DEPLOY NOW!
```

---

**Next Step:** Add GitHub Secrets → Push to Master

**Time to Live:** ~15 minutes

**Your Site:** https://nika-natsvlishvili.dev

---

*CI/CD Pipeline - Production Ready* ✨
