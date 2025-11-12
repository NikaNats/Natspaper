/**
 * RSS utility functions for HTML escaping and description sanitization
 */

/**
 * Escape HTML special characters to prevent XSS attacks and XML parsing errors.
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replaceAll(/[&<>"']/g, char => htmlEscapeMap[char] || char);
}

/**
 * Sanitize description by removing HTML tags, escaping entities, and removing markdown.
 * Defense-in-depth approach to prevent XSS in RSS feeds.
 *
 * Uses simple, safe string operations instead of complex regex to avoid ReDoS:
 * - String methods like replace() with literal patterns
 * - Explicit loops for safe transformation
 * - No nested quantifiers or alternation patterns
 *
 * @param description - Raw description text
 * @returns Sanitized description safe for CDATA
 */
export function sanitizeDescription(description: string): string {
  if (!description) return "";

  // LAYER 1: Remove all HTML tags (most important - blocks <img>, <script>, etc.)
  // Simple approach: find all <...> patterns and remove them
  let result = description;

  // Remove HTML tags by finding < and >
  // This is safer than complex regex and handles nested/malformed tags
  let inTag = false;
  let sanitized = "";

  for (const char of result) {
    if (char === "<") {
      inTag = true;
    } else if (char === ">") {
      inTag = false;
    } else if (!inTag) {
      sanitized += char;
    }
  }

  result = sanitized;

  // LAYER 2: Escape HTML entities to prevent entity injection
  const escaped = escapeHtml(result);

  // LAYER 3: Remove markdown formatting using simple string replacement
  // Process links: [text](url) -> text
  let noLinks = escaped;
  let linkIndex = 0;
  while ((linkIndex = noLinks.indexOf("[", linkIndex)) !== -1) {
    const closeIndex = noLinks.indexOf("]", linkIndex);
    const parenIndex = noLinks.indexOf("(", closeIndex);
    const closeParenIndex = noLinks.indexOf(")", parenIndex);

    if (
      closeIndex !== -1 &&
      parenIndex === closeIndex + 1 &&
      closeParenIndex !== -1
    ) {
      const linkText = noLinks.substring(linkIndex + 1, closeIndex);
      noLinks =
        noLinks.substring(0, linkIndex) +
        linkText +
        noLinks.substring(closeParenIndex + 1);
      linkIndex += linkText.length;
    } else {
      linkIndex++;
    }
  }

  // Process bold/italic: **text**, *text*, __text__, _text_ -> text
  // Use simple replace for common patterns
  const noEmphasis = noLinks
    .replaceAll("**", "")
    .replaceAll("__", "")
    .replaceAll("*", "")
    .replaceAll("_", "");

  // Remove code blocks: `code` -> code
  let noCode = "";
  let inCode = false;
  for (const char of noEmphasis) {
    if (char === "`") {
      inCode = !inCode;
    } else if (!inCode) {
      noCode += char;
    }
  }

  // LAYER 4: Safe truncation: count characters, not bytes (handles UTF-8)
  const chars = Array.from(noCode);
  const truncated = chars.slice(0, 500).join("");

  return truncated.trim();
}
