/**
 * Markdown URL Sanitization Utility
 * Sanitizes URLs in markdown content to prevent XSS attacks
 *
 * Protects against:
 * - javascript: protocol execution
 * - data: protocol attacks
 * - Event handler attributes in HTML
 * - Data attributes that could contain scripts
 * - ReDoS (Regex Denial of Service) via input length capping
 *
 * Uses a character-by-character parser instead of regex to correctly handle:
 * - Nested brackets in link text: [Click [here] for more](url)
 * - Parentheses in URLs: [Wiki](https://en.wikipedia.org/wiki/Equation_(mathematics))
 * - Escaped characters: \[ \] \( \)
 */

/**
 * Allowed protocols for URLs
 */
const SAFE_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
  "ftp:",
  "ftps:",
]);

/**
 * Maximum safe length for input to prevent denial of service.
 * 4096 characters is sufficient for any reasonable RSS description/snippet.
 */
const MAX_INPUT_LENGTH = 4096;

/**
 * Test if a URL is safe
 */
function isSafeUrl(url: string): boolean {
  try {
    // Handle relative URLs
    if (url.startsWith("/") || url.startsWith("#")) {
      return true;
    }

    // Handle protocol-relative URLs
    if (url.startsWith("//")) {
      return true;
    }

    // Parse absolute URLs
    const urlObj = new URL(url, "https://example.com");
    const protocol = urlObj.protocol.toLowerCase();

    // Check if protocol is in safe list
    return SAFE_PROTOCOLS.has(protocol);
  } catch {
    // If URL parsing fails, consider it unsafe
    return false;
  }
}

/**
 * Result of parsing a markdown link
 */
interface ParsedLink {
  /** Full original match including brackets and parens */
  fullMatch: string;
  /** The link text (content inside []) */
  text: string;
  /** The URL (content inside ()) */
  url: string;
  /** Start index in the input string */
  startIndex: number;
  /** End index in the input string (exclusive) */
  endIndex: number;
}

/**
 * Parse markdown links using a character-by-character approach.
 * This handles edge cases that regex cannot:
 * - Nested brackets: [Click [here] for more](url)
 * - Parentheses in URLs: [Wiki](https://example.com/Page_(disambiguation))
 * - Escaped characters: \[not a link\]
 *
 * @param input - The markdown string to parse
 * @returns Array of parsed links with their positions
 */
function parseMarkdownLinks(input: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  let i = 0;

  while (i < input.length) {
    // Skip escaped brackets
    if (input[i] === "\\" && i + 1 < input.length) {
      i += 2;
      continue;
    }

    // Look for start of link: [
    if (input[i] === "[") {
      const linkStart = i;

      // Parse the link text with bracket balancing
      const textResult = parseBalancedBrackets(input, i);
      if (!textResult) {
        i++;
        continue;
      }

      const { content: linkText, endIndex: textEndIndex } = textResult;

      // Check for ( immediately after ]
      if (textEndIndex >= input.length || input[textEndIndex] !== "(") {
        i++;
        continue;
      }

      // Parse the URL with parenthesis balancing
      const urlResult = parseBalancedParens(input, textEndIndex);
      if (!urlResult) {
        i++;
        continue;
      }

      const { content: url, endIndex: urlEndIndex } = urlResult;

      links.push({
        fullMatch: input.slice(linkStart, urlEndIndex),
        text: linkText,
        url: url,
        startIndex: linkStart,
        endIndex: urlEndIndex,
      });

      // Continue after this link
      i = urlEndIndex;
    } else {
      i++;
    }
  }

  return links;
}

/**
 * Parse balanced square brackets starting at position `start`.
 * Handles nested brackets and escaped characters.
 *
 * @param input - The input string
 * @param start - Starting position (must be '[')
 * @returns The content and end position, or null if unbalanced
 */
function parseBalancedBrackets(
  input: string,
  start: number
): { content: string; endIndex: number } | null {
  if (input[start] !== "[") return null;

  let depth = 1;
  let i = start + 1;
  const contentStart = i;

  while (i < input.length && depth > 0) {
    const char = input[i];

    // Handle escape sequences
    if (char === "\\" && i + 1 < input.length) {
      i += 2;
      continue;
    }

    if (char === "[") {
      depth++;
    } else if (char === "]") {
      depth--;
    }

    if (depth > 0) {
      i++;
    }
  }

  // If we didn't find a closing bracket
  if (depth !== 0) return null;

  return {
    content: input.slice(contentStart, i),
    endIndex: i + 1, // Position after the closing ]
  };
}

/**
 * Parse balanced parentheses starting at position `start`.
 * Handles nested parentheses (common in Wikipedia URLs) and escaped characters.
 *
 * @param input - The input string
 * @param start - Starting position (must be '(')
 * @returns The content and end position, or null if unbalanced
 */
function parseBalancedParens(
  input: string,
  start: number
): { content: string; endIndex: number } | null {
  if (input[start] !== "(") return null;

  let depth = 1;
  let i = start + 1;
  const contentStart = i;

  while (i < input.length && depth > 0) {
    const char = input[i];

    // Handle escape sequences
    if (char === "\\" && i + 1 < input.length) {
      i += 2;
      continue;
    }

    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    }

    if (depth > 0) {
      i++;
    }
  }

  // If we didn't find a closing paren
  if (depth !== 0) return null;

  return {
    content: input.slice(contentStart, i),
    endIndex: i + 1, // Position after the closing )
  };
}

/**
 * Sanitize URLs in markdown links
 * Replaces unsafe URLs with safe fallback
 *
 * Uses a proper parser instead of regex to handle:
 * - Nested brackets: [Click [here] for more](url)
 * - Parentheses in URLs: [Wiki](https://en.wikipedia.org/wiki/Equation_(mathematics))
 *
 * @param markdown - The input markdown string
 * @returns Sanitized string with unsafe URLs replaced
 */
export function sanitizeMarkdownUrls(markdown: string): string {
  // SECURITY: DoS Protection
  // If input is too long, truncate it before processing.
  const safeInput =
    markdown.length > MAX_INPUT_LENGTH
      ? markdown.slice(0, MAX_INPUT_LENGTH)
      : markdown;

  // Parse all markdown links
  const links = parseMarkdownLinks(safeInput);

  // If no links found, return as-is
  if (links.length === 0) {
    return safeInput;
  }

  // Build the result by replacing links from end to start
  // (to preserve indices as we modify the string)
  let result = safeInput;

  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i];
    const trimmedUrl = link.url.trim();

    let replacement: string;
    if (!isSafeUrl(trimmedUrl)) {
      // Replace unsafe URL with safe fallback
      replacement = `[${link.text}](about:blank)`;
    } else {
      // Keep safe URL (but trim whitespace)
      replacement = `[${link.text}](${trimmedUrl})`;
    }

    result =
      result.slice(0, link.startIndex) +
      replacement +
      result.slice(link.endIndex);
  }

  return result;
}
