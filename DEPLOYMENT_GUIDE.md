# 🚀 Deployment Guide: Natspaper

**Objective:** Deploy the performance-optimized Astro blog to Vercel Production.  
**Target Metrics:** Lighthouse 100, FCP < 2s, LCP < 2.5s.

## 1. Prerequisites

Ensure your local environment matches production requirements:

**Node.js:** v20+ (LTS recommended)  
**Package Manager:** pnpm v9+

**Environment:** `.env.production` exists with:

```env
SITE_WEBSITE=https://your-domain.com
```

## 2. Local Build Verification (Do Not Skip)

Never push broken code. Verify the build locally first.

```bash
# 1. Set Prod Environment (PowerShell syntax)
$env:SITE_WEBSITE='https://your-domain.com'; $env:NODE_ENV='production'

# 2. Run Build Pipeline (Type Check -> Build -> Verify)
pnpm run build

# 3. Check Critical Artifacts
Test-Path "./dist/index.html"               # Must return True
Test-Path "./dist/styles/katex.min.css"     # Must return True (Bundled CSS)
```

**Success Criteria:**

- ✅ astro check passes (0 errors)
- ✅ dist/ folder contains generated HTML and assets
- ✅ No TypeScript or Linting errors

## 3. Deployment (CI/CD)

We use Git-based deployments. Pushing to main triggers Vercel's pipeline.

```bash
# 1. Stage all changes
git add .

# 2. Commit with conventional message
git commit -m "perf: optimize images, fonts, and scripts for lighthouse 100"

# 3. Push to trigger deployment
git push origin main
```

**Monitor:** Watch the build in your Vercel Dashboard. It usually takes 2–5 minutes.

## 3.1. Setting Up Giscus Comments (Required for Production)

Giscus is a comment system powered by GitHub Discussions. To enable comments in production, follow these steps:

### Step 1: Create a GitHub Discussion Repository

1. Go to the repository where you want to host discussions (typically the same repo as your blog)
2. Enable "Discussions" in repository settings: Settings → Features → Discussions ✅
3. Create a discussion category named "Announcements" (or your preferred name)

### Step 2: Get Your Giscus Configuration

1. Visit https://giscus.app/
2. Fill in your repository details (owner/repo)
3. Select your discussion category
4. Copy the values:
   - **Repository ID** (starts with `R_`)
   - **Category Name**
   - **Category ID** (starts with `DIC_`)

### Step 3: Add Environment Variables to Vercel

1. Go to your Vercel Project Settings
2. Navigate to **Environment Variables**
3. Add the following:

| Variable Name               | Value                         | Example                |
| --------------------------- | ----------------------------- | ---------------------- |
| `PUBLIC_GISCUS_REPO`        | `owner/repo`                  | `NikaNats/Natspaper`   |
| `PUBLIC_GISCUS_REPO_ID`     | Repository ID from giscus.app | `R_kgDOKmL5Zg`         |
| `PUBLIC_GISCUS_CATEGORY`    | Discussion category name      | `Announcements`        |
| `PUBLIC_GISCUS_CATEGORY_ID` | Category ID from giscus.app   | `DIC_kwDOKmL5Zs4CZj7R` |

⚠️ **Important:** These must be set for **all environments** where you want comments to appear (Production, Preview, Development).

### Step 4: Verify Locally

Before deploying, test locally:

```powershell
# Set environment variables locally
$env:PUBLIC_GISCUS_REPO='YourUsername/YourRepo'
$env:PUBLIC_GISCUS_REPO_ID='R_...'
$env:PUBLIC_GISCUS_CATEGORY='Announcements'
$env:PUBLIC_GISCUS_CATEGORY_ID='DIC_...'

# Build and test
pnpm run build
pnpm run preview

# Visit a blog post and verify comments section loads
```

### Step 5: Deploy

Once verified locally, push your changes:

```bash
git add .
git commit -m "feat: add giscus configuration"
git push origin main
```

**Troubleshooting:**

| Issue                                | Cause                                       | Solution                                                                 |
| ------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------ |
| Comments section doesn't appear      | Giscus disabled in `src/config.ts`          | Set `enabled: true` in `GISCUS` config                                   |
| "Loading comments..." hangs          | Missing environment variables               | Add all 4 variables to Vercel Project Settings                           |
| Comments iframe shows error          | Invalid repo ID or category ID              | Verify IDs from https://giscus.app/                                      |
| "Unauthorized" error                 | Repository doesn't have Discussions enabled | Enable Discussions in GitHub repo settings                               |
| CSP (Content-Security-Policy) errors | Headers blocking giscus.app                 | Check `vercel.json` has giscus.app in CSP headers ✓ (already configured) |

## 4. Post-Deployment Verification

Once Vercel reports "Ready", perform these checks on the live URL:

### A. Smoke Test

- **Load Homepage:** Ensure layout, fonts, and images load instantly
- **Check Console:** Open DevTools (F12) → Console. Zero errors allowed
- **Check Network:** Open DevTools → Network
  - Fonts: Verify Inter and KaTeX fonts return status 200
  - Images: Verify images are served as .webp or .avif

### B. Performance Audit (Lighthouse)

Run a Lighthouse audit in an Incognito window.

| Metric      | Target |
| ----------- | ------ |
| Performance | 100    |
| FCP         | < 2.0s |
| LCP         | < 2.5s |
| CLS         | 0      |

### C. Search & Math

- **Math:** Visit a post with equations. Verify KaTeX renders correctly (no raw LaTeX)

## 5. Troubleshooting Common Issues

| Issue                 | Diagnosis                      | Solution                                                                      |
| --------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Build Fails on Vercel | "SITE_WEBSITE is required"     | Add SITE_WEBSITE to Vercel Project Settings → Env Vars                        |
| Math Not Styled       | Equations look like plain text | Ensure `import "katex/dist/katex.min.css"` exists in PostDetails.astro        |
| Images not WebP       | Serving JPEGs/PNGs             | Ensure `<Picture />` or optimized markdown images are used. Clear cache       |
| Rollback Needed       | Critical bug found             | Go to Vercel Dashboard → Deployments → Click ... on previous build → Rollback |

## 6. Maintenance Commands

- **Update Deps:** `pnpm update`
- **Run Tests:** `pnpm test:all` (Run before every major feature merge)
- **Preview:** `pnpm preview` (Test production build locally)
