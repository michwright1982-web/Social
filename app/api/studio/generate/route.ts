import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

interface ApiKey {
  id: string;
  provider: string;
  key: string;
  status: string;
}

export async function POST(req: NextRequest) {
  let body: { prompt: string; provider: string; model?: string; style?: string; ratio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, provider, model, style = 'Photorealistic', ratio = '1:1' } = body;
  if (!prompt || !provider) {
    return NextResponse.json({ error: 'prompt and provider are required' }, { status: 400 });
  }

  let providerKey = '';

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

    const foundKey = keys.find(k => k.provider === provider && k.status === 'active')?.key || keys.find(k => k.provider === provider)?.key;
    if (!foundKey) {
      return NextResponse.json({ error: `No active API key found for ${provider}. Please configure it in the Secure Vault.` }, { status: 401 });
    }
    providerKey = foundKey;

  const enhancedPrompt = `${prompt}, style: ${style}, high quality, detailed`;

  try {
    if (provider === 'Google AI Studio') {
      // ── Google AI Studio (Dynamic Model ID) ──────────────────────────────────
      const cleanModelId = (model || 'imagen-3.0-generate-001').replace(/^models\//, '');
      
      let googleRatio = ratio;
      if (ratio === '4:5') googleRatio = '3:4'; // Google fallback for 4:5

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:predict?key=${providerKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            { prompt: enhancedPrompt }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: googleRatio
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Google AI Error:', errText);
        
        let customMessage = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) {
            customMessage = parsed.error.message;
          }
        } catch {}
        
        return NextResponse.json({ error: `Google AI Error: ${customMessage}` }, { status: res.status === 400 ? 400 : 502 });
      }

      const data = await res.json();
      const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;
      if (!base64Image) {
        return NextResponse.json({ error: 'No image data returned from Google AI' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        images: [`data:image/jpeg;base64,${base64Image}`] 
      });

    } else if (provider === 'OpenAI') {
      // ── OpenAI (Dynamic Model ID) ──────────────────────────────────────────
      const cleanModelId = model || 'gpt-image-2';
      
      let openAiSize = '1024x1024';
      if (ratio === '9:16' || ratio === '4:5' || ratio === '3:4') {
        openAiSize = '1024x1536';
      } else if (ratio === '16:9') {
        openAiSize = '1536x1024';
      }

      const reqBody: any = {
        model: cleanModelId,
        prompt: enhancedPrompt,
        n: 1,
        size: openAiSize
      };

      if (cleanModelId !== 'gpt-image-1') {
        reqBody.quality = 'standard';
      }

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerKey.trim()}`
        },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('OpenAI Error:', errText);
        
        let customMessage = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error?.message) {
            customMessage = parsed.error.message;
          }
        } catch {}
        
        return NextResponse.json({ error: `OpenAI Error: ${customMessage}` }, { status: res.status === 400 ? 400 : 502 });
      }

      const data = await res.json();
      const imgData = data?.data?.[0];
      
      let imageUrl = imgData?.url;
      if (!imageUrl && imgData?.b64_json) {
        imageUrl = `data:image/png;base64,${imgData.b64_json}`;
      }

      if (!imageUrl) {
        return NextResponse.json({ error: 'No image URL or base64 data returned from OpenAI' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        images: [imageUrl] 
      });

    } else {
      return NextResponse.json({ error: `Image generation for ${provider} is not implemented yet.` }, { status: 400 });
    }

  } catch (error) {
    console.error('[studio/generate] Error:', error);
    return NextResponse.json({ error: 'Failed to generate image due to an internal server error.' }, { status: 500 });
  }
}
