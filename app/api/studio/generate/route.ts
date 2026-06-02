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

  if (provider !== 'Free Sandbox') {
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
  }

  const enhancedPrompt = `${prompt}, style: ${style}, high quality, detailed`;

  try {
    if (provider === 'Free Sandbox') {
      // ── Free Sandbox (Mock High-Quality Campaigns) ─────────────────────────
      const lowerPrompt = prompt.toLowerCase();
      
      const WATCH_IMAGES = [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const COFFEE_IMAGES = [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const SNEAKER_IMAGES = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const FASHION_IMAGES = [
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const REAL_ESTATE_IMAGES = [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const TECH_IMAGES = [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1527690710607-657bf571bb36?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const FITNESS_IMAGES = [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const FOOD_IMAGES = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1024&auto=format&fit=crop&q=80'
      ];
      
      const ABSTRACT_FALLBACK = [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1024&auto=format&fit=crop&q=80'
      ];

      let selectedList = ABSTRACT_FALLBACK;
      if (lowerPrompt.includes('watch') || lowerPrompt.includes('clock') || lowerPrompt.includes('time')) {
        selectedList = WATCH_IMAGES;
      } else if (lowerPrompt.includes('coffee') || lowerPrompt.includes('cafe') || lowerPrompt.includes('cup') || lowerPrompt.includes('mug')) {
        selectedList = COFFEE_IMAGES;
      } else if (lowerPrompt.includes('shoe') || lowerPrompt.includes('sneaker') || lowerPrompt.includes('kick')) {
        selectedList = SNEAKER_IMAGES;
      } else if (lowerPrompt.includes('fashion') || lowerPrompt.includes('cosmetic') || lowerPrompt.includes('makeup') || lowerPrompt.includes('dress') || lowerPrompt.includes('shirt')) {
        selectedList = FASHION_IMAGES;
      } else if (lowerPrompt.includes('house') || lowerPrompt.includes('home') || lowerPrompt.includes('villa') || lowerPrompt.includes('room') || lowerPrompt.includes('apartment') || lowerPrompt.includes('estate')) {
        selectedList = REAL_ESTATE_IMAGES;
      } else if (lowerPrompt.includes('tech') || lowerPrompt.includes('headphone') || lowerPrompt.includes('phone') || lowerPrompt.includes('gadget') || lowerPrompt.includes('device') || lowerPrompt.includes('computer')) {
        selectedList = TECH_IMAGES;
      } else if (lowerPrompt.includes('gym') || lowerPrompt.includes('fit') || lowerPrompt.includes('run') || lowerPrompt.includes('workout') || lowerPrompt.includes('train')) {
        selectedList = FITNESS_IMAGES;
      } else if (lowerPrompt.includes('food') || lowerPrompt.includes('steak') || lowerPrompt.includes('pizza') || lowerPrompt.includes('plate') || lowerPrompt.includes('burger') || lowerPrompt.includes('eat')) {
        selectedList = FOOD_IMAGES;
      }

      let width = 1080;
      let height = 1080;
      if (ratio === '9:16') { width = 1080; height = 1920; }
      else if (ratio === '16:9') { width = 1920; height = 1080; }
      else if (ratio === '4:5') { width = 1080; height = 1350; }
      else if (ratio === '3:4') { width = 1080; height = 1440; }

      selectedList = selectedList.map(url => url.replace('w=1024', `w=${width}&h=${height}`));

      await new Promise(resolve => setTimeout(resolve, 1500));

      return NextResponse.json({
        success: true,
        images: selectedList
      });

    } else if (provider === 'Google AI Studio') {
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
      const cleanModelId = model || 'dall-e-3';
      
      let openAiSize = '1024x1024';
      if (cleanModelId !== 'dall-e-2') {
        if (ratio === '9:16' || ratio === '4:5' || ratio === '3:4') openAiSize = '1024x1792';
        else if (ratio === '16:9') openAiSize = '1792x1024';
      } else {
        openAiSize = '512x512'; // dall-e-2 only supports square sizes up to 1024
      }

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerKey}`
        },
        body: JSON.stringify({
          model: cleanModelId,
          prompt: enhancedPrompt,
          n: 1,
          size: openAiSize
        })
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
