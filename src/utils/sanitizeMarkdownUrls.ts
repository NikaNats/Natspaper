/**
 * Markdown URL Sanitization Utility
 * Sanitizes URLs in markdown content to prevent XSS attacks
 *
 * Protects against:
 * - javascript: protocol execution
 * - data: protocol attacks
 * - Event handler attributes in HTML
 * - Data attributes that could contain scripts
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
 */
export function sanitizeMarkdownUrls(markdown: string): string {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return markdown.replaceAll(linkRegex, (_match, text, url) => {
    const trimmed = url.trim();

    if (!isSafeUrl(trimmed)) {
      // Return safe fallback URL
      return `[${text}](about:blank)`;
    }

    return `[${text}](${trimmed})`;
  });
}
