import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV
const TAG_LENGTH = 16; // 128-bit authentication tag

function getEncryptionKey(): Buffer {
  const secret = process.env.PIN_ENCRYPTION_SECRET || process.env.AUTH_SECRET || 'doam-insecure-development-secret-key-32b';
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a 4-digit PIN using AES-256-GCM.
 * Output format: <hex_iv>:<hex_auth_tag>:<hex_ciphertext>
 */
export function encryptPin(pin: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cipher = createCipheriv(ALGORITHM, key as any, iv as any);

  let encrypted = cipher.update(pin, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Decrypts an encrypted PIN string using AES-256-GCM.
 * Returns the decrypted plaintext PIN, or null if decryption / tag validation fails.
 */
export function decryptPin(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, tagHex, dataHex] = parts;
    if (!ivHex || !tagHex || !dataHex) return null;
    if (ivHex.length !== IV_LENGTH * 2 || tagHex.length !== TAG_LENGTH * 2) return null;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decipher = createDecipheriv(ALGORITHM, key as any, iv as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decipher.setAuthTag(tag as any);

    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return null;
  }
}
