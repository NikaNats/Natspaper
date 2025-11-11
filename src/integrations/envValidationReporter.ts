// src/integrations/envValidationReporter.ts

// Define the shape of the data this reporter expects
interface ValidationIssue {
  variable: string;
  message: string;
}

// A DRY helper to format a single issue
function formatIssue(issue: ValidationIssue, symbol: string): string {
  return `${symbol} ${issue.variable}\n   ${issue.message}`;
}

// A DRY helper to create a formatted section (for errors or warnings)
function createSection(
  title: string,
  issues: ValidationIssue[],
  symbol: string,
  footer: string
): string {
  if (issues.length === 0) return "";

  const border = "=".repeat(70);
  const formattedIssues = issues.map(issue => formatIssue(issue, symbol)).join("\n\n");

  return [
    "", // Leading newline
    border,
    title,
    border,
    "", // Newline
    formattedIssues,
    "", // Newline
    border,
    footer,
    border,
    "", // Trailing newline
  ].join("\n");
}

/**
 * Takes arrays of errors and warnings and formats them into a single,
 * human-readable string for console output.
 * This is a pure function with no side effects.
 */
export function formatValidationResult(
  errors: ValidationIssue[],
  warnings: ValidationIssue[]
): string {
  const errorSection = createSection(
    "❌ ENVIRONMENT VALIDATION FAILED",
    errors,
    "❌",
    "⚠️  Build cannot proceed. Please fix the errors above."
  );

  const warningSection = createSection(
    "⚠️  ENVIRONMENT WARNINGS (Non-critical)",
    warnings,
    "⚠️",
    "ℹ️  These are optional. Your build will succeed, but some features may be limited."
  );

  return [errorSection, warningSection].filter(Boolean).join("\n");
}