/**
 * hash — pure content hashing for dedup keys (CAP-062 contentHash).
 * FNV-1a 32-bit x4 lanes → 32-hex-char digest (no node:crypto import
 * burden; adequate for dedup keys, not security). Lives in its own pure
 * module so both default-runtime and "use node" modules can import it.
 */

export function hashContent(text: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193, h3 = 0xdeadbeef, h4 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = (h1 ^ c) * 0x01000193;
    h2 = (h2 + c * (i + 1)) >>> 0;
    h3 = (h3 ^ (c << 3)) >>> 0;
    h4 = (h4 + c * c) >>> 0;
  }
  return [h1, h2, h3, h4].map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
