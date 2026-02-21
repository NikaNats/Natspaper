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
 * Returns true when the character immediately following `<` indicates a real
 * HTML tag: a letter (start/void tag), `/` (closing tag), or `!` (comment /
 * doctype).  Any other character — such as a digit or space — means the `<`
 * is a literal operator (e.g. `x < 5`) and must NOT be stripped.
 */
function isHtmlTagOpener(c: string): boolean {
  const code = c.charCodeAt(0);
  return (
    c === "/" ||
    c === "!" ||
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  );
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

  // LAYER 1: Remove actual HTML tags while preserving bare `<` / `>` operators.
  //
  // The naive approach of treating every `<…>` span as a tag incorrectly
  // strips content like `x < 5 && y > 2` — classifying `5 && y` as a tag
  // body and discarding it (data-loss bug).
  //
  // Fix: only enter tag-skip mode when `<` is immediately followed by a
  // character that can legally open an HTML tag (letter, `/`, `!`).  Every
  // other `<` is a literal operator and is kept as-is so that the subsequent
  // escapeHtml pass converts it to `&lt;` for safe XML output.
  const chars = Array.from(description);
  const len = chars.length;
  let sanitized = "";
  let i = 0;

  while (i < len) {
    if (
      chars[i] === "<" &&
      i + 1 < len &&
      isHtmlTagOpener(chars[i + 1]!) // guarded by `i + 1 < len` above
    ) {
      // Skip the entire tag: advance past `<`, scan until matching `>`
      i++;
      while (i < len && chars[i] !== ">") {
        i++;
      }
      if (i < len) i++; // consume the closing `>`
    } else {
      sanitized += chars[i];
      i++;
    }
  }

  const result = sanitized;

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
  const codepoints = Array.from(noCode);
  const truncated = codepoints.slice(0, 500).join("");

  return truncated.trim();
}
