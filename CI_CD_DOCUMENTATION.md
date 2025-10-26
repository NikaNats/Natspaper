# 🚀 CI/CD Pipeline Documentation

**Last Updated:** October 26, 2025

---

## 📋 Overview

This project uses GitHub Actions for automated testing, security checks, and deployments. All pipelines are production-ready and follow best practices.

### Quick Stats
- **5 Main Workflows** - Test, Security, Deploy, Release, Schedule
- **Automated Testing** - Unit, Integration, and E2E tests
- **Security Scanning** - Dependency checks, secret scanning, code quality
- **Auto Deployment** - Push to master → Auto deploy to production
- **Release Management** - Tag-based releases with artifacts

---

## 🔄 Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📝 PULL REQUEST                    🚀 PUSH (master)        │
│  ├─ pr-checks.yml                   ├─ ci.yml               │
│  │  ├─ Validate PR title             │  ├─ Lint             │
│  │  ├─ Build check                   │  ├─ Format check     │
│  │  ├─ Type check                    │  └─ Build            │
│  │  └─ Add welcome comment           ├─ test.yml            │
│  │                                    │  ├─ Unit tests       │
│  └─ test.yml                         │  ├─ Integration      │
│     ├─ Unit tests                    │  └─ E2E tests        │
│     ├─ Integration tests             ├─ security.yml        │
│     └─ E2E tests                     │  ├─ Audit deps       │
│                                       │  ├─ Secret scan      │
│  🔒 SECURITY (Weekly + Push)        │  └─ CodeQL            │
│  └─ security.yml                     └─ cd-deploy.yml       │
│     ├─ Dependency audit                 ├─ Build            │
│     ├─ Secret scanning                  ├─ Tests            │
│     ├─ Code quality                     ├─ Verify build    │
│     └─ CodeQL analysis                  └─ Deploy to Vercel │
│                                          │
│  📦 RELEASE (Tag push)              ⏰ SCHEDULED            │
│  └─ release.yml                     └─ schedule.yml         │
│     ├─ Build production              ├─ Daily build        │
│     ├─ Create release                └─ Check updates      │
│     └─ Upload artifacts              │                      │
│                                       └─ Weekly security    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Workflow Details

### 1. **ci.yml** - Basic CI (Pull Requests)
**Trigger:** Pull requests to any branch

**Steps:**
1. Checkout code
2. Setup Node.js + pnpm
3. Install dependencies
4. Lint code
5. Check formatting
6. Build project

**Duration:** ~3 minutes  
**Status:** ✅ Active

---

### 2. **test.yml** - Comprehensive Tests
**Trigger:** Push to master/develop or PR

**Jobs:**
- **Unit Tests** - Run vitest suite
- **Integration Tests** - Full pipeline testing
- **E2E Tests** - User interaction simulation

**Features:**
- Coverage reports uploaded to Codecov
- Test results reported as artifacts
- Failure notifications

**Duration:** ~10-20 minutes  
**Status:** ✅ Active

---

### 3. **security.yml** - Security Checks
**Trigger:** Push to master/develop, PR, or weekly schedule

**Jobs:**
- **Dependency Check** - npm audit for vulnerabilities
- **Secret Scanning** - TruffleHog secret detection
- **Code Quality** - ESLint + TypeScript checks
- **CodeQL Analysis** - GitHub's code analysis

**Features:**
- Reports security events
- Fails on moderate+ vulnerabilities
- Weekly scheduled scans

**Duration:** ~15 minutes  
**Status:** ✅ Active

---

### 4. **cd-deploy.yml** - Continuous Deployment
**Trigger:** Push to master branch (or manual)

**Steps:**
1. Checkout code
2. Setup environment
3. Install dependencies
4. Lint & format check
5. Run tests
6. Build project
7. Verify build output
8. **Deploy to Vercel**

**Environment:** Production  
**URL:** https://nika-natsvlishvili.dev  
**Duration:** ~15 minutes  
**Status:** ✅ Ready (needs Vercel secrets)

---

### 5. **pr-checks.yml** - Pull Request Validation
**Trigger:** Pull request events

**Jobs:**
- **PR Title Validation** - Semantic commit format
- **Build Check** - Verify PR builds successfully
- **Welcome Comment** - Auto-add helpful comment

**Features:**
- Enforces conventional commits
- Prevents broken code merges
- Community engagement

**Duration:** ~10 minutes  
**Status:** ✅ Active

---

### 6. **release.yml** - Release Management
**Trigger:** Git tag push (v*.*.*)

**Steps:**
1. Checkout with history
2. Setup Node.js
3. Install dependencies
4. Build production version
5. Create build artifact
6. Create GitHub Release
7. Upload artifacts

**Features:**
- Auto-generates release notes
- Creates downloadable artifacts
- Deployment tracking

**Duration:** ~15 minutes  
**Status:** ✅ Ready

---

### 7. **schedule.yml** - Scheduled Tasks
**Trigger:** Daily 2 AM UTC (customizable)

**Jobs:**
- **Daily Build** - Full build verification
- **Dependency Updates** - Check outdated packages

**Features:**
- Ensures dependencies stay fresh
- Detects breaking changes early
- Proactive security monitoring

**Duration:** ~10 minutes  
**Frequency:** Daily at 2 AM UTC  
**Status:** ✅ Active

---

## 🔐 Required GitHub Secrets

### For Deployment (cd-deploy.yml)
```
VERCEL_TOKEN              # From Vercel account
VERCEL_ORG_ID             # Vercel org ID
VERCEL_PROJECT_ID         # Vercel project ID
SENTRY_AUTH_TOKEN         # Sentry authentication token (NEW - after revocation)
SENTRY_DSN                # Sentry DSN (optional)
PUBLIC_SENTRY_DSN         # Public Sentry DSN (optional)
```

### For Code Coverage
```
CODECOV_TOKEN             # From codecov.io (optional)
```

### GitHub Automatic
```
GITHUB_TOKEN              # Automatically provided
```

---

## ⚙️ Setup Instructions

### Step 1: Add GitHub Secrets

1. Go to: `https://github.com/NikaNats/Natspaper/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret:

```bash
# Example for Vercel
VERCEL_TOKEN = <your-vercel-token>
VERCEL_ORG_ID = <your-org-id>
VERCEL_PROJECT_ID = <your-project-id>

# Example for Sentry (use new token after revocation)
SENTRY_AUTH_TOKEN = sntrys_xxxxx...
```

### Step 2: Configure Deployment Target

Update `cd-deploy.yml` if needed:
```yaml
environment:
  name: production
  url: https://nika-natsvlishvili.dev  # Your production URL
```

### Step 3: Verify Workflows

1. Go to: `https://github.com/NikaNats/Natspaper/actions`
2. Check all workflows are present and enabled
3. Monitor first runs for any issues

---

## 🚀 How It Works

### On Pull Request
```
PR opened → pr-checks.yml runs
├─ Validate commit message
├─ Build verification
└─ Auto-add helpful comment

If approved & merged:
→ Trigger ci.yml + test.yml + security.yml
```

### On Push to Master
```
Push to master → ci.yml + test.yml + security.yml
│
If all pass:
→ cd-deploy.yml runs
  ├─ Final build
  ├─ Run all tests
  └─ Deploy to Vercel
```

### On Release Tag
```
git tag v1.0.0 && git push --tags
→ release.yml runs
├─ Build production
├─ Create GitHub Release
└─ Upload artifacts
```

---

## 📊 Monitoring & Debugging

### View Workflow Status
1. Go to: `https://github.com/NikaNats/Natspaper/actions`
2. Select workflow to view
3. Click run to see details

### Common Issues

#### Issue: Deployment Failed
**Solution:**
1. Check Vercel secrets are correct
2. Verify build locally: `pnpm run build`
3. Check Sentry token is valid

#### Issue: Tests Failing
**Solution:**
1. Run locally: `pnpm run test:run`
2. Check environment variables
3. Review test output in Actions

#### Issue: Secret Not Found
**Solution:**
1. Add secret to GitHub settings
2. Workflow must reference exact secret name
3. Wait for workflow to re-run

---

## 📈 Best Practices

### ✅ Do's
- Use semantic versioning for releases: `v1.2.3`
- Keep builds fast (target < 10 minutes)
- Monitor workflow runs weekly
- Update dependencies regularly
- Review security scanning results

### ❌ Don'ts
- Don't commit `.env.local` files
- Don't hardcode secrets in workflows
- Don't skip security checks
- Don't merge failing PRs
- Don't ignore dependency warnings

---

## 🔄 Maintenance

### Weekly
- [ ] Check GitHub Actions tab for failures
- [ ] Review security scanning results
- [ ] Monitor Sentry error reports

### Monthly
- [ ] Update dependencies: `pnpm update`
- [ ] Review workflow logs
- [ ] Update secrets if rotated

### Quarterly
- [ ] Audit all dependencies
- [ ] Review and update workflows
- [ ] Performance optimization

---

## 📝 Environment Variables

### Build-Time Variables
```yaml
SITE_WEBSITE: https://nika-natsvlishvili.dev
NODE_ENV: production
SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
PUBLIC_SENTRY_DSN: ${{ secrets.PUBLIC_SENTRY_DSN }}
```

### Deployed-Time Variables
```
VERCEL_TOKEN: From Vercel account
VERCEL_ORG_ID: Organization ID
VERCEL_PROJECT_ID: Project ID
```

---

## 🎯 Next Steps

### Immediate (Today)
- [ ] Add Vercel secrets to GitHub
- [ ] Add Sentry secrets (new token)
- [ ] Verify workflows in Actions tab

### Short Term (This Week)
- [ ] Test first deployment
- [ ] Monitor build times
- [ ] Configure notifications

### Long Term (This Month)
- [ ] Set up branch protection rules
- [ ] Configure codeowners
- [ ] Document release process

---

## 📞 Support

### Resources
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Sentry Integration Docs](https://docs.sentry.io/)

### Workflow Repository
- All workflows: `.github/workflows/`
- CI config: `.github/workflows/ci.yml`
- Deploy config: `.github/workflows/cd-deploy.yml`

---

## ✅ Checklist

- [ ] Workflows created in `.github/workflows/`
- [ ] GitHub secrets configured
- [ ] Vercel credentials added
- [ ] Sentry token added (new one after revocation)
- [ ] First deployment tested
- [ ] Workflows monitored
- [ ] Documentation saved

---

**Status:** ✅ **PRODUCTION READY**

All workflows are configured and ready to use. Monitor the Actions tab after first push.
