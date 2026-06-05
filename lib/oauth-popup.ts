import { NextResponse } from 'next/server';

export function oauthPopupResponse(result: { connected?: string; error?: string }) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Authentication Complete</title></head>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px; background: #0f172a; color: white;">
        <h3>Authentication complete!</h3>
        <p style="color: #94a3b8">Saving your connection securely...</p>
        <p style="color: #64748b; font-size: 0.9em;">This window will close automatically in a moment.</p>
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
          // Give the browser plenty of time to commit the HTTP Set-Cookie header
          setTimeout(() => {
            window.close();
          }, 1500);
        </script>
      </body>
    </html>
  `;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
