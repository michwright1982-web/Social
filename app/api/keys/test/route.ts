import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/keys/test
 * Body: { provider: string; key: string }
 *
 * Validates an AI provider API key by making a minimal real API call.
 * Returns { valid: boolean; message: string }
 */
export async function POST(req: NextRequest) {
  let body: { provider?: string; key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, message: 'Invalid request body' }, { status: 400 });
  }

  const { provider, key } = body;
  if (!provider || !key) {
    return NextResponse.json({ valid: false, message: 'provider and key are required' }, { status: 400 });
  }

  try {
    switch (provider) {
      // ── Google AI Studio (Gemini) ─────────────────────────────────────────
      case 'Google AI Studio': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        );
        if (res.ok) return NextResponse.json({ valid: true,  message: 'Gemini API key is valid' });
        if (res.status === 400 || res.status === 403)
          return NextResponse.json({ valid: false, message: 'Invalid API key' });
        return NextResponse.json({ valid: false, message: `Google API returned ${res.status}` });
      }

      // ── OpenAI ────────────────────────────────────────────────────────────
      case 'OpenAI': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key.trim()}` },
        });
        if (res.ok) return NextResponse.json({ valid: true,  message: 'OpenAI key is valid' });
        if (res.status === 401)
          return NextResponse.json({ valid: false, message: 'Invalid API key' });
        return NextResponse.json({ valid: false, message: `OpenAI returned ${res.status}` });
      }

      // ── Anthropic ─────────────────────────────────────────────────────────
      case 'Anthropic': {
        // Anthropic doesn't have a cheap list endpoint; we use a minimal message
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method:  'POST',
          headers: {
            'x-api-key':         key,
            'anthropic-version': '2023-06-01',
            'Content-Type':      'application/json',
          },
          body: JSON.stringify({
            model:      'claude-3-haiku-20240307',
            max_tokens: 1,
            messages:   [{ role: 'user', content: 'hi' }],
          }),
        });
        if (res.ok || res.status === 529)
          return NextResponse.json({ valid: true,  message: 'Anthropic key is valid' });
        if (res.status === 401)
          return NextResponse.json({ valid: false, message: 'Invalid API key' });
        return NextResponse.json({ valid: false, message: `Anthropic returned ${res.status}` });
      }

      // ── Stability AI ──────────────────────────────────────────────────────
      case 'Stability AI': {
        const res = await fetch('https://api.stability.ai/v1/user/account', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) return NextResponse.json({ valid: true,  message: 'Stability AI key is valid' });
        if (res.status === 401)
          return NextResponse.json({ valid: false, message: 'Invalid API key' });
        return NextResponse.json({ valid: false, message: `Stability AI returned ${res.status}` });
      }

      // ── Hugging Face ──────────────────────────────────────────────────
      case 'Hugging Face': {
        const res = await fetch('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${key.trim()}` },
        });
        if (res.ok) return NextResponse.json({ valid: true,  message: 'Hugging Face token is valid' });
        if (res.status === 401)
          return NextResponse.json({ valid: false, message: 'Invalid Hugging Face token' });
        return NextResponse.json({ valid: false, message: `Hugging Face returned ${res.status}` });
      }

      // ── Unknown / Custom ────────────────────────────────────────────────
      default:
        return NextResponse.json({
          valid:   true,
          message: `Key saved. Auto-test not available for ${provider} — verify manually.`,
        });
    }
  } catch (err) {
    console.error('[key-test] Network error:', err);
    return NextResponse.json({ valid: false, message: 'Network error — check your connection' }, { status: 500 });
  }
}
