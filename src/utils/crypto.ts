/**
 * Secure constant-time string comparison using SHA-256 digest and fixed-length XOR.
 *
 * 1. Hashes both strings with SHA-256, ensuring both buffers are always exactly 32 bytes
 *    regardless of input length (eliminating string length timing leaks).
 * 2. Compares all 32 bytes using bitwise XOR without early exit.
 *
 * Fully compatible with Cloudflare Workers (workerd), Node.js, and standard Web Crypto.
 */
export async function secureCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const bufA = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(a)));
  const bufB = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(b)));

  let diff = 0;
  for (let i = 0; i < 32; i++) {
    diff |= bufA[i] ^ bufB[i];
  }

  return diff === 0;
}
