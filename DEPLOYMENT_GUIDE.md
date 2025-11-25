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
SENTRY_DSN=... (Optional)
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
- **Search:** Verify the search bar returns results (loads pagefind)

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
