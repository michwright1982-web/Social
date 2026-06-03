import { NextRequest, NextResponse } from 'next/server';
import { encryptToken, decryptToken, COOKIE_OPTIONS } from '@/lib/oauth-token';

const BRAND_CONTEXT_COOKIE = 'ai_brand_context';

export async function GET(req: NextRequest) {
  const rawCookie = req.cookies.get(BRAND_CONTEXT_COOKIE)?.value;
  if (!rawCookie) {
    return NextResponse.json({ context: '', font: '', color: '' });
  }

  try {
    const decrypted = await decryptToken(rawCookie);
    // Backward compatibility: if it's not JSON, assume it's just context
    if (decrypted.startsWith('{')) {
      const parsed = JSON.parse(decrypted);
      return NextResponse.json(parsed);
    } else {
      return NextResponse.json({ context: decrypted, font: '', color: '' });
    }
  } catch (error) {
    console.error('Failed to parse brand context from cookie:', error);
    return NextResponse.json({ context: '', font: '', color: '' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const contextStr = JSON.stringify({
      context: body.context || '',
      font: body.font || '',
      color: body.color || '',
      name: body.name || ''
    });

    const encrypted = await encryptToken(contextStr);

    const response = NextResponse.json({ success: true });
    response.cookies.set(BRAND_CONTEXT_COOKIE, encrypted, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('Failed to save brand context:', error);
    return NextResponse.json({ error: 'Failed to encrypt or save brand context' }, { status: 500 });
  }
}
