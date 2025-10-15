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
 * Sanitize a URL for use in href attributes
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  if (!isSafeUrl(trimmed)) {
    // Return safe fallback URL
    return "about:blank";
  }

  return trimmed;
}

/**
 * Sanitize URLs in markdown links
 * Replaces unsafe URLs with safe fallback
 */
export function sanitizeMarkdownUrls(markdown: string): string {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return markdown.replaceAll(linkRegex, (_match, text, url) => {
    const safeUrl = sanitizeUrl(url);
    return `[${text}](${safeUrl})`;
  });
}

/**
 * Sanitize URLs in HTML attributes
 * Handles href, src, and other URL attributes
 */
export function sanitizeHtmlAttributeUrls(html: string): string {
  // Match various URL attributes: href="...", src="...", etc.
  const attributeRegex =
    /(href|src|srcset|data|action|poster)=["']([^"']+)["']/g;

  return html.replaceAll(attributeRegex, (_match, attr, url) => {
    const safeUrl = sanitizeUrl(url);
    return `${attr}="${safeUrl}"`;
  });
}

/**
 * Validate and normalize a URL for safe display
 */
export function validateDisplayUrl(url: string): string | null {
  try {
    if (!isSafeUrl(url)) {
      return null;
    }

    const trimmed = url.trim();

    // For display purposes, don't show mailto: or tel: protocols
    if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
      return trimmed;
    }

    // Normalize HTTP/HTTPS URLs
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const urlObj = new URL(trimmed);
      return urlObj.toString();
    }

    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Extract domain from URL for link preview
 */
export function extractDomain(url: string): string {
  try {
    if (!isSafeUrl(url)) {
      return "invalid";
    }

    if (url.startsWith("/")) return "same-origin";
    if (url.startsWith("mailto:")) return "mailto";
    if (url.startsWith("tel:")) return "tel";

    const urlObj = new URL(url, "https://example.com");
    return urlObj.hostname;
  } catch {
    return "invalid";
  }
}
