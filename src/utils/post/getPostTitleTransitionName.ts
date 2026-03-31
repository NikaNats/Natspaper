import { getLastPathSegment } from "@/utils/core/slugify";

const FNV_PRIME_32 = 16777619;
const FNV_OFFSET_BASIS_32 = 2166136261;

function hashToBase36(value: string): string {
  let hash = FNV_OFFSET_BASIS_32;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME_32);
  }

  return (hash >>> 0).toString(36);
}

function sanitizeTransitionToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getPostTitleTransitionName(postSlug: string): string {
  const normalizedPath = postSlug.replace(/\/+$/, "");
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
