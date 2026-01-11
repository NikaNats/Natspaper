/**
 * Robust URL Sanitization Utility
 * Standardizes security checks across RSS feeds and post content.
 * 
 * DESIGN PATTERN: Allowlist vs Blocklist
 * Instead of checking for "bad" schemes like javascript:, we only permit
 * schemes that are explicitly known to be safe.
 */

/**
 * Allowed protocols for URLs
 */
const ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);

/**
 * Maximum safe length for input to prevent denial of service.
 * 4096 characters is sufficient for any reasonable RSS description/snippet.
 */
const MAX_INPUT_LENGTH = 4096;

/**
 * Test if a URL is safe
 */
export function isSafeUrl(url: string): boolean {
  // 1. Normalize the input: Handle decoding, trimming, and casing
  let sanitizedInput: string;
  try {
    sanitizedInput = decodeURI(url).trim().toLowerCase();
  } catch {
    // If decoding fails, the URI is malformed and unsafe
    return false;
  }

  // 2. Permit relative and fragment identifiers
  if (sanitizedInput.startsWith("/") || sanitizedInput.startsWith("#")) {
    return true;
  }

  // 3. Protocol Validation
  try {
    const urlObj = new URL(sanitizedInput, "https://natspaper.vercel.app");
    return ALLOWED_PROTOCOLS.has(urlObj.protocol);
  } catch {
    // Any parsing error results in a rejection
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
 * Try to parse a complete markdown link starting at position `i`
 * Returns the parsed link or null if not a valid link
 */
function tryParseLink(
  input: string,
  i: number
): { link: ParsedLink; nextIndex: number } | null {
  const linkStart = i;

  const textResult = parseBalancedBrackets(input, i);
  if (!textResult) return null;

  const { content: linkText, endIndex: textEndIndex } = textResult;

  if (textEndIndex >= input.length || input[textEndIndex] !== "(") {
    return null;
  }

  const urlResult = parseBalancedParens(input, textEndIndex);
  if (!urlResult) return null;

  const { content: url, endIndex: urlEndIndex } = urlResult;

  return {
    link: {
      fullMatch: input.slice(linkStart, urlEndIndex),
      text: linkText,
      url,
      startIndex: linkStart,
      endIndex: urlEndIndex,
    },
    nextIndex: urlEndIndex,
  };
}

/**
 * Check if character at position is an escaped character
 */
function isEscapedChar(input: string, i: number): boolean {
  return input[i] === "\\" && i + 1 < input.length;
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
    if (isEscapedChar(input, i)) {
      i += 2;
      continue;
    }

    if (input[i] === "[") {
      const result = tryParseLink(input, i);
      if (result) {
        links.push(result.link);
        i = result.nextIndex;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return links;
}

/**
 * Update depth counter for bracket nesting
 */
function updateBracketDepth(char: string | undefined, depth: number): number {
  if (char === "[") return depth + 1;
  if (char === "]") return depth - 1;
  return depth;
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

    if (isEscapedChar(input, i)) {
      i += 2;
      continue;
    }

    depth = updateBracketDepth(char, depth);
    if (depth > 0) {
      i++;
    }
  }

  if (depth !== 0) return null;

  return {
    content: input.slice(contentStart, i),
    endIndex: i + 1,
  };
}

/**
 * Update depth counter for parenthesis nesting
 */
function updateParenDepth(char: string | undefined, depth: number): number {
  if (char === "(") return depth + 1;
  if (char === ")") return depth - 1;
  return depth;
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

    if (isEscapedChar(input, i)) {
      i += 2;
      continue;
    }

    depth = updateParenDepth(char, depth);
    if (depth > 0) {
      i++;
    }
  }

  if (depth !== 0) return null;

  return {
    content: input.slice(contentStart, i),
    endIndex: i + 1,
  };
}

/**
 * Generate replacement for a link (safe or fallback)
 */
function getLinkReplacement(link: ParsedLink): string {
  const trimmedUrl = link.url.trim();
  if (isSafeUrl(trimmedUrl)) {
    return `[${link.text}](${trimmedUrl})`;
  }
  return `[${link.text}](about:blank)`;
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
  const safeInput =
    markdown.length > MAX_INPUT_LENGTH
      ? markdown.slice(0, MAX_INPUT_LENGTH)
      : markdown;

  const links = parseMarkdownLinks(safeInput);

  if (links.length === 0) {
    return safeInput;
  }

  // Replace links from end to start to preserve indices
  let result = safeInput;
  for (let i = links.length - 1; i >= 0; i--) {
    const link = links[i]!;
    const replacement = getLinkReplacement(link);
    result =
      result.slice(0, link.startIndex) +
      replacement +
      result.slice(link.endIndex);
  }

  return result;
}
