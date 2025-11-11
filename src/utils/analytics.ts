/**
 * Analytics Configuration and Helpers
 * Supports language-aware tracking for multilingual sites
 *
 * This file provides backward compatibility.
 * The new implementation uses a Facade Pattern with AnalyticsService.
 */

// Re-export everything from the new modular implementation
export * from "./analytics/index";
