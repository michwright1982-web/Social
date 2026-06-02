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
    return NextResponse.json({
      providers: [],
      models: []
    });
  }

  let keys: ApiKey[] = [];
  try {
    const decrypted = await decryptToken(rawCookie);
    keys = JSON.parse(decrypted);
  } catch {
    return NextResponse.json({
      providers: [],
      models: []
    });
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
          headers: { 'Authorization': `Bearer ${keyEntry.key.trim()}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter only GPT Image generation models
          const gptImageModels = data.data.filter((m: any) => m.id.includes('gpt-image'));
          
          const mappedModels = gptImageModels.map((m: any) => {
            let label = m.id === 'gpt-image-2' ? 'GPT Image 2' : m.id === 'gpt-image-1' ? 'GPT Image 1' : m.id;
            let badge = m.id === 'gpt-image-2' ? 'Latest' : 'Legacy';
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
            { id: 'gpt-image-2', label: 'GPT Image 2', provider: 'OpenAI', badge: 'Offline Fallback' },
            { id: 'gpt-image-1', label: 'GPT Image 1', provider: 'OpenAI', badge: 'Legacy' }
          );
        }
      } catch (err) {
        console.error('Failed to fetch OpenAI models:', err);
      }
    } else if (provider === 'Google AI Studio') {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyEntry.key}`);
        if (res.ok) {
          const data = await res.json();
          // Filter only Imagen image generation models
          const googleModels = (data.models || []).filter((m: any) => 
            m.name.includes('imagen') && 
            m.supportedGenerationMethods?.includes('predict')
          );
          
          const mappedModels = googleModels.map((m: any) => {
            const id = m.name.replace(/^models\//, '');
            let label = m.displayName || id;
            if (label === 'Imagen 3') label = 'Imagen 3 (Generate 001)';
            
            let badge = 'Latest';
            if (id.includes('ultra')) badge = 'Ultra';
            else if (id.includes('fast')) badge = 'Fast';
            else if (id.includes('3.0')) badge = 'v3.0';
            
            return {
              id: id,
              label: label,
              provider: 'Google AI Studio',
              badge: badge
            };
          });
          
          if (mappedModels.length > 0) {
            dynamicModels = [...dynamicModels, ...mappedModels];
          } else {
            dynamicModels.push(
              { id: 'imagen-3.0-generate-001', label: 'Imagen 3 (Generate 001)', provider: 'Google AI Studio', badge: 'Latest' },
              { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast', provider: 'Google AI Studio', badge: 'Fast' }
            );
          }
        } else {
          dynamicModels.push(
            { id: 'imagen-3.0-generate-001', label: 'Imagen 3 (Generate 001)', provider: 'Google AI Studio', badge: 'Latest' },
            { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast', provider: 'Google AI Studio', badge: 'Fast' }
          );
        }
      } catch (err) {
        console.error('Failed to fetch Google AI models:', err);
        dynamicModels.push(
          { id: 'imagen-3.0-generate-001', label: 'Imagen 3 (Generate 001)', provider: 'Google AI Studio', badge: 'Latest' },
          { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast', provider: 'Google AI Studio', badge: 'Fast' }
        );
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
