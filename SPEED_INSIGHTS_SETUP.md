# Vercel Speed Insights Setup Guide

## Overview

Vercel Speed Insights has been successfully integrated into your **natspaper** project. This guide documents the setup and provides instructions for analyzing your website's performance.

## What's Been Implemented

### ✅ 1. Package Installation
- **Package**: `@vercel/speed-insights ^1.2.0`
- **Location**: `package.json` (dependencies)
- **Installation Command**: `pnpm add @vercel/speed-insights`

### ✅ 2. Component Integration
**File**: `src/layouts/Layout.astro`

- **Import Added** (line 6):
  ```astro
  import SpeedInsights from "@vercel/speed-insights/astro";
  ```

- **Component Placement** (line 271): Added in the `<head>` section, right before `<ClientRouter />`:
  ```astro
  <!-- Vercel Speed Insights for real user performance monitoring -->
  <SpeedInsights />
  ```

### ✅ 3. Build Verification
- Build completed successfully
- Speed Insights properly bundled in production build (`dist/index.html`)
- `<vercel-speed-insights>` custom element loaded
- Zero compilation errors

---

## What Speed Insights Measures

Speed Insights tracks **Core Web Vitals** - Google's metrics for real user experience:

### 1. **Largest Contentful Paint (LCP)**
- **What it measures**: How fast does the main content load?
- **For natspaper**: Profile picture on homepage, post titles, hero images
- **Target**: < 2.5 seconds
- **Your advantage**: Already optimized with Astro's `<Picture>` component

### 2. **Interaction to Next Paint (INP)**
- **What it measures**: How responsive is the page to user clicks?
- **For natspaper**: Theme toggle, search, copy button, interactive features
- **Target**: < 200 milliseconds
- **Your advantage**: Minimal JavaScript + deferred Sentry = fast interactions

### 3. **Cumulative Layout Shift (CLS)**
- **What it measures**: Does the page layout jump around while loading?
- **For natspaper**: Images, fonts, ads loading
- **Target**: < 0.1
- **Your advantage**: Fixed dimensions + font-display: swap = stable layout

### 4. **Real Experience Score (RES)**
- Weighted average of all Core Web Vitals
- **Green (90-100)**: Excellent performance
- **Orange (50-89)**: Needs improvement
- **Red (0-49)**: Significant issues

---

## Next Steps to Go Live

### Step 1: Enable Speed Insights in Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **natspaper** project
3. Click the **Speed Insights** tab
4. Click **Enable**

This is a one-time setup. Vercel is now ready to collect performance data.

### Step 2: Deploy to Vercel
Push your changes to GitHub. Vercel will automatically deploy:
```bash
git add src/layouts/Layout.astro package.json pnpm-lock.yaml
git commit -m "feat: add Vercel Speed Insights for performance monitoring"
git push origin master
```

Or deploy directly:
```bash
vercel deploy
```

### Step 3: Wait for Data
- **Timeline**: 2-24 hours for initial data to populate
- **Why**: Speed Insights needs real user visits to collect data
- **Expected**: Your first insights will include your own visit + any other visitors

### Step 4: Analyze Your Performance
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **natspaper** project
3. Click the **Speed Insights** tab
4. Review your Real Experience Score (RES)

---

## How to Interpret Your Data Correctly

### 1. Start with the Real Experience Score (RES)
Your north star metric. It's a weighted average of Core Web Vitals.

| Score | Status | Action |
|-------|--------|--------|
| 90-100 | ✅ Green | Maintain performance |
| 50-89 | ⚠️ Orange | Investigate & improve |
| 0-49 | ❌ Red | Urgent optimization needed |

**For natspaper**: You should see a Green score due to:
- Lightweight Astro framework
- Optimized images with `<Picture>`
- Deferred Sentry initialization
- Minimal third-party scripts

### 2. Drill Down into Core Web Vitals
Look at individual metrics to find bottlenecks:

#### Largest Contentful Paint (LCP)
- **Check**: Is content loading fast enough?
- **For natspaper**: Check if fonts are blocking render
- **Fix**: You already have font preloading and `font-display: swap`

#### Interaction to Next Paint (INP)
- **Check**: Is the page responding quickly?
- **For natspaper**: JavaScript execution time
- **Fix**: Already optimized - Sentry deferred, minimal JS

#### Cumulative Layout Shift (CLS)
- **Check**: Is the layout stable?
- **For natspaper**: Check web fonts and image loading
- **Fix**: Already optimized with fixed dimensions

### 3. Use Filters to Find Problems
The **Kanban board view** is your diagnostic tool:

#### Filter by Path
- Shows pages ranked by performance
- **Use case**: Is homepage slower than blog posts?
- **Action**: Focus optimization on slowest pages

#### Filter by Device
- Mobile vs Desktop performance
- **Key insight**: Mobile always slower (less power, slower network)
- **Action**: Optimize for mobile first

#### Filter by Country
- Geographic performance distribution
- **Key insight**: Distant regions may have higher latency
- **Action**: Vercel's global Edge Network handles this automatically

#### Filter by Browser
- Performance across different browsers
- **Use case**: Identify browser-specific issues
- **Action**: Test and optimize for problem browsers

---

## Free Tier Limitations (Hobby Plan)

### Data Point Limit
- **10,000 data points per month**
- **1 data point** = 1 metric from 1 user (LCP, INP, CLS = 3 data points)
- **Effective**: ~1,500-3,000 user visits per month
- **For natspaper**: More than enough for a personal blog

### Reporting Window
- **Data retention**: 7 days
- **Implication**: Can't view long-term trends
- **Strategy**: Check dashboard weekly, especially after deployments

### Recommended Workflow
1. **Before deployment**: Note current RES
2. **After deployment**: Wait 1-2 hours
3. **Compare**: Did RES improve or degrade?
4. **Optimize**: If degraded, investigate & fix
5. **Weekly review**: Regular check-in on performance

---

## Performance Optimization Tips for Natspaper

Since your project is already well-optimized, here are additional tips:

### Already Doing Well ✅
- Image optimization with `<Picture>` component
- Font preloading and `font-display: swap`
- Deferred Sentry initialization
- Minimal third-party scripts
- Lightweight Astro framework

### Potential Improvements 🔧
1. **Monitor LCP**: If slow, check for large hero images
2. **Monitor INP**: If slow, profile JavaScript with DevTools
3. **Monitor CLS**: If high, check for dynamic content
4. **Code splitting**: Ensure large dependencies load lazily
5. **Image optimization**: Use WebP/AVIF formats (already doing this!)

### Testing Locally
Use Lighthouse or PageSpeed Insights:
```bash
# Build for production
pnpm run build

# Preview production build locally
pnpm run preview
```

Then test with Lighthouse (DevTools → Lighthouse tab)

---

## Understanding the Dashboard Panels

### Overview Panel
- High-level performance summary
- Real Experience Score (RES)
- Number of real users measured
- Last 7 days of data

### Core Web Vitals Panel
- Individual LCP, INP, CLS scores
- Distribution (good/needs improvement/poor)
- Recommended fixes

### Pages Panel (Kanban View)
- All pages ranked by performance
- Green/yellow/red indicators
- Filter by device, country, browser

### Timeseries Panel
- Performance over time (7-day window)
- Trends in RES
- Spike detection

---

## Verifying It's Working

### After Deployment
1. Visit your site
2. Open DevTools → Network tab
3. Look for request to `/_vercel/speed-insights/script.js`
4. If present: ✅ Working correctly

### In Dashboard
1. Wait 2-24 hours
2. Go to Speed Insights tab
3. Look for "Number of real users measured"
4. If > 0: ✅ Data is being collected

---

## Advanced Configuration (Optional)

### Disable in Development
Speed Insights automatically disables in development (NODE_ENV=development), so you won't waste data points on local testing.

### Sample Rate
Adjust what percentage of users get sampled:
```astro
<SpeedInsights sampleRate={0.1} /> {/* Sample 10% of users */}
```

### Custom Route
Override automatic route detection:
```astro
<SpeedInsights route="/custom-route" />
```

### beforeSend Function
Filter specific pages from tracking (similar to Web Analytics):
```javascript
<script is:inline>
  window.speedInsightsBeforeSend = function (event) {
    if (event.pathname.includes('/admin')) {
      return null; // Don't track this page
    }
    return event;
  };
</script>
```

---

## Documentation References

- **Official Guide**: https://vercel.com/docs/speed-insights
- **Core Web Vitals**: https://web.dev/vitals/
- **Performance Best Practices**: https://web.dev/performance/
- **Astro Optimization**: https://docs.astro.build/en/guides/performance/

---

## Troubleshooting

### Data Not Appearing?
1. **Check enabled status**: Verify Speed Insights is enabled in dashboard
2. **Wait for data**: Takes 2-24 hours for initial population
3. **Visit the site**: You need real users for data collection
4. **Check limits**: Ensure you haven't exceeded 10,000 data points/month

### Script Not Loading?
1. **Hard refresh**: Clear cache (Ctrl+Shift+R)
2. **Check console**: Look for any error messages
3. **Verify deployment**: Ensure latest code is deployed
4. **Check blockers**: Ad blockers might prevent script loading

### Performance Seems Worse Than Expected?
1. **Check network conditions**: DevTools can simulate slow networks
2. **Compare devices**: Mobile vs Desktop performance differs
3. **Check geographic location**: Latency affects scores
4. **Review page**: Identify which specific page is slow

---

## Integration with Web Analytics

You now have two complementary tools:

| Tool | Purpose | Measures |
|------|---------|----------|
| **Web Analytics** | User behavior | Page views, referrers, bounce rate |
| **Speed Insights** | Performance | LCP, INP, CLS, overall speed |

**Combined strategy**: 
- Use Web Analytics to find popular pages
- Use Speed Insights to optimize those popular pages

---

## Final Checklist

- [ ] `@vercel/speed-insights` package installed
- [ ] `SpeedInsights` component imported in `Layout.astro`
- [ ] `<SpeedInsights />` placed in `<head>` section
- [ ] Changes committed to Git
- [ ] Deployed to Vercel
- [ ] Speed Insights enabled in Vercel dashboard
- [ ] Visited site and waited for data
- [ ] Data appearing in Speed Insights dashboard
- [ ] Reviewed Real Experience Score (RES)
- [ ] Drilled down into specific Core Web Vitals

---

**Setup Date**: November 2, 2025  
**Status**: ✅ Complete and Ready to Deploy  
**Package Version**: @vercel/speed-insights ^1.2.0  
**Integration**: Astro via SpeedInsights component
