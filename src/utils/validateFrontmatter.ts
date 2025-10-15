/**
 * Frontmatter Validation Utility
 * Validates blog post frontmatter with strict schema enforcement
 */

export interface ValidatedFrontmatter {
  title: string;
  author: string;
  pubDatetime: Date;
  modDatetime?: Date;
  description: string;
  tags?: string[];
  draft?: boolean;
  featured?: boolean;
  [key: string]: unknown;
}

interface ValidationResult {
  isValid: boolean;
  data?: ValidatedFrontmatter;
  errors: string[];
}

const CONSTRAINTS = {
  title: { min: 1, max: 200 },
  author: { min: 1, max: 100 },
  description: { min: 10, max: 500 },
  tags: { minLength: 0, maxLength: 10, tagMax: 50 },
};

/**
 * Validate ISO date string
 */
function isValidDate(dateString: unknown): dateString is string {
  if (typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
  const sanitized = str.replaceAll(/[<>"]/g, char => {
    const escapeMap: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return escapeMap[char] || char;
  });
  return sanitized.trim();
}

/**
 * Validate title field
 */
function validateTitleField(
  title: unknown,
  errors: string[]
): string | undefined {
  if (!title || typeof title !== "string") {
    errors.push("Title is required and must be a string");
    return undefined;
  }
  if (title.length < CONSTRAINTS.title.min) {
    errors.push(`Title must be at least ${CONSTRAINTS.title.min} character`);
    return undefined;
  }
  if (title.length > CONSTRAINTS.title.max) {
    errors.push(
      `Title must not exceed ${CONSTRAINTS.title.max} characters (current: ${title.length})`
    );
    return undefined;
  }
  return sanitizeString(title);
}

/**
 * Validate author field
 */
function validateAuthorField(
  author: unknown,
  errors: string[]
): string | undefined {
  if (!author || typeof author !== "string") {
    errors.push("Author is required and must be a string");
    return undefined;
  }
  if (author.length > CONSTRAINTS.author.max) {
    errors.push(
      `Author must not exceed ${CONSTRAINTS.author.max} characters (current: ${author.length})`
    );
    return undefined;
  }
  return sanitizeString(author);
}

/**
 * Validate date field
 */
function validateDateField(
  date: unknown,
  fieldName: string,
  errors: string[],
  required = true
): Date | undefined {
  if (!date && required) {
    errors.push(`${fieldName} is required`);
    return undefined;
  }
  if (date === undefined) return undefined;
  if (isValidDate(date)) {
    return new Date(date);
  }
  errors.push(`${fieldName} must be a valid ISO date string`);
  return undefined;
}

/**
 * Validate description field
 */
function validateDescriptionField(
  description: unknown,
  errors: string[]
): string | undefined {
  if (!description || typeof description !== "string") {
    errors.push("Description is required and must be a string");
    return undefined;
  }
  if (description.length < CONSTRAINTS.description.min) {
    errors.push(
      `Description must be at least ${CONSTRAINTS.description.min} characters (current: ${description.length})`
    );
    return undefined;
  }
  if (description.length > CONSTRAINTS.description.max) {
    errors.push(
      `Description must not exceed ${CONSTRAINTS.description.max} characters (current: ${description.length})`
    );
    return undefined;
  }
  return sanitizeString(description);
}

/**
 * Validate tags field
 */
function validateTagsField(
  tags: unknown,
  errors: string[]
): string[] | undefined {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) {
    errors.push("Tags must be an array if provided");
    return undefined;
  }
  if (tags.length > CONSTRAINTS.tags.maxLength) {
    errors.push(
      `Tags array must not exceed ${CONSTRAINTS.tags.maxLength} tags (current: ${tags.length})`
    );
    return undefined;
  }
  const validTags: string[] = [];
  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i];
    if (typeof tag !== "string") {
      errors.push(`Tag at index ${i} must be a string`);
    } else if (tag.length > CONSTRAINTS.tags.tagMax) {
      errors.push(
        `Tag at index ${i} exceeds max length of ${CONSTRAINTS.tags.tagMax} characters`
      );
    } else {
      validTags.push(sanitizeString(tag));
    }
  }
  return validTags.length > 0 ? validTags : undefined;
}

/**
 * Validate boolean optional field
 */
function validateBooleanField(
  value: unknown,
  fieldName: string,
  errors: string[]
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    errors.push(`${fieldName} must be a boolean if provided`);
    return undefined;
  }
  return value;
}

/**
 * Validate frontmatter object
 */
export function validateFrontmatter(
  frontmatter: Record<string, unknown>,
  filePath: string
): ValidationResult {
  const errors: string[] = [];
  const validatedData: Partial<ValidatedFrontmatter> = {};

  const title = validateTitleField(frontmatter.title, errors);
  if (title) validatedData.title = title;

  const author = validateAuthorField(frontmatter.author, errors);
  if (author) validatedData.author = author;

  const pubDatetime = validateDateField(
    frontmatter.pubDatetime,
    "Publication date (pubDatetime)",
    errors,
    true
  );
  if (pubDatetime) validatedData.pubDatetime = pubDatetime;

  const modDatetime = validateDateField(
    frontmatter.modDatetime,
    "Modification date (modDatetime)",
    errors,
    false
  );
  if (modDatetime) validatedData.modDatetime = modDatetime;

  const description = validateDescriptionField(frontmatter.description, errors);
  if (description) validatedData.description = description;

  const tags = validateTagsField(frontmatter.tags, errors);
  if (tags) validatedData.tags = tags;

  const draft = validateBooleanField(frontmatter.draft, "Draft", errors);
  if (draft) validatedData.draft = draft;

  const featured = validateBooleanField(
    frontmatter.featured,
    "Featured",
    errors
  );
  if (featured) validatedData.featured = featured;

  if (pubDatetime && pubDatetime > new Date()) {
    // eslint-disable-next-line no-console
    console.warn(
      `⚠️  [FRONTMATTER WARNING] Post has future publication date in ${filePath}`
    );
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `⚠️  [FRONTMATTER WARNING] Invalid frontmatter in ${filePath}:`
    );
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.warn(`  - ${error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    data:
      errors.length === 0 ? (validatedData as ValidatedFrontmatter) : undefined,
    errors,
  };
}

/**
 * Batch validate multiple frontmatter objects
 */
export function validateMultipleFrontmatter(
  items: Array<{ frontmatter: Record<string, unknown>; filePath: string }>
): {
  valid: ValidatedFrontmatter[];
  invalid: Array<{ filePath: string; errors: string[] }>;
} {
  const valid: ValidatedFrontmatter[] = [];
  const invalid: Array<{ filePath: string; errors: string[] }> = [];

  for (const { frontmatter, filePath } of items) {
    const result = validateFrontmatter(frontmatter, filePath);
    if (result.isValid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ filePath, errors: result.errors });
    }
  }

  return { valid, invalid };
}
