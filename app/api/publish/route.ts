import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';
import { Buffer } from 'buffer';

const FB_API = 'https://graph.facebook.com/v19.0';

// ── Helpers ───────────────────────────────────────────────────────────────────

function imageToBlob(imageBase64: string): Blob {
  const match = imageBase64.match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
  if (!match) throw new Error('Invalid image format. Expected a base64 data URI.');
  const buffer = Buffer.from(match[2], 'base64');
  return new Blob([buffer], { type: `image/${match[1]}` });
}

/**
 * Exchange a User Access Token for the Page Access Token.
 * Facebook requires a Page Access Token (not a User token) for Pages API writes.
 * Calls /me/accounts which lists all pages the user manages, each with its own token.
 */
async function getPageAccessToken(pageId: string, userToken: string): Promise<string> {
  const url = `${FB_API}/me/accounts?access_token=${encodeURIComponent(userToken)}&fields=id,access_token`;
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? 'Could not fetch page accounts';
    throw new Error(`FB accounts error: ${msg}`);
  }

  const pages: Array<{ id: string; access_token: string }> = json.data ?? [];
  const page = pages.find(p => p.id === pageId);

  if (!page) {
    // Token may already be a Page Access Token — return as-is
    return userToken;
  }

  return page.access_token;
}

/**
 * Upload a single photo as an UNPUBLISHED staging photo using a Page token.
 * Returns the photo ID, or throws on failure.
 */
async function uploadUnpublishedPhoto(
  pageId: string, pageToken: string, imageBase64: string
): Promise<string> {
  const fd = new FormData();
  fd.append('source', imageToBlob(imageBase64), 'image.jpg');
  fd.append('published', 'false');
  fd.append('access_token', pageToken);

  const res = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: fd });
  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? JSON.stringify(json);
    throw Object.assign(new Error(msg), { fbCode: json?.error?.code });
  }
  return json.id as string;
}

/**
 * Publish a single photo directly (caption on the post).
 */
async function publishSinglePhoto(
  pageId: string, pageToken: string, imageBase64: string, caption: string
): Promise<string> {
  const fd = new FormData();
  fd.append('message', caption);
  fd.append('source', imageToBlob(imageBase64), 'image.jpg');
  fd.append('access_token', pageToken);

  const res = await fetch(`${FB_API}/${pageId}/photos`, { method: 'POST', body: fd });
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

    // Accept both `images[]` (multi) and legacy `imageBase64` (single)
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
          { error: 'Not connected to Facebook. Please set up your Page ID & Access Token in the Vault.' },
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

      const pageId: string  = fbCreds.clientId;
      const storedToken: string = fbCreds.clientSecret;

      // Step 0: Exchange stored token for a Page Access Token.
      // This is required — the /photos endpoint rejects User Access Tokens.
      let pageToken: string;
      try {
        pageToken = await getPageAccessToken(pageId, storedToken);
      } catch {
        // If exchange fails (e.g. token already is a page token), use as-is
        pageToken = storedToken;
      }

      // ── Single image ──────────────────────────────────────────────────────
      if (images.length === 1) {
        const postId = await publishSinglePhoto(pageId, pageToken, images[0], caption);
        return NextResponse.json({ success: true, postId });
      }

      // ── Multi-image: Strategy A — Page-token carousel ─────────────────────
      try {
        const photoIds = await Promise.all(
          images.map(img => uploadUnpublishedPhoto(pageId, pageToken, img))
        );

        const feedFd = new FormData();
        feedFd.append('message', caption);
        photoIds.forEach(pid =>
          feedFd.append('attached_media[]', JSON.stringify({ media_fbid: pid }))
        );
        feedFd.append('access_token', pageToken);

        const feedRes = await fetch(`${FB_API}/${pageId}/feed`, { method: 'POST', body: feedFd });
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
        // ── Strategy B: post each image individually ───────────────────────
        console.warn(
          '[publish] Carousel fallback triggered:',
          carouselErr instanceof Error ? carouselErr.message : carouselErr
        );

        const postIds: string[] = [];
        for (let i = 0; i < images.length; i++) {
          const pid = await publishSinglePhoto(
            pageId, pageToken, images[i],
            i === 0 ? caption : '' // caption only on first photo
          );
          postIds.push(pid);
        }

        return NextResponse.json({
          success: true,
          postIds,
          photoCount: postIds.length,
          method: 'individual_fallback',
        });
      }
    }

    // ── Other platforms ───────────────────────────────────────────────────────
    return NextResponse.json(
      { error: `Publishing for ${platform} is not implemented yet.` },
      { status: 400 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[publish] Error:', message);
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
