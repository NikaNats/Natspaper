// tests/unit/core/zstd.test.ts
import { describe, it, expect } from "vitest";
import { promisify } from "node:util";
import zlib from "node:zlib";

/**
 * RFC 8878 contract for scripts/compress-assets.js, which uses Node's native
 * zstd binding with these exact parameters. A frame produced here must be
 * decodable by a real zstd decoder — the property the former deflate-based
 * shim violated (it only faked the magic number).
 */
const zstdCompress = promisify(zlib.zstdCompress);
const compress = (buf: Buffer, level: number) =>
  zstdCompress(buf, {
    params: {
      [zlib.constants.ZSTD_c_compressionLevel]: level,
      [zlib.constants.ZSTD_c_checksumFlag]: 1,
    },
  });

describe("RFC 8878: Zstandard Compression Protocol", () => {
  it("emits a frame starting with magic number 0xFD2FB528", async () => {
    const compressed = await compress(
      Buffer.from("Natspaper: Academic High-Performance Static Blog Platform"),
      10
    );

    // RFC 8878 §3.1.1: 4-byte little-endian magic number
    expect([...compressed.subarray(0, 4)]).toEqual([0x28, 0xb5, 0x2f, 0xfd]);
  });

  it("round-trips losslessly through a real zstd decoder", async () => {
    const original =
      "<html><body><h1>Mathematical Typography with MathML Core</h1></body></html>".repeat(
        20
      );
    const compressed = await compress(Buffer.from(original), 19);

    expect(compressed.length).toBeLessThan(original.length);
    expect(zlib.zstdDecompressSync(compressed).toString("utf8")).toBe(original);
  });

  it("rejects deflate data wearing a zstd magic number (the old shim's output)", () => {
    const fake = Buffer.concat([
      Buffer.from([0x28, 0xb5, 0x2f, 0xfd]),
      zlib.deflateSync(Buffer.from("not really zstd")),
    ]);

    expect(() => zlib.zstdDecompressSync(fake)).toThrow();
  });
});
