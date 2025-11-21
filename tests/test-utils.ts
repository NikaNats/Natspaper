/**
 * Test Utilities
 * Provides helpers for type-safe assertions in tests with strict TypeScript mode.
 */

/**
 * Asserts that a value is defined and not null.
 * Narrows the type from T | undefined | null to T.
 * Throws a test failure if the value is undefined or null.
 *
 * @param value - The value to assert as defined
 * @param message - Optional error message for clarity
 * @returns The value, now typed as T (non-null)
 * @throws Error if value is undefined or null
 *
 * @example
 * ```ts
 * const result = getTags();
 * const firstTag = assertDefined(result[0], "First tag should exist");
 * expect(firstTag.name).toBe("docs");
 * ```
 */
export function assertDefined<T>(
	value: T | undefined | null,
	message = "Value should be defined"
): T {
	if (value === undefined || value === null) {
		throw new Error(`Test Assertion Failed: ${message}`);
	}
	return value;
}
