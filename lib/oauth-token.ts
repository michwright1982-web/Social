/**
 * lib/oauth-token.ts
 *
 * Encrypt and decrypt OAuth tokens using AES-GCM (Web Crypto API).
 * Tokens are encrypted with OAUTH_TOKEN_SECRET before being stored
 * in HttpOnly cookies so they are never stored in plaintext.
 */

const ALG = 'AES-GCM';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

function getSecret(): string {
  const secret = process.env.OAUTH_TOKEN_SECRET || 'q7w8e9r0t1y2u3i4o5p6a7s8d9f0g1h2j3k4l5_fallback_secret_key';
  return secret;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret).slice(0, 32).buffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('ai-marketing-hub-salt'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALG, length: 256 },
    false,
    KEY_USAGE,
  );
}

/** Encrypt a plain-text token string → base64 ciphertext */
export async function encryptToken(token: string): Promise<string> {
  const key = await deriveKey(getSecret());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALG, iv },
    key,
    enc.encode(token),
  );
  // Prepend IV so we can use it during decrypt
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return Buffer.from(combined).toString('base64');
}

/** Decrypt a base64 ciphertext → plain-text token string */
export async function decryptToken(encoded: string): Promise<string> {
  const key = await deriveKey(getSecret());
  const combined = Buffer.from(encoded, 'base64');
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: ALG, iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plain);
}

/** Platform cookie names */
export const COOKIE_NAMES: Record<string, string> = {
  facebook:  'oauth_fb',
  instagram: 'oauth_fb',   // same token as Facebook
  x:         'oauth_x',
  linkedin:  'oauth_li',
};

export const COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  'lax' as const,
  path:      '/',
  maxAge:    60 * 60 * 24 * 60, // 60 days
};

// ── App Credentials Helper ───────────────────────────────────────────────────

/** Reads configured OAuth Client ID & Secret from global environment variables (SaaS mode) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAppCredentials(_req: import('next/server').NextRequest, platform: string, _companyId: string) {
  const envPrefix = platform === 'x' ? 'X' : platform.toUpperCase();
  return {
    clientId: process.env[`${envPrefix}_CLIENT_ID`] || '',
    clientSecret: process.env[`${envPrefix}_CLIENT_SECRET`] || '',
  };
}
