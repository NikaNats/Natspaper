# Implementation Plan: Remove Unused Files

**Branch**: `001-remove-unused-files` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)

## Summary

Delete all source files that are confirmed unreferenced by any active import chain, dynamic URL, or framework auto-load mechanism. Verification via knip + manual grep. Final gate: `pnpm build:prod` + `pnpm test:run`.

## Technical Context

**Language/Version**: TypeScript 5.9 strict / Astro 5.x
**Primary Dependencies**: Astro, Tailwind CSS v4, Vitest, Playwright
**Storage**: N/A
**Testing**: Vitest (unit) + Playwright (E2E)
**Target Platform**: Static site build (Vercel)
**Project Type**: SSG blog/content site
**Constraints**: Must not break any existing test; must not delete framework-loaded assets
**Scale/Scope**: 27 files to remove

## Confirmed Unused Files

### Root-level config/
- `config/features.ts` - Feature registry never imported by src code
- `config/index.ts` - Barrel never consumed

### src/utils dead barrels and islands
- `src/utils/analytics.ts`
- `src/utils/index.ts`
- `src/utils/analytics/index.ts`
- `src/utils/features/index.ts`
- `src/utils/i18n/index.ts`
- `src/utils/i18n/copyright.ts`
- `src/utils/transformers/index.ts`
- `src/utils/transformers/fileName.ts`
- `src/utils/og/templates/index.ts`
- `src/utils/og/templates/OgImageGenerator.ts`
- `src/utils/og/templates/OgImageManager.ts`
- `src/utils/og/templates/OgTemplateRenderer.ts`
- `src/utils/og/templates/SatoriConfigManager.ts`
- `src/utils/og/templates/site.ts`
- `src/utils/og/templates/SiteOgImageGenerator.ts`

### src/components never rendered
- `src/components/ui/index.ts`
- `src/components/ui/BackButton.astro`
- `src/components/ui/Button.astro`
- `src/components/ui/Card.astro`
- `src/components/ui/Container.astro`
- `src/components/ui/Grid.astro`
- `src/components/ui/Link.astro`
- `src/components/ui/Section.astro`
- `src/components/ui/Tag.astro`
- `src/components/post/PostMeta.astro`

## Files Explicitly Preserved

| File | Reason |
|------|--------|
| `public/toggle-theme.js` | Loaded via script src in ThemeManager.astro |
| `public/styles/giscus-dark.css` | Dynamic URL in Comments.astro |
| `public/styles/giscus-light.css` | Dynamic URL in Comments.astro |
| `config/integrations.ts` | Imported by astro.config.ts |
| `config/vite.ts` | Imported by astro.config.ts |
| `src/types/global.d.ts` | TS global declarations |
| `src/types/modules.d.ts` | TS module declarations |
| `src/utils/i18n/date.ts` | Imported by Datetime.astro |
| `src/utils/og/templates/post.ts` | Imported by generateOgImages.ts |
