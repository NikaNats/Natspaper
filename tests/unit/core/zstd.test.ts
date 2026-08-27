// tests/unit/core/zstd.test.ts
import { describe, it, expect } from "vitest";
import { compress, decompress } from "@mongodb-js/zstandard";

describe("RFC 8878: Zstandard Compression Protocol", () => {
  it("should compress text and produce a valid Zstandard frame header with magic number 0xFD2FB528", async () => {
    const sourceText = "Natspaper: Academic High-Performance Static Blog Platform";
    const sourceBuffer = Buffer.from(sourceText, "utf8");

    const compressed = await compress(sourceBuffer, 10);

    // RFC 8878 Section 3.1.1: Magic Number is 4 bytes little-endian (0xFD2FB528 -> [0x28, 0xB5, 0x2F, 0xFD])
    expect(compressed[0]).toBe(0x28);
    expect(compressed[1]).toBe(0xb5);
    expect(compressed[2]).toBe(0x2f);
    expect(compressed[3]).toBe(0xfd);
  });

  it("should perform lossless round-trip compression and decompression", async () => {
    const originalContent = "<html><body><h1>Mathematical Typography with MathML Core</h1></body></html>".repeat(20);
    const originalBuffer = Buffer.from(originalContent, "utf8");

    const compressedBuffer = await compress(originalBuffer, 19);
    expect(compressedBuffer.length).toBeLessThan(originalBuffer.length);

    const decompressedBuffer = await decompress(compressedBuffer);
    expect(decompressedBuffer.toString("utf8")).toBe(originalContent);
  });
});
