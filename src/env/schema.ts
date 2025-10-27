/**
 * Unified Environment Variable Schema
 *
 * Single source of truth for all environment variables.
 * Defines types, requirements, descriptions, and defaults.
 */

export interface EnvSchema {
  // ===== REQUIRED: Build/Server Variables =====
  SITE_WEBSITE: string;

  // ===== OPTIONAL: Environment Control =====
  NODE_ENV?: "development" | "production" | "staging";
  BUILD_TIMESTAMP?: string;
  BUILD_VERSION?: string;

  // ===== OPTIONAL: Sentry Server-Side (Private) =====
  SENTRY_AUTH_TOKEN?: string;
  SENTRY_DSN?: string;
  SENTRY_TRACE_SAMPLE_RATE?: string;

  // ===== OPTIONAL: Sentry Client-Side (Public) =====
  PUBLIC_SENTRY_DSN?: string;
  PUBLIC_SENTRY_ENVIRONMENT?: string;
  PUBLIC_SENTRY_TRACES_SAMPLE_RATE?: string;
  PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE?: string;
  PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE?: string;

  // ===== OPTIONAL: Analytics & SEO =====
  PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}

/**
 * Detailed metadata about each environment variable
 * Used by validation, documentation generation, etc.
 */
export const ENV_DEFINITIONS = {
  // ================================================
  // REQUIRED VARIABLES
  // ================================================

  SITE_WEBSITE: {
    type: "string" as const,
    required: true,
    access: "secret" as const,
    context: "server" as const,
    description:
      "Production domain URL used for sitemaps and canonical URLs",
    example: "https://natspaper.vercel.app",
    docs: "Must be a valid URL including protocol (https://)",
  },

  // ================================================
  // OPTIONAL: ENVIRONMENT CONTROL
  // ================================================

  NODE_ENV: {
    type: "enum" as const,
    values: ["development", "production", "staging"],
    required: false,
    access: "secret" as const,
    context: "server" as const,
    default: "production",
    description: "Node.js runtime environment",
    docs: "Auto-detected by Astro, override only if needed",
  },

  BUILD_TIMESTAMP: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    description: "Build timestamp for deployment tracking",
    example: "2024-10-27T10:30:00Z",
    docs: "Optional: Set automatically in CI/CD pipelines",
  },

  BUILD_VERSION: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    description: "Build version for deployment tracking",
    example: "5.5.0",
    docs: "Optional: Set automatically in CI/CD pipelines",
  },

  // ================================================
  // OPTIONAL: SENTRY SERVER-SIDE (PRIVATE)
  // ================================================

  SENTRY_AUTH_TOKEN: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    sensitive: true,
    description: "Authentication token for Sentry API",
    docs: "Only needed if uploading source maps. Get from https://sentry.io/settings/account/api/auth-tokens/",
  },

  SENTRY_DSN: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    sensitive: true,
    description: "Server-side Sentry DSN (keep private)",
    docs: "Different from PUBLIC_SENTRY_DSN. Captures server-only errors.",
  },

  SENTRY_TRACE_SAMPLE_RATE: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    default: "0.1",
    description: "Sentry server traces sampling rate (0.0 to 1.0)",
    example: "0.1",
    docs: "Set to 0.1 for 10% in production, 1.0 for 100% in development",
  },

  // ================================================
  // OPTIONAL: SENTRY CLIENT-SIDE (PUBLIC - SAFE)
  // ================================================

  PUBLIC_SENTRY_DSN: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    description: "Client-side Sentry DSN (safe to expose)",
    docs: "DSN contains no secrets. Enables error tracking in browser.",
  },

  PUBLIC_SENTRY_ENVIRONMENT: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    default: "production",
    description: "Environment label for Sentry reporting",
    example: "production",
    docs: "Helps organize errors by environment in Sentry dashboard",
  },

  PUBLIC_SENTRY_TRACES_SAMPLE_RATE: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    default: "0.1",
    description: "Client traces sampling rate (0.0 to 1.0)",
    example: "0.1",
    docs: "Lower values = less data, lower cost. Set to 0 to disable.",
  },

  PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    default: "0.1",
    description: "Session replay sampling (0.0 to 1.0)",
    example: "0.1",
    docs: "Records 10% of all sessions. Increases quota usage.",
  },

  PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    default: "1",
    description: "Capture replays for 100% of errors",
    example: "1",
    docs: "Always record replays when errors occur",
  },

  // ================================================
  // OPTIONAL: ANALYTICS & SEO
  // ================================================

  PUBLIC_GOOGLE_SITE_VERIFICATION: {
    type: "string" as const,
    required: false,
    access: "public" as const,
    context: "client" as const,
    description: "Google Search Console verification token",
    docs: "From: https://search.google.com/search-console",
  },
} as const;

/**
 * Helper: Get all required variables
 */
export function getRequiredVars(): string[] {
  return Object.entries(ENV_DEFINITIONS)
    .filter(([, def]) => def.required)
    .map(([name]) => name);
}

/**
 * Helper: Get all public variables
 */
export function getPublicVars(): string[] {
  return Object.entries(ENV_DEFINITIONS)
    .filter(([, def]) => def.access === "public")
    .map(([name]) => name);
}

/**
 * Helper: Get all sensitive/secret variables
 */
export function getSensitiveVars(): string[] {
  return Object.entries(ENV_DEFINITIONS)
    .filter(([, def]) => "sensitive" in def && def.sensitive === true)
    .map(([name]) => name);
}
