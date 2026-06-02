import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';

interface ApiKey {
  id: string;
  provider: string;
  key: string;
  status: string;
}

const FALLBACK_MODELS = [
  { id: 'imagen3', label: 'Imagen 3', provider: 'Google AI Studio', badge: 'Ultra-real' },
  { id: 'imagen2', label: 'Imagen 2', provider: 'Google AI Studio', badge: 'Fast' },
  { id: 'sdxl', label: 'Stable Diffusion XL', provider: 'Stability AI', badge: 'ControlNet' },
  { id: 'sd3', label: 'Stable Diffusion 3', provider: 'Stability AI', badge: 'New' },
  { id: 'midjourney6', label: 'Midjourney v6', provider: 'Midjourney', badge: 'Creative' },
];

export async function GET(req: NextRequest) {
  const rawCookie = req.cookies.get('ai_provider_keys')?.value;
  if (!rawCookie) {
    return NextResponse.json({ providers: [], models: [] });
  }

  let keys: ApiKey[] = [];
  try {
    const decrypted = await decryptToken(rawCookie);
    keys = JSON.parse(decrypted);
  } catch {
    return NextResponse.json({ providers: [], models: [] });
  }

  const providers = Array.from(new Set(keys.map(k => k.provider)));
  let dynamicModels: any[] = [];

  // Iterate through active providers and fetch their live models if supported
  for (const provider of providers) {
    const keyEntry = keys.find(k => k.provider === provider && k.status === 'active') || keys.find(k => k.provider === provider);
    if (!keyEntry?.key) continue;

    if (provider === 'OpenAI') {
      try {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${keyEntry.key}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter only DALL-E image generation models
          const dallEModels = data.data.filter((m: any) => m.id.includes('dall-e'));
          
          const mappedModels = dallEModels.map((m: any) => {
            let label = m.id === 'dall-e-3' ? 'DALL-E 3' : m.id === 'dall-e-2' ? 'DALL-E 2' : m.id;
            let badge = m.id === 'dall-e-3' ? 'Latest' : 'Legacy';
            return {
              id: m.id,
              label: label,
              provider: 'OpenAI',
              badge: badge
            };
          });
          
          dynamicModels = [...dynamicModels, ...mappedModels];
        } else {
          // If fetch fails, provide hardcoded defaults
          dynamicModels.push(
            { id: 'dall-e-3', label: 'DALL-E 3', provider: 'OpenAI', badge: 'Offline Fallback' },
            { id: 'dall-e-2', label: 'DALL-E 2', provider: 'OpenAI', badge: 'Legacy' }
          );
        }
      } catch (err) {
        console.error('Failed to fetch OpenAI models:', err);
      }
    } else {
      // For providers without a dynamic models endpoint, use our hardcoded fallbacks
      const fallbacks = FALLBACK_MODELS.filter(m => m.provider === provider);
      dynamicModels = [...dynamicModels, ...fallbacks];
    }
  }

  return NextResponse.json({
    providers,
    models: dynamicModels
  });
}
