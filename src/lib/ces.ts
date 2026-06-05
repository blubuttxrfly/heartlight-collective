/**
 * C.E.S. (Core Energetic Signature) Cryptographic Helpers
 *
 * Public  C.E.S.:  123456789
 * Hidden  C.E.S.:  —987654321  (reversed, used for steward records & security logs)
 *
 * A simple digit-reversal scheme — not encryption, but obfuscation.
 * It is designed to prevent casual reading, NOT to resist determined cryptanalysis.
 */

/** Reverse a 9-digit C.E.S. and prepend a minus sign. */
export function cesEncrypt(digits: string): string {
  if (!digits || digits.length !== 9) return '';
  return '-' + digits.split('').reverse().join('');
}

/** Recover the original digits from a reversed C.E.S. */
export function cesDecrypt(encrypted: string): string {
  if (!encrypted || !encrypted.startsWith('-')) return '';
  return encrypted.slice(1).split('').reverse().join('');
}

/** Generate a unique 9-digit C.E.S. that avoids collisions and
 *  prevents four consecutive identical digits.               */
export function generateCESNumberValue(used: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 200; attempt++) {
    let value = '';
    while (value.length < 9) {
      const nextDigit = String(Math.floor(Math.random() * 10));
      // Prevent 4+ consecutive identical digits
      const recent = value.slice(-3);
      if (recent.length === 3 && recent.split('').every((d) => d === nextDigit)) continue;
      value += nextDigit;
    }
    if (!used.has(value)) return value;
  }
  // Fallback after 200 failed attempts
  return String(Math.floor(100000000 + Math.random() * 900000000));
}
