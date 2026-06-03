import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/oauth-token';
import { Buffer } from 'buffer';

export async function POST(req: NextRequest) {
  try {
    const { platform, imageBase64, caption } = await req.json();

    if (!platform || !imageBase64) {
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

      // Extract base64 data
      const match = imageBase64.match(/^data:image\/(png|jpeg);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid image format. Expected base64 data URI.' }, { status: 400 });
      }

      const mimeType = `image/${match[1]}`;
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });

      const formData = new FormData();
      formData.append('message', caption || '');
      formData.append('source', blob, 'image.png');
      formData.append('access_token', token);

      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
        method: 'POST',
        body: formData
      });

      if (!fbRes.ok) {
        const errorText = await fbRes.text();
        console.error('Facebook publish error:', errorText);
        let msg = errorText;
        try {
           const parsed = JSON.parse(errorText);
           if (parsed.error && parsed.error.message) msg = parsed.error.message;
        } catch {}
        return NextResponse.json({ error: `Facebook API: ${msg}` }, { status: fbRes.status });
      }

      const data = await fbRes.json();
      return NextResponse.json({ success: true, postId: data.id });
    }

    return NextResponse.json({ error: `Publishing for ${platform} is not implemented yet.` }, { status: 400 });

  } catch (err: any) {
    console.error('Publishing error:', err);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
