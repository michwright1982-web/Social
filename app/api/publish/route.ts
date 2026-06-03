import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';
import { Buffer } from 'buffer';

// Helper: upload one base64 image as an unpublished FB photo and return its ID
async function uploadFbPhoto(pageId: string, token: string, imageBase64: string): Promise<string> {
  const match = imageBase64.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  if (!match) throw new Error('Invalid image format. Expected base64 data URI.');
  const mimeType = `image/${match[1]}`;
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });

  const formData = new FormData();
  formData.append('source', blob, 'image.jpg');
  formData.append('published', 'false'); // unpublished — we'll attach to a post
  formData.append('access_token', token);

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { const p = JSON.parse(text); if (p.error?.message) msg = p.error.message; } catch {}
    throw new Error(`Facebook upload error: ${msg}`);
  }

  const data = await res.json();
  return data.id as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, caption } = body;

    // Accept either legacy `imageBase64` (single) or `images` (array)
    const images: string[] = body.images
      ? body.images
      : body.imageBase64
        ? [body.imageBase64]
        : [];

    if (!platform || images.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (platform === 'facebook') {
      const credsCookie = req.cookies.get('oauth_app_creds')?.value;
      if (!credsCookie) return NextResponse.json({ error: 'Not connected to Facebook. Please set up Page ID in the Vault.' }, { status: 401 });

      const decrypted = await decryptToken(credsCookie);
      const creds = JSON.parse(decrypted);
      const fbCreds = creds.facebook;

      if (!fbCreds || !fbCreds.clientId || !fbCreds.clientSecret) {
        return NextResponse.json({ error: 'Facebook credentials missing in Vault.' }, { status: 401 });
      }

      const pageId = fbCreds.clientId;
      const token = fbCreds.clientSecret;

      if (images.length === 1) {
        // ── Single image post ──────────────────────────────────────────────────
        const match = images[0].match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
        if (!match) return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 });

        const mimeType = `image/${match[1]}`;
        const buffer = Buffer.from(match[2], 'base64');
        const blob = new Blob([buffer], { type: mimeType });

        const formData = new FormData();
        formData.append('message', caption || '');
        formData.append('source', blob, 'image.jpg');
        formData.append('access_token', token);

        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          body: formData,
        });

        if (!fbRes.ok) {
          const errorText = await fbRes.text();
          let msg = errorText;
          try { const p = JSON.parse(errorText); if (p.error?.message) msg = p.error.message; } catch {}
          return NextResponse.json({ error: `Facebook API: ${msg}` }, { status: fbRes.status });
        }

        const data = await fbRes.json();
        return NextResponse.json({ success: true, postId: data.id });

      } else {
        // ── Carousel / multi-photo post ────────────────────────────────────────
        // Step 1: Upload each image as an unpublished photo and collect IDs
        const photoIds = await Promise.all(
          images.map(img => uploadFbPhoto(pageId, token, img))
        );

        // Step 2: Create a feed post that references all photos (Facebook carousel)
        const feedFormData = new FormData();
        feedFormData.append('message', caption || '');
        photoIds.forEach(pid => feedFormData.append('attached_media[]', JSON.stringify({ media_fbid: pid })));
        feedFormData.append('access_token', token);

        const feedRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
          method: 'POST',
          body: feedFormData,
        });

        if (!feedRes.ok) {
          const errorText = await feedRes.text();
          let msg = errorText;
          try { const p = JSON.parse(errorText); if (p.error?.message) msg = p.error.message; } catch {}
          return NextResponse.json({ error: `Facebook carousel post error: ${msg}` }, { status: feedRes.status });
        }

        const feedData = await feedRes.json();
        return NextResponse.json({ success: true, postId: feedData.id, photoCount: photoIds.length });
      }
    }

    return NextResponse.json({ error: `Publishing for ${platform} is not implemented yet.` }, { status: 400 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Publishing error:', message);
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
