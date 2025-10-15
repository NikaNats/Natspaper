/**
 * Content Security Policy (CSP) & Security Headers Configuration
 * Configures security headers to protect against XSS, clickjacking, and other attacks
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  xXssProtection?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Default CSP policy
 * Balances security with functionality for a static blog
 */
const DEFAULT_CSP = [
  // Default source - allow same-origin only
  "default-src 'self'",

  // Scripts - only same-origin, inline scripts from Astro
  "script-src 'self' 'unsafe-inline'",

  // Styles - same-origin and unsafe-inline (necessary for embedded styles)
  "style-src 'self' 'unsafe-inline'",

  // Images - allow same-origin, data URIs, and https external images
  "img-src 'self' data: https:",

  // Fonts - same-origin and data URIs
  "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",

  // Forms - only submit to same-origin
  "form-action 'self'",

  // Frame ancestors - prevent clickjacking
  "frame-ancestors 'none'",

  // Base URI - restrict base tag
  "base-uri 'self'",

  // Connect - AJAX/WebSocket/etc
  "connect-src 'self'",

  // Media - audio/video
  "media-src 'self'",

  // Report URI (optional - set to your monitoring service)
  // "report-uri https://your-monitoring-service.com/csp-report",
].join("; ");

/**
 * Strict CSP for production (no unsafe-inline)
 * Requires all scripts and styles to be in separate files with hashes
 */
const STRICT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "connect-src 'self'",
  "media-src 'self'",
].join("; ");

/**
 * Get security headers configuration
 */
export function getSecurityHeaders(
  isProduction = false
): SecurityHeadersConfig {
  return {
    // Content Security Policy
    contentSecurityPolicy: isProduction ? STRICT_CSP : DEFAULT_CSP,

    // Prevent clickjacking attacks
    xFrameOptions: "DENY",

    // Prevent MIME type sniffing
    xContentTypeOptions: "nosniff",

    // Enable XSS protection in older browsers
    xXssProtection: "1; mode=block",

    // Referrer policy - balance privacy and functionality
    referrerPolicy: "strict-origin-when-cross-origin",

    // Permissions policy (formerly Feature-Policy)
    // Disable unnecessary browser features
    permissionsPolicy: [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  };
}

/**
 * Format security headers for Astro middleware
 */
export function formatSecurityHeaders(
  config: SecurityHeadersConfig
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.contentSecurityPolicy) {
    headers["Content-Security-Policy"] = config.contentSecurityPolicy;
  }
  if (config.xFrameOptions) {
    headers["X-Frame-Options"] = config.xFrameOptions;
  }
  if (config.xContentTypeOptions) {
    headers["X-Content-Type-Options"] = config.xContentTypeOptions;
  }
  if (config.xXssProtection) {
    headers["X-XSS-Protection"] = config.xXssProtection;
  }
  if (config.referrerPolicy) {
    headers["Referrer-Policy"] = config.referrerPolicy;
  }
  if (config.permissionsPolicy) {
    headers["Permissions-Policy"] = config.permissionsPolicy;
  }

  // Additional security headers
  headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

  return headers;
}

/**
 * Create middleware for applying security headers
 * Usage in astro.config.ts:
 *
 * export default defineConfig({
 *   middleware: async (request, { next }) => {
 *     const response = await next();
 *     const headers = getSecurityHeaders(import.meta.env.PROD);
 *     const formattedHeaders = formatSecurityHeaders(headers);
 *     Object.entries(formattedHeaders).forEach(([key, value]) => {
 *       response.headers.set(key, value);
 *     });
 *     return response;
 *   }
 * });
 */

/**
 * Get CSP nonce for inline scripts
 * This is used to allow specific inline scripts while maintaining CSP
 */
export function generateCspNonce(): string {
  // Generate a random nonce for this request
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let nonce = "";
  for (let i = 0; i < 16; i += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Build CSP with nonce for inline scripts
 */
export function buildCspWithNonce(basePolicy: string, nonce: string): string {
  return basePolicy.replaceAll(
    "script-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`
  );
}
