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
 * Index of the `)` matching the `(` at `openIndex`, honoring nesting so URLs
 * like `https://en.wikipedia.org/wiki/Equation_(mathematics)` are consumed
 * whole. Linear scan, no regex (ReDoS-safe). Returns -1 when unbalanced.
 */
function findClosingParen(text: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

/**
 * Convert a frontmatter description to plain text: HTML tags and markdown
 * syntax are removed, literal `<`/`>`/`&` are KEPT, and nothing is escaped.
 *
 * Escaping is deliberately left to the serializer, because each output format
 * escapes differently and exactly once:
 *   - `@astrojs/rss` (fast-xml-parser) entity-encodes every text value itself;
 *     pre-escaped input there is double-escaped (`&amp;amp;`).
 *   - Hand-built XML (the Atom feed) wraps this with {@link escapeHtml}.
 *
 * Uses simple, safe string operations instead of complex regex to avoid ReDoS:
 * explicit loops, literal replacements, no nested quantifiers.
 *
 * @param description - Raw description text (may contain markdown/HTML)
 * @returns Plain text, at most 500 code points
 */
export function toPlainText(description: string): string {
  if (!description) return "";

  // LAYER 1: Remove actual HTML tags while preserving bare `<` / `>` operators.
  //
  // The naive approach of treating every `<…>` span as a tag incorrectly
  // strips content like `x < 5 && y > 2` — classifying `5 && y` as a tag
  // body and discarding it (data-loss bug).
  //
  // Fix: only enter tag-skip mode when `<` is immediately followed by a
  // character that can legally open an HTML tag (letter, `/`, `!`).  Every
  // other `<` is a literal operator and is kept as-is.
  const chars = Array.from(description);
  const len = chars.length;
  let noTags = "";
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
      noTags += chars[i];
      i++;
    }
  }

  // LAYER 2: Remove markdown formatting using simple string replacement
  // Process links: [text](url) -> text (the URL is dropped entirely, so no
  // unsafe scheme can survive into a feed)
  let noLinks = noTags;
  let linkIndex = 0;
  while ((linkIndex = noLinks.indexOf("[", linkIndex)) !== -1) {
    const closeIndex = noLinks.indexOf("]", linkIndex);
    const parenIndex = closeIndex === -1 ? -1 : closeIndex + 1;
    const closeParenIndex =
      noLinks[parenIndex] === "(" ? findClosingParen(noLinks, parenIndex) : -1;

    if (closeIndex !== -1 && closeParenIndex !== -1) {
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
  const noEmphasis = noLinks
    .replaceAll("**", "")
    .replaceAll("__", "")
    .replaceAll("*", "")
    .replaceAll("_", "");

  // Remove code spans: `code` -> (dropped)
  let noCode = "";
  let inCode = false;
  for (const char of noEmphasis) {
    if (char === "`") {
      inCode = !inCode;
    } else if (!inCode) {
      noCode += char;
    }
  }

  // LAYER 3: Safe truncation: count code points, not UTF-16 units or bytes
  return Array.from(noCode).slice(0, 500).join("").trim();
}

/**
 * Plain-text description escaped for direct interpolation into HTML/XML.
 * Equivalent to `escapeHtml(toPlainText(description))`.
 *
 * Never pass this to a serializer that escapes on its own (e.g.
 * `@astrojs/rss`) — use {@link toPlainText} there.
 */
export function sanitizeDescription(description: string): string {
  return escapeHtml(toPlainText(description));
}
