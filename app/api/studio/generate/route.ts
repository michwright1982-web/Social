import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { decryptToken } from '@/lib/oauth-token';

interface ApiKey {
  id: string;
  provider: string;
  key: string;
  status: string;
}

export async function POST(req: NextRequest) {
  let body: { 
    prompt: string; 
    provider: string; 
    model?: string; 
    style?: string; 
    styleRules?: string; 
    ratio?: string; 
    variations?: number;
    openAiSize?: string;
    openAiQuality?: string;
    companyId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt, provider, model, style = 'Photorealistic', styleRules = '', ratio = '1:1', companyId = 'default' } = body;
  if (!prompt || !provider) {
    return NextResponse.json({ error: 'prompt and provider are required' }, { status: 400 });
  }

  let providerKey = '';

  // 1. Get Brand Context
  let brandRules = '';
  const brandCookieName = `ai_brand_context_${companyId}`;
  const brandCookie = req.cookies.get(brandCookieName)?.value;
  if (brandCookie) {
    try {
      const decryptedBrand = await decryptToken(brandCookie);
      const parsedBrand = decryptedBrand.startsWith('{') ? JSON.parse(decryptedBrand) : { context: decryptedBrand };
      const { context, font, color } = parsedBrand;
      if (context || font || color) {
        brandRules = '\nBrand:';
        if (context) brandRules += ` ${context}.`;
        if (color) {
          const colorStr = Array.isArray(color) ? color.join(', ') : color;
          brandRules += ` Colors: ${colorStr}.`;
        }
        if (font) brandRules += ` Font: ${font}.`;
      }
    } catch (error) {
      console.warn('Failed to parse brand context for generation', error);
    }
  }

  // 2. Get API Key for the requested provider from the cookie
  const keysCookieName = `ai_provider_keys_${companyId}`;
  const rawCookie = req.cookies.get(keysCookieName)?.value;
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

  // Text safe-zone rule: all text/typography must be inset at least 20px from every edge
  const textSafeZoneRule = ' All text must be inset 20px from edges.';

  const enhancedPrompt = styleRules 
    ? `${prompt}. Style: ${styleRules}. HQ.${brandRules}${textSafeZoneRule}`
    : `${prompt}, style: ${style}, HQ.${brandRules}${textSafeZoneRule}`;

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
      const variations = body.variations || 1;
      
      let openAiSize = body.openAiSize || 'auto';
      if (openAiSize === 'auto') {
        if (ratio === '9:16' || ratio === '4:5' || ratio === '3:4') {
          openAiSize = '1024x1536';
        } else if (ratio === '16:9') {
          openAiSize = '1536x1024';
        } else {
          openAiSize = '1024x1024';
        }
      }

      const reqBody: Record<string, string | number> = {
        model: cleanModelId,
        prompt: enhancedPrompt,
        n: 1, // Models force n=1 per request, so we loop below
        size: openAiSize
      };

      if (cleanModelId !== 'gpt-image-1') {
        reqBody.quality = body.openAiQuality || 'auto';
      }

      const fetchPromises = Array.from({ length: variations }).map(() => 
        fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${providerKey.trim()}`
          },
          body: JSON.stringify(reqBody)
        })
      );

      const responses = await Promise.all(fetchPromises);
      const resultingImages: string[] = [];

      for (const res of responses) {
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
        if (imageUrl) {
          resultingImages.push(imageUrl);
        }
      }

      if (resultingImages.length === 0) {
        return NextResponse.json({ error: 'No image URL or base64 data returned from OpenAI' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        images: resultingImages 
      });

    } else if (provider === 'Hugging Face') {
      // ── Hugging Face Inference API ──────────────────────────────────────────
      const hfModelId = model || 'black-forest-labs/FLUX.1-schnell';

      // Map aspect ratio to pixel dimensions for HF models
      let width = 1024;
      let height = 1024;
      if (ratio === '9:16') { width = 768;  height = 1360; }
      else if (ratio === '16:9') { width = 1360; height = 768; }
      else if (ratio === '4:5') { width = 896;  height = 1120; }
      else if (ratio === '3:4') { width = 768;  height = 1024; }

      const hfRes = await fetch(
        `https://api-inference.huggingface.co/models/${hfModelId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${providerKey.trim()}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              width,
              height,
              num_inference_steps: hfModelId.includes('schnell') ? 4 : 28,
              guidance_scale: hfModelId.includes('schnell') ? 0 : 3.5,
            },
          }),
        }
      );

      if (!hfRes.ok) {
        const errText = await hfRes.text();
        console.error('Hugging Face Error:', hfRes.status, errText);

        if (hfRes.status === 503) {
          return NextResponse.json(
            { error: 'Hugging Face model is loading — please wait ~20 seconds and try again.' },
            { status: 503 }
          );
        }

        let customMessage = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.error) customMessage = parsed.error;
        } catch {}

        return NextResponse.json(
          { error: `Hugging Face Error: ${customMessage}` },
          { status: hfRes.status === 401 ? 401 : 502 }
        );
      }

      // HF returns the image as a binary blob
      const imageBuffer = await hfRes.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const contentType = hfRes.headers.get('content-type') || 'image/jpeg';

      return NextResponse.json({
        success: true,
        images: [`data:${contentType};base64,${base64}`],
      });

    } else {
      return NextResponse.json({ error: `Image generation for ${provider} is not implemented yet.` }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('[studio/generate] Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to generate image due to an internal server error: ${errorMsg}` }, { status: 500 });
  }
}
