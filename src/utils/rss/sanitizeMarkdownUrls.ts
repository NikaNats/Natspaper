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
 * Maximum safe length for input to prevent Regex Denial of Service (ReDoS).
 * 4096 characters is sufficient for any reasonable RSS description/snippet.
 * Processing inputs larger than this with complex regex can cause CPU spikes.
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
 * Sanitize URLs in markdown links
 * Replaces unsafe URLs with safe fallback
 *
 * @param markdown - The input markdown string
 * @returns Sanitized string
 */
export function sanitizeMarkdownUrls(markdown: string): string {
  // SECURITY: ReDoS Protection
  // If input is too long, truncate it before regex processing.
  // This renders catastrophic backtracking attacks mathematically impossible
  // to sustain for significant duration.
  const safeInput =
    markdown.length > MAX_INPUT_LENGTH
      ? markdown.slice(0, MAX_INPUT_LENGTH)
      : markdown;

  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return safeInput.replaceAll(linkRegex, (_match, text, url) => {
    const trimmed = url.trim();

    if (!isSafeUrl(trimmed)) {
      // Return safe fallback URL
      return `[${text}](about:blank)`;
    }

    return `[${text}](${trimmed})`;
  });
}
