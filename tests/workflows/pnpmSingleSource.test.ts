import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * pnpm Single-Source-of-Truth Guard
 *
 * The canonical pnpm version lives ONLY in package.json's `packageManager`
 * field. CI, CD, preview and SonarQube workflows derive it automatically via
 * pnpm/action-setup@v4; Docker derives it via corepack. This test fails if
 * anyone reintroduces a hardcoded version into any pipeline file, which is
 * how the pnpm 10 vs 11 drift (previews/Sonar testing a different toolchain
 * than production) originally happened.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(...segments: string[]): string {
  return readFileSync(path.join(ROOT, ...segments), "utf8");
}

describe("pnpm version single source of truth", () => {
  const workflows = [
    ".github/workflows/ci.yml",
    ".github/workflows/cd-deploy.yml",
    ".github/workflows/preview.yml",
    ".github/workflows/sonarqube.yml",
  ];

  const pipelineFiles = [...workflows, "Dockerfile"];

  it("package.json pins exactly one pnpm version via packageManager", () => {
    const pkg = JSON.parse(read("package.json")) as {
      packageManager?: string;
    };

    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+/);
  });

  it.each(pipelineFiles)(
    "%s contains no hardcoded pnpm version",
    file => {
      const content = read(file);

      // Matches: PNPM_VERSION envs, `version: x.y.z` inputs,
      // and `corepack prepare pnpm@x.y.z --activate`.
      const violations = [
        ...(content.match(/PNPM_VERSION/g) ?? []),
        ...(content.match(/version:\s*\d+\.\d+\.\d+/g) ?? []),
        ...(content.match(/corepack\s+prepare\s+pnpm@/g) ?? []),
      ];

      expect(violations).toEqual([]);
    }
  );

  it("workflows rely on automatic packageManager resolution", () => {
    for (const file of workflows) {
      const content = read(file);
      expect(
        content.includes("pnpm/action-setup"),
        `${file} must set up pnpm via pnpm/action-setup`
      ).toBe(true);
    }
  });
});
