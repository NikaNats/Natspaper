/**
 * Environment Variable Validators
 *
 * Reusable validation functions for environment variables.
 * Each validator is a pure function that returns an error message or null.
 */

// A generic validation function type
export type ValidatorFn = (
  value: string | undefined,
  variableName: string
) => string | null; // Returns error message or null

export const isRequired: ValidatorFn = (value, name) =>
  !value || value.trim() === ""
    ? `${name} is required and cannot be empty.`
    : null;

export const isEnum =
  (allowedValues: readonly string[]): ValidatorFn =>
  (value, name) =>
    value && !allowedValues.includes(value)
      ? `${name} has an invalid value "${value}". Must be one of: ${allowedValues.join(", ")}.`
      : null;

export const isSentryDsn: ValidatorFn = (value, name) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes("sentry.io")
      ? null
      : `${name} has an invalid Sentry DSN format.`;
  } catch {
    return `${name} has an invalid Sentry DSN format.`;
  }
};

export const isNumberInRange =
  (min: number, max: number): ValidatorFn =>
  (value, name) => {
    if (value === undefined) return null;
    const num = parseFloat(value);
    return isNaN(num) || num < min || num > max
      ? `${name} must be a number between ${min} and ${max}, but got "${value}".`
      : null;
  };
