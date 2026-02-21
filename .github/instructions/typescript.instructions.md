---
applyTo: "**/*.ts"
---

# TypeScript Standards — Natspaper

## Type System

- **NEVER** use `any`. Reach for `unknown` and narrow with type guards.
- **NEVER** use `enum`. Use `const` objects with `as const` and derive the union:
  ```ts
  const Direction = { Up: "up", Down: "down" } as const;
  type Direction = (typeof Direction)[keyof typeof Direction];
  ```
- Prefer `interface` over `type` for object shapes — it enables declaration merging and aids TS compiler caching.
- Use `satisfies` for config objects that must conform to a type without widening:
  ```ts
  const config = { locale: "en" } satisfies SiteConfig;
  ```

## Strictness Requirements

All files must compile under `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes: true`. Fix strict violations; never suppress with `@ts-ignore` except where unavoidable (add a FIXME comment with a reason).

## Naming & Conventions

| Construct         | Convention                                    | Example           |
| ----------------- | --------------------------------------------- | ----------------- |
| Interface         | `PascalCase`                                  | `IPostRepository` |
| Type alias        | `PascalCase`                                  | `Locale`          |
| Const union value | `SCREAMING_SNAKE_CASE` inside const obj       | `{ EN: "en" }`    |
| Generic param     | Single uppercase letter or descriptive prefix | `T`, `TPost`      |
| Private fields    | `#privateField` (native `#` syntax)           | `#cache`          |

## Import Rules

- Use `import type` for all type-only imports.
- Use path aliases (`@utils/`, `@components/`, etc.) defined in `tsconfig.json`. Never use deep relative `../../..` chains.
- All barrel `index.ts` exports are allowed; avoid re-exporting implementation details.

## Function Design

- Pure functions in `src/utils/` must be explicitly typed on return value.
- Async functions must explicitly declare `Promise<T>` return type.
- Prefer exhaustive guard patterns over optional chaining chains:
  ```ts
  // Prefer
  if (!post) throw new Error("post is required");
  // Over
  post?.title ?? "default";
  ```
- Use `ConcurrencyLimiter` from `src/utils/concurrency/` for all `Promise.all()` loops over unbounded arrays.

## File Layout (per file)

```
1. `import type` statements
2. Regular imports
3. Constants (`const X = … as const`)
4. Interface / type definitions
5. Implementation
6. Default export (if applicable)
```

## Prohibited Patterns

```ts
// ❌ Forbidden
globalThis.gc();           // Forces GC — use structured finally blocks
(obj as any).method();     // Type-erasure escape hatch
const x: any = ...;        // any escape hatch
enum Status { ... }        // Use const + as const instead
```
