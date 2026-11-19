import { getLastPathSegment, trimChar } from "@/utils/core/slugify";

const FNV_PRIME_32 = 16777619;
const FNV_OFFSET_BASIS_32 = 2166136261;

function hashToBase36(value: string): string {
  let hash = FNV_OFFSET_BASIS_32;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.codePointAt(index) ?? 0;
    hash = Math.imul(hash, FNV_PRIME_32);
  }

  return (hash >>> 0).toString(36);
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

function sanitizeTransitionToken(value: string): string {
  const collapsed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-");
  return trimChar(collapsed, "-");
}

export function getPostTitleTransitionName(postSlug: string): string {
  const normalizedPath = trimTrailingSlashes(postSlug);
  const slugSegment = getLastPathSegment(normalizedPath);

  if (!slugSegment) {
    return "post-title-post";
  }

  const sanitizedSlug = sanitizeTransitionToken(slugSegment);
  if (sanitizedSlug) {
    return `post-title-${sanitizedSlug}`;
  }

  return `post-title-h${hashToBase36(slugSegment)}`;
}
