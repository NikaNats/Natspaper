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
  const code = c.codePointAt(0) ?? 0;
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
 * Strip real HTML tags while keeping bare `<` / `>` operators.
 *
 * The naive approach of treating every `<…>` span as a tag incorrectly strips
 * content like `x < 5 && y > 2` (data-loss bug). Only enter tag-skip mode when
 * `<` is immediately followed by a character that can legally open an HTML tag
 * (letter, `/`, `!`).
 */
function stripHtmlTags(description: string): string {
  const chars = Array.from(description);
  const len = chars.length;
  let out = "";
  let i = 0;

  while (i < len) {
    const next = chars[i + 1];
    if (chars[i] === "<" && next !== undefined && isHtmlTagOpener(next)) {
      i++;
      while (i < len && chars[i] !== ">") i++;
      if (i < len) i++; // consume the closing `>`
    } else {
      out += chars[i];
      i++;
    }
  }
  return out;
}

/**
 * Markdown links `[text](url)` -> `text`. The URL is dropped entirely, so no
 * unsafe scheme can survive into a feed.
 */
function stripMarkdownLinks(text: string): string {
  let result = text;
  let linkIndex = 0;
  while ((linkIndex = result.indexOf("[", linkIndex)) !== -1) {
    const closeIndex = result.indexOf("]", linkIndex);
    const parenIndex = closeIndex + 1;
    const closeParenIndex =
      closeIndex !== -1 && result[parenIndex] === "("
        ? findClosingParen(result, parenIndex)
        : -1;

    if (closeParenIndex === -1) {
      linkIndex++;
      continue;
    }
    const linkText = result.substring(linkIndex + 1, closeIndex);
    result =
      result.substring(0, linkIndex) +
      linkText +
      result.substring(closeParenIndex + 1);
    linkIndex += linkText.length;
  }
  return result;
}

/** Remove code spans: `code` -> (dropped). */
function stripCodeSpans(text: string): string {
  let out = "";
  let inCode = false;
  for (const char of text) {
    if (char === "`") inCode = !inCode;
    else if (!inCode) out += char;
  }
  return out;
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

  const noLinks = stripMarkdownLinks(stripHtmlTags(description));

  // Bold/italic: **text**, *text*, __text__, _text_ -> text
  const noEmphasis = noLinks
    .replaceAll("**", "")
    .replaceAll("__", "")
    .replaceAll("*", "")
    .replaceAll("_", "");

  // Safe truncation: count code points, not UTF-16 units or bytes
  return Array.from(stripCodeSpans(noEmphasis)).slice(0, 500).join("").trim();
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
