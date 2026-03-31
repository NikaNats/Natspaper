# Tasks: Remove Unused Files

**Branch**: `001-remove-unused-files`
**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)

## Phase 1 – Remove dead config/ barrel files (US1 · P1)

- [x] T001 [P] Delete `config/features.ts`
- [x] T002 [P] Delete `config/index.ts`

## Phase 2 – Remove dead utils barrels (US1 · P1)

- [x] T003 [P] Delete `src/utils/analytics.ts`
- [x] T004 [P] Delete `src/utils/index.ts`
- [x] T005 [P] Delete `src/utils/analytics/index.ts`
- [x] T006 [P] Delete `src/utils/features/index.ts`
- [x] T007 [P] Delete `src/utils/i18n/index.ts`
- [x] T008 [P] Delete `src/utils/i18n/copyright.ts`
- [x] T009 [P] Delete `src/utils/transformers/index.ts`
- [x] T010 [P] Delete `src/utils/transformers/fileName.ts`

## Phase 3 – Remove dead OG templates island (US1 · P1)

- [x] T011 [P] Delete `src/utils/og/templates/index.ts`
- [x] T012 [P] Delete `src/utils/og/templates/OgImageGenerator.ts`
- [x] T013 [P] Delete `src/utils/og/templates/OgImageManager.ts`
- [x] T014 [P] Delete `src/utils/og/templates/OgTemplateRenderer.ts`
- [x] T015 [P] Delete `src/utils/og/templates/SatoriConfigManager.ts`
- [x] T016 [P] Delete `src/utils/og/templates/site.ts`
- [x] T017 [P] Delete `src/utils/og/templates/SiteOgImageGenerator.ts`

## Phase 4 – Remove dead UI components (US2 · P2)

- [x] T018 [P] Delete `src/components/ui/index.ts`
- [x] T019 [P] Delete `src/components/ui/BackButton.astro`
- [x] T020 [P] Delete `src/components/ui/Button.astro`
- [x] T021 [P] Delete `src/components/ui/Card.astro`
- [x] T022 [P] Delete `src/components/ui/Container.astro`
- [x] T023 [P] Delete `src/components/ui/Grid.astro`
- [x] T024 [P] Delete `src/components/ui/Link.astro`
- [x] T025 [P] Delete `src/components/ui/Section.astro`
- [x] T026 [P] Delete `src/components/ui/Tag.astro`
- [x] T027 [P] Delete `src/components/post/PostMeta.astro`

## Phase 5 – Validate (blocking gate)

- [ ] T028 Run `pnpm build:prod` — must succeed with zero errors
- [ ] T029 Run `pnpm test:run` — all unit tests must pass
