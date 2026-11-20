import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The root "/" redirect sends visitors to /ka/ only when Georgian is their
 * PRIMARY language. Browsers list Accept-Language entries in preference
 * order, so the first entry is what matters, not any substring "ka".
 */
interface Redirect {
  source: string;
  destination: string;
  has?: Array<{ type: string; key: string; value: string }>;
}

const vercel = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../../vercel.json"), "utf8")
) as { redirects: Redirect[] };

const kaRule = vercel.redirects.find(r => r.destination === "/ka/");
const header = kaRule?.has?.find(h => h.key === "Accept-Language");
const pattern = new RegExp(header?.value ?? "(?!)");

describe("Accept-Language redirect to /ka/", () => {
  it("exists and is keyed on the Accept-Language header", () => {
    expect(kaRule?.source).toBe("/");
    expect(header?.type).toBe("header");
  });

  it.each([
    "ka",
    "ka-GE",
    "KA-ge",
    "ka-GE,ka;q=0.9,en;q=0.8",
    "ka;q=0.9,en;q=0.5",
  ])("redirects when Georgian is primary: %s", value => {
    expect(pattern.test(value)).toBe(true);
  });

  it.each([
    "en-US,en;q=0.9,ka;q=0.5", // Georgian only as a secondary language
    "en",
    "kab,en", // Kabyle, not Georgian
    "de-DE,ka-GE;q=0.8",
  ])("does not redirect: %s", value => {
    expect(pattern.test(value)).toBe(false);
  });
});
