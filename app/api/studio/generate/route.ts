import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

interface ApiKey {
  id: string;
  provider: string;
  key: string;
  status: string;
}

export async function POST(req: NextRequest) {
  let body: { prompt: string; provider: string; model?: string; style?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, provider, style = 'Photorealistic' } = body;
  if (!prompt || !provider) {
    return NextResponse.json({ error: 'prompt and provider are required' }, { status: 400 });
  }

  // 1. Get API Key for the requested provider from the cookie
  const rawCookie = req.cookies.get('ai_provider_keys')?.value;
  if (!rawCookie) {
    return NextResponse.json({ error: 'No API keys configured. Please add one in the Secure Vault.' }, { status: 401 });
  }

  let keys: ApiKey[] = [];
  try {
    const decrypted = await decryptToken(rawCookie);
    keys = JSON.parse(decrypted);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt API keys' }, { status: 500 });
  }

  const providerKey = keys.find(k => k.provider === provider && k.status === 'active')?.key || keys.find(k => k.provider === provider)?.key;
  if (!providerKey) {
    return NextResponse.json({ error: `No active API key found for ${provider}. Please configure it in the Secure Vault.` }, { status: 401 });
  }

  const enhancedPrompt = `${prompt}, style: ${style}, high quality, detailed`;

  try {
    if (provider === 'Google AI Studio') {
      // ── Google AI Studio (Imagen 3) ──────────────────────────────────────────
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${providerKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            { prompt: enhancedPrompt }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1"
          }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Google AI Error:', err);
        return NextResponse.json({ error: 'Google AI Studio failed to generate image' }, { status: 502 });
      }

      const data = await res.json();
      const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Image) {
         return NextResponse.json({ error: 'No image data returned from Google AI Studio' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        images: [`data:image/jpeg;base64,${base64Image}`] 
      });

    } else if (provider === 'OpenAI') {
      // ── OpenAI (DALL-E 3) ──────────────────────────────────────────────────
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('OpenAI Error:', err);
        return NextResponse.json({ error: 'OpenAI failed to generate image' }, { status: 502 });
      }

      const data = await res.json();
      const url = data?.data?.[0]?.url;
      if (!url) {
        return NextResponse.json({ error: 'No image URL returned from OpenAI' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        images: [url] 
      });

    } else {
      return NextResponse.json({ error: `Image generation for ${provider} is not implemented yet.` }, { status: 400 });
    }

  } catch (error) {
    console.error('[studio/generate] Error:', error);
    return NextResponse.json({ error: 'Failed to generate image due to an internal server error.' }, { status: 500 });
  }
}
