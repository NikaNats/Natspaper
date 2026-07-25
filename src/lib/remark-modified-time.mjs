// src/lib/remark-modified-time.mjs
import { execFileSync } from "node:child_process";

/**
 * Remark plugin: Injects git modification date into frontmatter.
 *
 * Security: Uses execFileSync with array args (no shell interpolation).
 * Performance: Caches results per filepath (one git call per file per build).
 * CI-safe: Detects shallow clones and skips gracefully.
 */

// ── Module-level cache: one git call per file per build ─────────────
const modTimeCache = new Map();

// ── Shallow clone detection (computed once) ─────────────────────────
let isShallowClone = null;

function detectShallowClone() {
  if (isShallowClone !== null) return isShallowClone;
  try {
    // "true" if shallow, "false" if full clone
    const result = execFileSync(
      "git",
      ["rev-parse", "--is-shallow-repository"],
      { encoding: "utf8", timeout: 5000 }
    );
    isShallowClone = result.trim() === "true";
  } catch {
    isShallowClone = true; // Assume shallow if git fails
  }
  return isShallowClone;
}

/**
 * Get the last modification date for a file from git history.
 *
 * Uses execFileSync with array arguments to PREVENT command injection.
 * The filepath is passed as a separate argument, never interpolated
 * into a shell string.
 *
 * @param {string} filepath - Absolute path to the file
 * @returns {Date|null} - Modification date, or null if unavailable
 */
function getGitModTime(filepath) {
  // Return cached result if available
  if (modTimeCache.has(filepath)) {
    return modTimeCache.get(filepath);
  }

  // Skip entirely in shallow clones (CI with --depth=1)
  if (detectShallowClone()) {
    modTimeCache.set(filepath, null);
    return null;
  }

  try {
    // ✅ execFileSync with ARRAY args — no shell, no injection possible
    const result = execFileSync(
      "git",
      [
        "log",
        "-1",
        "--pretty=format:%cI", // ISO 8601 committer date
        "--", // ← Separator: everything after is a path
        filepath,
      ],
      {
        encoding: "utf8",
        timeout: 10000, // 10s timeout per file
        stdio: ["pipe", "pipe", "pipe"], // Suppress stderr noise
      }
    );

    const trimmed = result.trim();

    if (!trimmed) {
      // File exists but has no git history (new file, not yet committed)
      modTimeCache.set(filepath, null);
      return null;
    }

    // ✅ Parse to Date object (matches Zod z.date() schema)
    const date = new Date(trimmed);

    if (isNaN(date.getTime())) {
      console.warn(
        `[remark-modified-time] Invalid date from git for ${filepath}: "${trimmed}"`
      );
      modTimeCache.set(filepath, null);
      return null;
    }

    modTimeCache.set(filepath, date);
    return date;
  } catch (e) {
    // Git not available, file not tracked, or other error
    // Don't fail the build — just skip
    if (e.code !== "ENOENT") {
      // Only warn for unexpected errors, not "git not found"
      console.warn(
        `[remark-modified-time] Failed for ${filepath}: ${e.message}`
      );
    }
    modTimeCache.set(filepath, null);
    return null;
  }
}

export function remarkModifiedTime() {
  return function (_tree, file) {
    const filepath = file.history[0];

    if (!filepath) return;

    const modDate = getGitModTime(filepath);

    if (modDate) {
      // ✅ Set as Date object, not string (matches Zod z.date())
      file.data.astro.frontmatter.modDatetime = modDate;
    }
    // If null, leave frontmatter.modDatetime as-is
    // (author may have set it manually in frontmatter)
  };
}
