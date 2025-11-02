# Vercel Web Analytics Setup Guide

## Overview

Vercel Web Analytics has been successfully integrated into your **natspaper** project. This guide documents the setup and provides instructions for next steps.

## What's Been Implemented

### ✅ 1. Package Installation
- **Package**: `@vercel/analytics ^1.5.0`
- **Location**: `package.json` (dependencies)
- **Installation Command**: `pnpm add @vercel/analytics`

### ✅ 2. Component Integration
**File**: `src/layouts/Layout.astro`

- **Import Added**:
  ```astro
  import Analytics from "@vercel/analytics/astro";
  ```

- **Component Placement**: Added in the `<head>` section:
  ```astro
  <Analytics />
  ```

### ✅ 3. Privacy & Cost Control with `beforeSend`
**Critical Feature**: The `beforeSend` function filters events to:
- **Prevent localhost tracking** - Stops development environment traffic from consuming your free 50,000 event/month limit
- **Exclude test pages** - Filters out `/sentry-test` tracking
- **Future-proof filtering** - Extensible for additional paths (e.g., `/admin/*`, `/private/*`)

**Implementation** (`src/layouts/Layout.astro` - head section):
```javascript
<script is:inline>
  window.webAnalyticsBeforeSend = function (event) {
    // Ignore all events from localhost
    if (window.location.hostname === "localhost") {
      return null; // Returning null cancels the event
    }

    // Ignore tracking for the Sentry test page
    if (event.url.includes("/sentry-test")) {
      return null;
    }

    // Add any other paths you want to ignore in the future, e.g., /admin/*
    // if (event.url.includes('/admin')) {
    //   return null;
    // }

    // If no rules match, send the event
    return event;
  };
</script>
<Analytics />
```

## Next Steps to Go Live

### Step 1: Enable Web Analytics in Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **natspaper** project
3. Click the **Analytics** tab
4. Click **Enable** in the dialog

This is a one-time setup. After enabling, Vercel will add tracking routes (`/_vercel/insights/*`) on your next deployment.

### Step 2: Deploy to Vercel
Push your changes to GitHub. Vercel will automatically deploy:
```bash
git add src/layouts/Layout.astro package.json pnpm-lock.yaml
git commit -m "feat: add Vercel Web Analytics with beforeSend privacy filter"
git push origin master
```

Or deploy directly:
```bash
vercel deploy
```

### Step 3: Verify Analytics Are Working
1. Visit your deployed site
2. Open **Browser DevTools** → **Network** tab
3. Look for a request to `/_vercel/insights/view`
4. If you see this request, analytics are working correctly ✅

### Step 4: Access Your Analytics Dashboard
Once deployment is live and you have visitors:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **natspaper** project
3. Click the **Analytics** tab
4. View your analytics data

**Note**: It may take a few hours to 1-2 days for data to fully populate in the dashboard.

## Understanding Your Analytics Data

### Key Metrics to Monitor

#### 📊 **Top Pages**
- Shows which blog posts are getting the most traffic
- **Use Case**: Identify your most popular content and write more on those topics

#### 🔗 **Referrers**
- Shows where your traffic originates (Google, Twitter, forums, etc.)
- **Use Case**: Understand your content distribution channels
- **Tip**: If you see `t.co` (Twitter), you can drill down to find the exact tweets driving traffic

#### 📈 **Bounce Rate**
- **High on blog posts (>80%)**: Usually normal - readers find answers and leave satisfied
- **High on homepage**: Potential issue - may indicate unclear value proposition
- **Use Case**: Optimize your homepage or featured content if bounce rate is high

#### 🌍 **Countries, Devices, Operating Systems, Browsers**
- Shows demographic and device data about your audience
- **Use Case**: Understand if your site needs mobile optimization or if you should consider internationalization

### Strategic Questions to Answer

1. **"Which of my articles are resonating the most?"**
   - Look at **Top Pages** panel
   - Write more content on high-traffic topics

2. **"Where is my audience discovering my content?"**
   - Check **Referrers** panel
   - Optimize for top referral sources

3. **"Is my content engaging?"**
   - Monitor **Bounce Rate**
   - Track which pages keep readers on the site

4. **"Who is my audience?"**
   - Analyze **Countries**, **Devices**, **Operating Systems**, **Browsers**
   - Tailor content and design accordingly

## Advanced Configuration Options

### Mode Detection
Force production mode (useful if environment detection isn't working):
```astro
<Analytics mode="production" />
```

### Debug Mode
Enable debug logging in browser console:
```astro
<Analytics debug="true" />
```

### Custom Endpoint
Report analytics to a different URL (useful for multi-domain setups):
```astro
<Analytics endpoint="https://custom.example.com/_vercel/insights" />
```

### Custom Script Source
Load analytics script from a different URL:
```astro
<Analytics scriptSrc="https://custom.example.com/_vercel/insights/script.js" />
```

## Customizing beforeSend Filters

To add more filtering rules, edit the `beforeSend` function in `src/layouts/Layout.astro`:

```javascript
window.webAnalyticsBeforeSend = function (event) {
  // Existing filters...
  
  // Block admin pages
  if (event.url.includes('/admin')) {
    return null;
  }

  // Block private routes
  if (event.url.includes('/private')) {
    return null;
  }

  // Redact sensitive query parameters
  if (event.url.includes('?token=')) {
    event.url = event.url.replace(/\?token=[^&]*/, '?token=REDACTED');
  }

  // Return the (possibly modified) event
  return event;
};
```

## Pricing & Limits

### Hobby Plan (Free)
- **Event Limit**: 50,000 events/month
- **Analytics Duration**: 30 days of data retention
- **Note**: This is why the `beforeSend` filter is crucial - it prevents wasted events on non-user traffic

### Pro/Enterprise Plans
- Higher event limits
- Longer data retention
- Custom events support (track button clicks, form submissions, etc.)

## Documentation References

- **Official Guide**: https://vercel.com/docs/analytics
- **beforeSend Configuration**: https://vercel.com/docs/analytics/redacting-sensitive-data
- **Advanced Config**: https://vercel.com/docs/analytics/analytics-config

## Troubleshooting

### Analytics Not Showing Data?
1. **Verify deployment**: Check that your site is deployed on Vercel
2. **Check enabled status**: Ensure Analytics is enabled in Vercel dashboard
3. **Wait for data**: May take 1-2 hours for initial data to appear
4. **Verify requests**: Check Network tab for `/_vercel/insights/view` requests

### Getting Too Many Events?
1. **Add more beforeSend filters** to exclude unnecessary traffic
2. **Check for bot traffic** - bots may be sending events
3. **Review TopPages** - identify and filter low-value pages

### beforeSend Function Not Working?
1. **Clear cache**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console**: Look for any JavaScript errors
3. **Verify function syntax**: Ensure function is properly defined on `window` object

## Final Checklist

- [ ] `@vercel/analytics` package installed
- [ ] `Analytics` component imported in `Layout.astro`
- [ ] `<Analytics />` placed in `<head>` section
- [ ] `beforeSend` function configured
- [ ] Changes committed to Git
- [ ] Deployed to Vercel
- [ ] Analytics enabled in Vercel dashboard
- [ ] Verified `/_vercel/insights/view` requests in Network tab
- [ ] Data appearing in Analytics dashboard

---

**Setup Date**: November 2, 2025  
**Status**: ✅ Complete and Ready to Deploy  
**Package Version**: @vercel/analytics ^1.5.0
