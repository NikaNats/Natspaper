declare module "@mongodb-js/zstandard" {
  export function compress(
    input: Uint8Array | Buffer,
    level?: number
  ): Promise<Buffer>;
  export function decompress(input: Uint8Array | Buffer): Promise<Buffer>;
}
