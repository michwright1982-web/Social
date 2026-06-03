import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';
import { Buffer } from 'buffer';

// ── Helpers ───────────────────────────────────────────────────────────────────

function imageToBlob(imageBase64: string): { blob: Blob; mimeType: string } {
  const match = imageBase64.match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
  if (!match) throw new Error('Invalid image format. Expected a base64 data URI.');
  const mimeType = `image/${match[1]}`;
  const buffer = Buffer.from(match[2], 'base64');
  return { blob: new Blob([buffer], { type: mimeType }), mimeType };
}

/**
 * Upload a single photo as an UNPUBLISHED staging photo.
 * Returns the photo ID, or throws if the token lacks Page permissions (#200).
 */
async function uploadUnpublishedPhoto(
  pageId: string, token: string, imageBase64: string
): Promise<string> {
  const { blob } = imageToBlob(imageBase64);
  const fd = new FormData();
  fd.append('source', blob, 'image.jpg');
  fd.append('published', 'false');
  fd.append('access_token', token);

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
    method: 'POST', body: fd,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? JSON.stringify(json);
    const code = json?.error?.code;
    throw Object.assign(new Error(msg), { fbCode: code });
  }
  return json.id as string;
}

/**
 * Publish a single photo directly (caption on the post).
 * Works with both User and Page Access Tokens.
 */
async function publishSinglePhoto(
  pageId: string, token: string, imageBase64: string, caption: string
): Promise<string> {
  const { blob } = imageToBlob(imageBase64);
  const fd = new FormData();
  fd.append('message', caption);
  fd.append('source', blob, 'image.jpg');
  fd.append('access_token', token);

  const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
    method: 'POST', body: fd,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? JSON.stringify(json);
    throw new Error(`Facebook API: ${msg}`);
  }
  return json.id as string;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, caption = '' } = body;

    // Accept both `images[]` (new) and legacy `imageBase64` (single)
    const images: string[] = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : body.imageBase64
        ? [body.imageBase64]
        : [];

    if (!platform || images.length === 0) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // ── Facebook ──────────────────────────────────────────────────────────────
    if (platform === 'facebook') {
      const credsCookie = req.cookies.get('oauth_app_creds')?.value;
      if (!credsCookie) {
        return NextResponse.json(
          { error: 'Not connected to Facebook. Please set up your Page ID & Token in the Vault.' },
          { status: 401 }
        );
      }

      const creds = JSON.parse(await decryptToken(credsCookie));
      const fbCreds = creds.facebook;
      if (!fbCreds?.clientId || !fbCreds?.clientSecret) {
        return NextResponse.json(
          { error: 'Facebook Page ID or Access Token missing in Vault.' },
          { status: 401 }
        );
      }

      const pageId: string = fbCreds.clientId;
      const token: string  = fbCreds.clientSecret;

      // ── Single image ──────────────────────────────────────────────────────
      if (images.length === 1) {
        const postId = await publishSinglePhoto(pageId, token, images[0], caption);
        return NextResponse.json({ success: true, postId });
      }

      // ── Multi-image — Strategy A: proper Page-token carousel ──────────────
      try {
        // Step 1: stage each photo as unpublished
        const photoIds = await Promise.all(
          images.map(img => uploadUnpublishedPhoto(pageId, token, img))
        );

        // Step 2: create one feed post with all photos attached
        const feedFd = new FormData();
        feedFd.append('message', caption);
        photoIds.forEach(pid =>
          feedFd.append('attached_media[]', JSON.stringify({ media_fbid: pid }))
        );
        feedFd.append('access_token', token);

        const feedRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/feed`,
          { method: 'POST', body: feedFd }
        );
        const feedJson = await feedRes.json();

        if (!feedRes.ok) {
          const msg = feedJson?.error?.message ?? JSON.stringify(feedJson);
          throw new Error(`Carousel feed post failed: ${msg}`);
        }

        return NextResponse.json({
          success: true,
          postId: feedJson.id,
          photoCount: photoIds.length,
          method: 'carousel',
        });

      } catch (carouselErr: unknown) {
        // ── Strategy B: fallback — publish each image as an individual post ──
        // This works with any access token type.
        // Only the first image carries the caption; the rest are silent.
        console.warn(
          '[publish] Carousel (published=false) failed — falling back to individual posts.',
          carouselErr instanceof Error ? carouselErr.message : carouselErr
        );

        const postIds: string[] = [];
        for (let i = 0; i < images.length; i++) {
          const imageCaption = i === 0 ? caption : ''; // caption only on first photo
          const pid = await publishSinglePhoto(pageId, token, images[i], imageCaption);
          postIds.push(pid);
        }

        return NextResponse.json({
          success: true,
          postIds,
          photoCount: postIds.length,
          method: 'individual_fallback',
          note: 'Images posted individually — to enable carousel posts, use a Page Access Token with pages_manage_posts permission.',
        });
      }
    }

    // ── Other platforms (not yet implemented) ─────────────────────────────────
    return NextResponse.json(
      { error: `Publishing for ${platform} is not implemented yet.` },
      { status: 400 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[publish] Unhandled error:', message);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
