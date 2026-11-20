import { describe, it, expect } from "vitest";
import {
  extractInlineContents,
  isCspGovernedScript,
  cspHash,
} from "../../../scripts/generate-csp-hashes.js";

/**
 * CSP script-src applies only to scripts the browser can execute
 * (WHATWG HTML "prepare the script element"). JSON-LD and other data blocks
 * must never be hashed: they are unique per page, so hashing them grew the
 * single global CSP header with every new post.
 */
describe("isCspGovernedScript()", () => {
  it.each([
    "<script>",
    '<script type="">',
    '<script type="text/javascript">',
    "<script type=module>",
    '<script type="module" data-astro-rerun>',
    '<script type="importmap">',
    '<script type="speculationrules">',
    '<script type="text/javascript; charset=utf-8">',
    "<script TYPE='Application/JavaScript'>",
  ])("treats %s as executable (hashed)", tag => {
    expect(isCspGovernedScript(tag)).toBe(true);
  });

  it.each([
    '<script type="application/ld+json">',
    '<script type="application/json">',
    '<script type="text/template">',
  ])("treats %s as a data block (not hashed)", tag => {
    expect(isCspGovernedScript(tag)).toBe(false);
  });
});

describe("extractInlineContents()", () => {
  it("hashes executable inline scripts but skips JSON-LD and external scripts", () => {
    const html = [
      '<script type="application/ld+json">{"@type":"BlogPosting"}</script>',
      "<script>window.a=1</script>",
      '<script src="/x.js"></script>',
      '<script data-src="x">window.b=2</script>',
    ].join("");

    expect(extractInlineContents(html).scripts).toEqual([
      "window.a=1",
      "window.b=2",
    ]);
  });

  it("ignores <script> text inside HTML comments", () => {
    const html = "<!-- <script>evil()</script> --><script>ok()</script>";
    expect(extractInlineContents(html).scripts).toEqual(["ok()"]);
  });

  it("produces CSP-formatted sha256 sources", () => {
    expect(cspHash("")).toBe(
      "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='"
    );
  });
});
