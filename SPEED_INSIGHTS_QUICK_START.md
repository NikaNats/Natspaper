# Vercel Speed Insights - Quick Start & Analysis Guide

## What It Does

Vercel Speed Insights measures real user performance by tracking **Core Web Vitals**:
- **LCP** (Largest Contentful Paint): How fast does content load?
- **INP** (Interaction to Next Paint): How responsive is the page?
- **CLS** (Cumulative Layout Shift): Does the layout stay stable?

---

## Getting Started (3 Steps)

### Step 1: Enable in Vercel Dashboard
```
1. Go to https://vercel.com/dashboard
2. Click natspaper project
3. Click Speed Insights tab
4. Click Enable
```

### Step 2: Deploy
```bash
git add .
git commit -m "feat: add Vercel Speed Insights"
git push origin master
```

### Step 3: Monitor
- Wait 2-24 hours for data
- Visit dashboard → Speed Insights tab
- Review Real Experience Score (RES)

---

## Understanding Your Scores

### Real Experience Score (RES)
| Score | Status | Action |
|-------|--------|--------|
| 90-100 | ✅ Great | Maintain |
| 50-89 | ⚠️ Good | Monitor |
| 0-49 | ❌ Poor | Optimize |

### Core Web Vitals
| Metric | Target | What It Means |
|--------|--------|--------------|
| **LCP** | < 2.5s | Content load speed |
| **INP** | < 200ms | Click responsiveness |
| **CLS** | < 0.1 | Layout stability |

---

## Analyzing Your Data

### The Quick Check (5 minutes)
1. Open Speed Insights dashboard
2. Check RES (top number)
3. Look at the three Core Web Vitals
4. ✅ If mostly green: You're good
5. ⚠️ If orange/red: Click to drill down

### The Deep Dive (15 minutes)

**Find Slow Pages**:
- Click "Kanban" view
- Pages ranked slowest → fastest
- Click slowest page to investigate

**Check by Device**:
- Toggle Mobile/Desktop
- Mobile usually slower (that's normal)
- Focus on mobile optimization

**Check by Geography**:
- Filter by Country
- Identify problem regions
- (Vercel Edge Network handles this automatically)

---

## Quick Fixes for Common Issues

### If LCP is High
- **Problem**: Content loading slowly
- **Check**: Are images optimized? (already done!)
- **Check**: Is font loading blocking? (already optimized!)
- **Action**: Profile with DevTools → Performance

### If INP is High
- **Problem**: Page not responding to clicks
- **Check**: Is JavaScript running too long?
- **Action**: Defer heavy scripts (you already do this!)
- **Verify**: No large bundles loading synchronously

### If CLS is High
- **Problem**: Layout jumping/shifting
- **Check**: Images with fixed dimensions? (already done!)
- **Check**: Fonts with font-display: swap? (already done!)
- **Action**: Avoid dynamic content loading

---

## Your Advantages

Your natspaper project already has performance optimization built-in:

✅ **Image Optimization**: Using Astro's `<Picture>` component  
✅ **Font Loading**: Preloaded + `font-display: swap`  
✅ **Minimal JS**: Deferred Sentry + minimal interactivity  
✅ **Lightweight Framework**: Astro = less boilerplate  
✅ **Static Generation**: Pre-built pages = instant load  

**Expected Result**: Green RES score (90-100)

---

## Workflow Recommendations

### Weekly Check-In
```
Every Monday:
  1. Visit dashboard
  2. Compare RES to last week
  3. Check if any pages degraded
  4. Note any new issues
```

### After Deployment
```
Immediately after pushing:
  1. Wait 1-2 hours
  2. Check dashboard
  3. Compare metrics to before
  4. If worse: investigate & revert
```

### Monthly Review
```
Once a month:
  1. Analyze trends
  2. Identify slowest pages
  3. Plan optimizations
  4. Document findings
```

---

## Free Tier Limits

- **10,000 data points/month** ≈ 1,500-3,000 user visits
- **7-day data window** (rolling)
- **Enough for**: Personal blog + startup projects

**When to upgrade**: If you exceed limits or need longer history

---

## Combining with Web Analytics

You now have two tools:

| Tool | Tells You |
|------|-----------|
| **Web Analytics** | Which pages are popular |
| **Speed Insights** | Which pages are fast |

**Strategy**: Popular pages + Fast performance = Success

---

## Common Dashboard Features

### Overview Panel
- Your RES at a glance
- Number of real users measured
- 7-day performance trend

### Vitals Panel
- Individual LCP, INP, CLS scores
- Distribution: good/needs work/poor

### Pages Kanban
- All pages ranked by performance
- Color coding: green/yellow/red
- Click page for detailed breakdown

### Filters
- **Device**: Mobile vs Desktop
- **Country**: Geographic distribution
- **Browser**: Which browsers have issues

---

## Pro Tips

💡 **Mobile First**: Always check mobile performance first  
💡 **After Deploy**: Always compare metrics before/after  
💡 **Focus**: Optimize your homepage + top 3 popular posts  
💡 **Trends**: Look for degradation over time  
💡 **Users**: Real user data > synthetic tests  

---

## What NOT to Do

❌ Don't ignore orange/red scores  
❌ Don't deploy breaking changes without checking metrics  
❌ Don't compare Lighthouse to Real User data (different methods)  
❌ Don't waste data points on test pages (filter them out)  
❌ Don't over-optimize edge cases (focus on median users)  

---

## Testing Locally

Use Lighthouse to get a preview:
```bash
pnpm run build
pnpm run preview
# Then: DevTools → Lighthouse → Generate Report
```

**Note**: Lighthouse ≠ Real User data, but good for quick checks

---

## Help & Documentation

📖 **Vercel Docs**: https://vercel.com/docs/speed-insights  
🎯 **Core Web Vitals**: https://web.dev/vitals/  
⚡ **Performance Tips**: https://web.dev/performance/  
🚀 **Astro Perf**: https://docs.astro.build/en/guides/performance/

---

## Next Steps

1. ✅ Enable Speed Insights in dashboard
2. ✅ Deploy your changes
3. ⏳ Wait 2-24 hours for data
4. 📊 Review Real Experience Score
5. 🔍 Drill down into Core Web Vitals
6. 🎯 Focus optimization on slowest pages
7. 📈 Monitor weekly after deployments

**Ready to deploy!** 🚀
