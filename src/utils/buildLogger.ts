/**
 * Centralized Error Logging & Handler System
 * Provides consistent error handling, logging, and reporting across the build process.
 * 
 * Features:
 * - Centralized error collection
 * - Build warnings and errors tracking
 * - Graceful error handling with fallbacks
 * - Error context preservation
 */

export type ErrorSeverity = "error" | "warning" | "info";

export interface BuildError {
  severity: ErrorSeverity;
  message: string;
  context?: {
    file?: string;
    line?: number;
    code?: string;
  };
  timestamp: number;
}

class BuildLogger {
  private errors: BuildError[] = [];
  private warnings: BuildError[] = [];
  private readonly isDev = import.meta.env.DEV;

  /**
   * Log an error or warning during the build
   */
  log(
    severity: ErrorSeverity,
    message: string,
    context?: BuildError["context"]
  ): void {
    const error: BuildError = {
      severity,
      message,
      context,
      timestamp: Date.now(),
    };

    if (severity === "error") {
      this.errors.push(error);
    } else if (severity === "warning") {
      this.warnings.push(error);
    }

    // Log to console based on severity and environment
    if (severity === "error") {
      // eslint-disable-next-line no-console
      console.error(`❌ [BUILD ERROR] ${message}`, context || "");
    } else if (severity === "warning" && this.isDev) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  [BUILD WARNING] ${message}`, context || "");
    } else if (severity === "info" && this.isDev) {
      // eslint-disable-next-line no-console
      console.info(`ℹ️  [BUILD INFO] ${message}`);
    }
  }

  /**
   * Log an error
   */
  error(message: string, context?: BuildError["context"]): void {
    this.log("error", message, context);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: BuildError["context"]): void {
    this.log("warning", message, context);
  }

  /**
   * Log info
   */
  info(message: string, context?: BuildError["context"]): void {
    this.log("info", message, context);
  }

  /**
   * Get all collected errors
   */
  getErrors(): BuildError[] {
    return [...this.errors];
  }

  /**
   * Get all collected warnings
   */
  getWarnings(): BuildError[] {
    return [...this.warnings];
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get summary of all issues
   */
  getSummary(): string {
    const errorCount = this.errors.length;
    const warningCount = this.warnings.length;

    if (errorCount === 0 && warningCount === 0) {
      return "✅ No build errors or warnings";
    }

    const parts = [];
    if (errorCount > 0) {
      const plural = errorCount === 1 ? "" : "s";
      parts.push(`❌ ${errorCount} error${plural}`);
    }
    if (warningCount > 0) {
      const plural = warningCount === 1 ? "" : "s";
      parts.push(`⚠️  ${warningCount} warning${plural}`);
    }

    return parts.join(", ");
  }

  /**
   * Print full error report
   */
  printReport(): void {
    if (this.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.error("\n📋 Build Errors:");
      for (const e of this.errors) {
        // eslint-disable-next-line no-console
        console.error(`  - ${e.message}`);
        if (e.context?.file) {
          // eslint-disable-next-line no-console
          console.error(`    File: ${e.context.file}`);
        }
      }
    }

    if (this.warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("\n📋 Build Warnings:");
      for (const w of this.warnings) {
        // eslint-disable-next-line no-console
        console.warn(`  - ${w.message}`);
        if (w.context?.file) {
          // eslint-disable-next-line no-console
          console.warn(`    File: ${w.context.file}`);
        }
      }
    }
  }

  /**
   * Clear all logged errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}

// Export singleton instance
export const buildLogger = new BuildLogger();

/**
 * Wrap async functions with error handling and logging
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  fallbackValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    buildLogger.error(
      `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`
    );
    return fallbackValue;
  }
}

/**
 * Wrap sync functions with error handling and logging
 */
export function withErrorHandlingSync<T>(
  fn: () => T,
  errorMessage: string,
  fallbackValue: T
): T {
  try {
    return fn();
  } catch (error) {
    buildLogger.error(
      `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`
    );
    return fallbackValue;
  }
}
