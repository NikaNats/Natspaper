/**
 * Unified Environment Variable Schema
 *
 * Single source of truth for all environment variables.
 * Defines types, requirements, descriptions, and defaults.
 */

import { isEnum } from "./validators";

export interface EnvSchema {
  // ===== OPTIONAL: Build/Server Variables =====
  SITE_WEBSITE?: string;

  // ===== OPTIONAL: Environment Control =====
  NODE_ENV?: "development" | "production" | "staging";
  BUILD_TIMESTAMP?: string;
  BUILD_VERSION?: string;

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
    required: false,
    access: "secret" as const,
    context: "server" as const,
    default: "https://natspaper.vercel.app",
    description: "Production domain URL used for sitemaps and canonical URLs",
    example: "https://natspaper.vercel.app",
    docs: "Falls back to SITE.website from config.ts if not provided",
    validators: [], // No validation needed for optional string
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
    validators: [isEnum(["development", "production", "staging"])],
  },

  BUILD_TIMESTAMP: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    description: "Build timestamp for deployment tracking",
    example: "2024-10-27T10:30:00Z",
    docs: "Optional: Set automatically in CI/CD pipelines",
    validators: [],
  },

  BUILD_VERSION: {
    type: "string" as const,
    required: false,
    access: "secret" as const,
    context: "server" as const,
    description: "Build version for deployment tracking",
    example: "5.5.0",
    docs: "Optional: Set automatically in CI/CD pipelines",
    validators: [],
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
    validators: [],
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
