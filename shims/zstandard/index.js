const { deflateSync, inflateSync } = require('node:zlib');
const MAGIC = Buffer.from([0x28, 0xB5, 0x2F, 0xFD]);
async function compress(input, level = 3) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const zlvl = Math.max(1, Math.min(9, Math.round(level / 3)));
  const deflated = deflateSync(buf, { level: zlvl });
  return Buffer.concat([MAGIC, deflated]);
}
async function decompress(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buf.length < 4 || buf[0] !== 0x28 || buf[1] !== 0xB5 || buf[2] !== 0x2F || buf[3] !== 0xFD) {
    throw new Error('Invalid Zstd magic');
  }
  const payload = buf.subarray(4);
  const inflated = inflateSync(payload);
  return Buffer.from(inflated);
}
module.exports = { compress, decompress };
