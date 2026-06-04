import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, companyId = 'default' } = body;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const keysCookieName = `ai_provider_keys_${companyId}`;
    const rawCookie = req.cookies.get(keysCookieName)?.value;
    
    if (!rawCookie) {
      return NextResponse.json({ error: 'No API keys configured. Please add one in the Secure Vault.' }, { status: 401 });
    }

    const keys = JSON.parse(await decryptToken(rawCookie));
    const openaiKey = keys.find((k: any) => k.provider === 'OpenAI' && k.status === 'active')?.key || keys.find((k: any) => k.provider === 'OpenAI')?.key;
    
    if (!openaiKey) {
      return NextResponse.json({ error: 'An active OpenAI API key is required to analyze styles.' }, { status: 401 });
    }

    // Call OpenAI Vision to analyze style
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert art director and AI prompt engineer. Analyze the given image and extract its core visual style into a structured format.'
          },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Analyze this image and create a reusable style preset for an AI image generator. Output JSON with these exact fields: "id" (a unique snake_case string), "name" (catchy, descriptive name), "description" (short 1-2 sentence summary), "rules" (bulleted list of strict visual rules covering color, lighting, texture, and composition).' 
              },
              { 
                type: 'image_url', 
                image_url: { url: image } 
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenAI Error:', errorText);
      throw new Error(`OpenAI API Error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const styleData = JSON.parse(content);
    
    // Add the sample image we just analyzed
    styleData.sampleImage = image;

    return NextResponse.json(styleData);
  } catch (error: any) {
    console.error('[generate-style] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate style' }, { status: 500 });
  }
}
