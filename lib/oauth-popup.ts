import { NextResponse } from 'next/server';

export function oauthPopupResponse(result: { connected?: string; error?: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Authentication Complete</title></head>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px; background: #0f172a; color: white;">
        <h3>Authentication complete.</h3>
        <p style="color: #94a3b8">This window should close automatically.</p>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'oauth_complete', 
                connected: '${result.connected || ''}', 
                error: '${result.error || ''}' 
              }, '*');
            }
          } catch(e) {}
          setTimeout(() => {
            window.close();
          }, 100);
        </script>
      </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
