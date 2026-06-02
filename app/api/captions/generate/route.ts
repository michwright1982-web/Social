import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const rawCookie = req.cookies.get('ai_provider_keys')?.value;
    if (!rawCookie) {
      return NextResponse.json({ error: 'No API keys configured. Please add an OpenAI key in the Secure Vault.' }, { status: 401 });
    }

    let keys: any[] = [];
    let brandContext = '';
    
    try {
      const decrypted = await decryptToken(rawCookie);
      keys = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt API keys' }, { status: 500 });
    }

    const brandCookie = req.cookies.get('ai_brand_context')?.value;
    if (brandCookie) {
      try {
        brandContext = await decryptToken(brandCookie);
      } catch (err) {
        console.warn('Failed to decrypt brand context cookie');
      }
    }

    const providerKey = keys.find(k => k.provider === 'OpenAI' && k.status === 'active')?.key || keys.find(k => k.provider === 'OpenAI')?.key;
    
    if (!providerKey) {
      return NextResponse.json({ error: 'No active OpenAI key found. Please configure it in the Vault to generate AI captions.' }, { status: 401 });
    }

    let imageUrl = imageBase64;
    // If it's a raw base64 string without data prefix, add default jpeg prefix
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
      imageUrl = `data:image/jpeg;base64,${imageUrl}`;
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${providerKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert social media manager. You will be provided with an image. Write 4 distinct, highly engaging social media captions optimized for the provided image.
${brandContext ? `\nCRITICAL BRAND GUIDELINES:\n${brandContext}\nEnsure all captions strictly follow this brand context, tone, and product description.\n` : ''}
Return ONLY a valid JSON object matching this exact format:
{
  "facebook": "...",
  "instagram": "...",
  "x": "...",
  "linkedin": "..."
}
Keep X (Twitter) under 280 chars. Use emojis and relevant hashtags.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Generate the captions for this image.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI Caption Error:', errText);
      return NextResponse.json({ error: 'Failed to generate captions with OpenAI' }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const resultText = openaiData.choices[0].message.content;
    const captions = JSON.parse(resultText);

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json({ error: 'Failed to generate captions' }, { status: 500 });
  }
}
