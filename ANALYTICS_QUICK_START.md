# Vercel Web Analytics - Quick Reference

## What Was Installed

✅ **Package**: `@vercel/analytics@1.5.0`  
✅ **Location**: `src/layouts/Layout.astro`  
✅ **Status**: Ready to deploy

---

## What It Does

1. **Tracks page views** - Every visit is recorded
2. **Filters noise** - Excludes localhost and `/sentry-test` 
3. **Stays within limits** - Preserves your free 50,000 events/month
4. **Provides insights** - Shows top pages, referrers, bounce rates, device data

---

## Getting Started (3 Steps)

### Step 1: Enable in Vercel Dashboard
```
1. Go to https://vercel.com/dashboard
2. Click on natspaper project
3. Click Analytics tab
4. Click Enable
```

### Step 2: Deploy
```bash
git add .
git commit -m "feat: add Vercel Web Analytics"
git push origin master
```

### Step 3: Verify
Open your site → Browser DevTools → Network tab → Look for `/_vercel/insights/view`

---

## How to Customize

### Add More Filtered Routes
Edit `src/layouts/Layout.astro` (around line 247):

```javascript
window.webAnalyticsBeforeSend = function (event) {
  // Existing filters...
  
  // Add new filter:
  if (event.url.includes('/admin')) {
    return null;
  }
  
  return event;
};
```

### Remove Query Parameters
```javascript
// Redact sensitive info from URL
if (event.url.includes('?token=')) {
  event.url = event.url.replace(/\?token=[^&]*/, '?token=REDACTED');
}
```

### Enable Debug Mode
```astro
<Analytics debug="true" />
```

---

## Key Metrics

| Metric | What It Means |
|--------|--------------|
| **Top Pages** | Your most popular posts |
| **Referrers** | Where traffic comes from |
| **Bounce Rate** | % of visitors who leave without exploring |
| **Devices** | Mobile vs Desktop split |
| **Countries** | Geographic distribution |

---

## Important Files

- `src/layouts/Layout.astro` - Analytics component + beforeSend filter
- `VERCEL_ANALYTICS_SETUP.md` - Complete setup guide
- `ANALYTICS_VERIFICATION_REPORT.md` - Technical verification

---

## Troubleshooting

**Not seeing /_vercel/insights/view?**
- Check that Analytics is enabled in Vercel dashboard
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache

**Getting too many events?**
- Add more filters to `beforeSend`
- Check for bot traffic in analytics dashboard

**Data not appearing?**
- Wait 1-2 hours for initial data
- Visit the site a few times
- Check that deployment is live

---

## Tips

💡 Focus on answering: "What content resonates?"  
💡 Use referrers to understand distribution  
💡 Monitor bounce rates on homepage  
💡 Track performance across devices  
💡 Look for content trends over time  

---

## Free Tier Limits

- 50,000 events/month
- 30-day data retention
- No custom events
- Basic analytics panels

**Upgrade to Pro** for more events, longer retention, and custom event tracking.

---

## More Help

📖 Vercel Docs: https://vercel.com/docs/analytics  
🔒 Privacy Guide: https://vercel.com/docs/analytics/redacting-sensitive-data  
⚙️ Advanced Config: https://vercel.com/docs/analytics/analytics-config

---

**Ready to deploy!** 🚀
