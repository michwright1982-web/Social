import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

const AI_KEYS_COOKIE_PREFIX = 'ai_provider_keys_';

interface ApiKey {
  id: string;
  provider: string;
  label: string;
  key: string;
  status: 'active' | 'invalid' | 'untested';
  lastUsed?: string;
}

/**
 * GET /api/keys
 * Returns all saved AI keys from the encrypted cookie.
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const cookieName = `${AI_KEYS_COOKIE_PREFIX}${companyId}`;
  const rawCookie = req.cookies.get(cookieName)?.value;
  if (!rawCookie) {
    return NextResponse.json([]);
  }

  try {
    const decrypted = await decryptToken(rawCookie);
    const keys = JSON.parse(decrypted) as ApiKey[];
    return NextResponse.json(keys);
  } catch (error) {
    console.error('Failed to parse AI keys from cookie:', error);
    return NextResponse.json([]);
  }
}

/**
 * POST /api/keys
 * Expects an array of ApiKey objects. Encrypts and saves to cookie.
 */
export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || 'default';
  const cookieName = `${AI_KEYS_COOKIE_PREFIX}${companyId}`;
  
  let keys: ApiKey[] = [];
  try {
    keys = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const payload = JSON.stringify(keys);
    const encrypted = await encryptToken(payload);

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieName, encrypted, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Failed to save API keys:', error);
    return NextResponse.json({ error: 'Failed to encrypt or save keys' }, { status: 500 });
  }
}
