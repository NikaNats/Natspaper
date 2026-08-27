// shims/zstandard/index.js
import { deflateSync, inflateSync } from "node:zlib";

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

export async function compress(input, level = 3) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const zlvl = Math.max(1, Math.min(9, Math.round(level / 3)));
  const deflated = deflateSync(buf, { level: zlvl });
  return Buffer.concat([MAGIC, deflated]);
}

export async function decompress(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (
    buf.length < 4 ||
    buf[0] !== 0x28 ||
    buf[1] !== 0xb5 ||
    buf[2] !== 0x2f ||
    buf[3] !== 0xfd
  ) {
    throw new Error("Invalid Zstd magic");
  }
  const payload = buf.subarray(4);
  const inflated = inflateSync(payload);
  return Buffer.from(inflated);
}

export default { compress, decompress };