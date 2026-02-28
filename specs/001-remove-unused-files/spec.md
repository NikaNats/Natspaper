# Feature Specification: Remove Unused Files

**Feature Branch**: `001-remove-unused-files`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Remove unused files from the Natspaper project - identify and safely delete all files that are no longer referenced, imported, or needed"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dead Code Removal (Priority: P1)

A developer wants to remove source files (`.ts`, `.astro`) that are not imported or referenced by any active code, so that the codebase stays lean and maintainable.

**Why this priority**: Dead source files create confusion, waste disk space, inflate bundle analysis, and can mislead future contributors who may assume all files are in use.

**Independent Test**: After deletion, `pnpm build:prod` succeeds with zero TypeScript errors, all existing tests pass, and knip no longer reports the deleted files.

**Acceptance Scenarios**:

1. **Given** a source file that is never imported by any `.astro`, `.ts`, `.mjs`, or `.js` file in `src/`, `config/`, `tests/`, **When** the file is deleted, **Then** `pnpm build:prod` still succeeds with no new errors.
2. **Given** a barrel/index file that only re-exports symbols that are already imported directly from their source files by all consumers, **When** the barrel is deleted, **Then** no import in the codebase breaks.

---

### User Story 2 - Orphaned UI Components (Priority: P2)

A developer wants to remove `.astro` UI components that exist in the design system but are never rendered in any page or layout.

**Why this priority**: Orphaned components suggest abandoned design work; they burden reviewers and may cause confusion about active UI primitives.

**Independent Test**: After deletion, all existing E2E and unit tests continue to pass, and the visual output of rendered pages is unchanged.

**Acceptance Scenarios**:

1. **Given** a UI component that is never used via `<ComponentName />` in any layout, page, or other component, **When** the file is deleted, **Then** the site builds and all E2E tests pass.

---

### Edge Cases

- Files referenced dynamically via URL (e.g. `public/toggle-theme.js`, `public/styles/*.css`) must NOT be deleted even if static-analysis tools report them as unused.
- Config files loaded by framework infrastructure (e.g. `config/integrations.ts`, `config/vite.ts`) must NOT be deleted even if they have no TypeScript import chain.
- Declaration files (`*.d.ts`) included via `tsconfig.json` `include` globs must NOT be deleted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All source files (`.ts`, `.astro`) that are never imported by active code MUST be deleted.
- **FR-002**: All barrel/index files that only re-export symbols never consumed by any active import MUST be deleted.
- **FR-003**: Unused UI components that are never rendered in any page, layout, or other component MUST be deleted.
- **FR-004**: Files referenced dynamically via URL (e.g. `public/` assets loaded via `src` attributes or dynamic URL construction) MUST NOT be deleted.
- **FR-005**: Framework-loaded config files (e.g. `config/integrations.ts`, `config/vite.ts`) MUST NOT be deleted.
- **FR-006**: TypeScript declaration files (`*.d.ts`) included via `tsconfig.json` MUST NOT be deleted.
- **FR-007**: After all deletions, `pnpm build:prod` (which runs `astro check` + `astro build` + `verify-build.js`) MUST complete without errors.
- **FR-008**: After all deletions, all existing unit and E2E tests MUST continue to pass.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 25 source files confirmed unused are removed from the repository.
- **SC-002**: After deletion, the full CI gate (`pnpm build:prod; pnpm test:run`) passes with zero new failures.
- **SC-003**: No file that is actually used at runtime (directly imported, dynamically loaded, or framework-loaded) is deleted.
