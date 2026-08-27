// src/utils/core/webLinking.ts

/**
 * IETF RFC 8288 Web Linking Serializer & Parser
 * =============================================
 * Implements formal link serialization for HTTP headers
 * and HTML head elements according to RFC 8288.
 */

export interface WebLink {
  target: string;
  rel: string;
  hreflang?: string;
  type?: string;
  as?: string;
  crossorigin?: boolean | string;
  title?: string;
}

/**
 * Serializes an array of WebLink objects into a valid RFC 8288 Link header string.
 * Format: <uri>; rel="relation"; attr="value", <uri2>; rel="relation2"
 */
export function serializeLinkHeader(links: WebLink[]): string {
  if (!links || links.length === 0) return "";

  return links
    .map(link => {
      const parts: string[] = [
        `<${link.target}>`,
        `rel="${link.rel.toLowerCase()}"`,
      ];

      if (link.hreflang) {
        parts.push(`hreflang="${link.hreflang}"`);
      }
      if (link.type) {
        parts.push(`type="${link.type}"`);
      }
      if (link.as) {
        parts.push(`as="${link.as}"`);
      }
      if (link.crossorigin) {
        parts.push(
          typeof link.crossorigin === "string"
            ? `crossorigin="${link.crossorigin}"`
            : "crossorigin"
        );
      }
      if (link.title) {
        parts.push(`title="${link.title.replace(/"/g, '\\"')}"`);
      }

      return parts.join("; ");
    })
    .join(", ");
}

/**
 * Parses an RFC 8288 Link header value into structured WebLink objects.
 */
export function parseLinkHeader(headerValue: string): WebLink[] {
  if (!headerValue || typeof headerValue !== "string") return [];

  const results: WebLink[] = [];
  // Split on commas that are not inside quotes
  const rawLinks = headerValue.split(/,\s*(?=<)/);

  for (const rawLink of rawLinks) {
    const match = rawLink.match(/^<([^>]+)>(.*)$/);
    if (!match || !match[1]) continue;

    const target = match[1];
    const rawParams = match[2] || "";

    const link: WebLink = { target, rel: "" };
    const paramRegex = /;\s*([a-zA-Z0-9_\-*]+)(?:=(?:"([^"]*)"|([^;,\s]+)))?/g;
    let paramMatch: RegExpExecArray | null;

    while ((paramMatch = paramRegex.exec(rawParams)) !== null) {
      const name = paramMatch[1]!.toLowerCase();
      const val = paramMatch[2] ?? paramMatch[3] ?? "";

      if (name === "rel") {
        link.rel = val;
      } else if (name === "hreflang") {
        link.hreflang = val;
      } else if (name === "type") {
        link.type = val;
      } else if (name === "as") {
        link.as = val;
      } else if (name === "crossorigin") {
        link.crossorigin = val || true;
      } else if (name === "title") {
        link.title = val;
      }
    }

    if (link.rel) {
      results.push(link);
    }
  }

  return results;
}
