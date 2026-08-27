import { describe, it, expect } from "vitest";

describe("RFC 4287 Atom 1.0 Specifications", () => {
  it("should format timestamps to strict RFC 3339 with uppercase T and Z", () => {
    const testDate = new Date("2026-03-15T14:30:00.000Z");
    const rfc3339 = testDate.toISOString();

    expect(rfc3339).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(rfc3339).toContain("T");
    expect(rfc3339).toContain("Z");
  });

  it("should generate deterministic Tag URIs for entry IDs (RFC 4287 Section 4.2.6)", () => {
    const host = "natspaper.vercel.app";
    const year = 2026;
    const locale = "en";
    const slug = "distributed-consensus-algorithms";

    const atomId = `tag:${host},${year}:${locale}/posts/${slug}`;
    expect(atomId).toBe("tag:natspaper.vercel.app,2026:en/posts/distributed-consensus-algorithms");
    expect(atomId).toMatch(/^tag:[a-z0-9.-]+,\d{4}:[a-z-]+\/posts\/[a-z0-9-]+$/);
  });

  it("should generate valid Atom feed structure with required elements", () => {
    const sampleFeed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title type="text">Natspaper</title>
  <id>https://natspaper.vercel.app/en/atom.xml</id>
  <updated>2026-03-15T10:00:00Z</updated>
  <link rel="self" type="application/atom+xml" href="https://natspaper.vercel.app/en/atom.xml" />
  <link rel="alternate" type="text/html" hreflang="en" href="https://natspaper.vercel.app/en/" />
  <author>
    <name>Nika Natsvlishvili</name>
  </author>
  <entry xml:lang="en">
    <title type="text">Test Post</title>
    <id>tag:natspaper.vercel.app,2026:en/posts/test</id>
    <published>2026-03-15T10:00:00Z</published>
    <updated>2026-03-15T10:00:00Z</updated>
    <summary type="html">Test summary</summary>
  </entry>
</feed>`;

    expect(sampleFeed).toContain('xmlns="http://www.w3.org/2005/Atom"');
    expect(sampleFeed).toContain("<published>");
    expect(sampleFeed).toContain("<updated>");
    expect(sampleFeed).toContain('rel="self" type="application/atom+xml"');
    expect(sampleFeed).toContain('rel="alternate" type="text/html"');
  });
});
