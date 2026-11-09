import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildPostLastmodMap, lastmodForUrl } from "../../../config/sitemapLastmod";

let dir: string;

function write(rel: string, frontmatter: string) {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\n${frontmatter}\n---\n\nBody\n`);
}

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lastmod-"));
  write("en/edited.md", "pubDatetime: 2025-01-15T10:00:00.000Z\nmodDatetime: 2025-03-01T00:00:00.000Z");
  write("en/plain.md", 'title: "x"\npubDatetime: 2025-02-01T00:00:00.000Z\nmodDatetime: null');
  write("ka/plain.md", "pubDatetime: 2025-04-01T00:00:00.000Z");
  write("ka/ka-only.mdx", 'pubDatetime: "2025-05-01T00:00:00.000Z"');
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("buildPostLastmodMap", () => {
  it("prefers modDatetime and falls back to pubDatetime", () => {
    const map = buildPostLastmodMap(["en", "ka"], "en", dir);
    expect(map.get("en/edited")?.toISOString()).toBe("2025-03-01T00:00:00.000Z");
    expect(map.get("en/plain")?.toISOString()).toBe("2025-02-01T00:00:00.000Z");
  });

  it("uses each locale's own translation when it exists", () => {
    const map = buildPostLastmodMap(["en", "ka"], "en", dir);
    expect(map.get("ka/plain")?.toISOString()).toBe("2025-04-01T00:00:00.000Z");
  });

  it("gives fallback pages the date of the version they render", () => {
    const map = buildPostLastmodMap(["en", "ka"], "en", dir);
    expect(map.get("ka/edited")?.toISOString()).toBe("2025-03-01T00:00:00.000Z");
    expect(map.get("en/ka-only")?.toISOString()).toBe("2025-05-01T00:00:00.000Z");
  });
});

describe("lastmodForUrl", () => {
  const map = new Map([["en/edited", new Date("2025-03-01T00:00:00.000Z")]]);

  it("resolves post URLs", () => {
    expect(lastmodForUrl("https://example.com/en/posts/edited/", map)).toBe(
      "2025-03-01T00:00:00.000Z"
    );
  });

  it("returns undefined for non-post and unknown URLs (lastmod omitted)", () => {
    expect(lastmodForUrl("https://example.com/en/", map)).toBeUndefined();
    expect(lastmodForUrl("https://example.com/en/posts/2/", map)).toBeUndefined();
    expect(lastmodForUrl("https://example.com/en/tags/astro/", map)).toBeUndefined();
  });
});
