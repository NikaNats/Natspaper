import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeDescription, toPlainText } from "@/utils/rss";

/**
 * Feed escaping contract: descriptions are converted to plain text once and
 * escaped exactly once, by whichever serializer emits them.
 * Regression for double-escaped Atom summaries (`&amp;amp;`) and the RSS
 * feed rendering a literal `<![CDATA[` wrapper.
 */
describe("toPlainText()", () => {
  it("keeps literal ampersands, quotes and comparison operators unescaped", () => {
    expect(toPlainText(`Tom & Jerry's "show": x < 5 && y > 2`)).toBe(
      `Tom & Jerry's "show": x < 5 && y > 2`
    );
  });

  it("strips HTML tags and markdown syntax", () => {
    expect(
      toPlainText("Read <b>this</b> [**guide**](https://example.com) `now`")
    ).toBe("Read this guide");
  });

  it("drops link URLs entirely, so no unsafe scheme survives", () => {
    const result = toPlainText("[click](javascript:alert(1))");
    expect(result).toBe("click");
    expect(result).not.toContain("javascript:");
  });

  it("truncates by code point, not UTF-16 unit (Georgian/emoji safe)", () => {
    const result = toPlainText("ა".repeat(600));
    expect(Array.from(result)).toHaveLength(500);
  });

  it("returns an empty string for empty input", () => {
    expect(toPlainText("")).toBe("");
  });
});

describe("sanitizeDescription()", () => {
  it("is exactly escapeHtml(toPlainText(x)): one level of escaping", () => {
    const input = `Tom & Jerry's <script>x</script> [link](https://a.b)`;
    expect(sanitizeDescription(input)).toBe(escapeHtml(toPlainText(input)));
    expect(sanitizeDescription("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("never produces double-escaped entities", () => {
    const once = sanitizeDescription(`a & b's`);
    expect(once).not.toContain("&amp;amp;");
    expect(once).not.toContain("&amp;#39;");
  });
});
