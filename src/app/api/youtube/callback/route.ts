import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Kod bulunamadı' }, { status: 400 });
  }
  
  try {
    // Code'u token'a çevir
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        redirect_uri: process.env.YOUTUBE_REDIRECT_URI || 'https://teknokul.com.tr/api/youtube/callback',
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      return NextResponse.json({ error: tokens.error_description }, { status: 400 });
    }
    
    // Refresh token'ı göster
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>YouTube Bağlantısı Başarılı!</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #0a0a1a; color: white; }
          .success { background: #10b981; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
          .token-box { background: #1a1a2e; padding: 20px; border-radius: 10px; word-break: break-all; }
          code { background: #2a2a4e; padding: 5px 10px; border-radius: 5px; display: block; margin: 10px 0; }
          .warning { background: #f59e0b; color: black; padding: 15px; border-radius: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✅ YouTube Bağlantısı Başarılı!</h1>
          <p>Aşağıdaki refresh token'ı .env.local ve Vercel'e ekleyin.</p>
        </div>
        
        <div class="token-box">
          <h3>🔑 Refresh Token:</h3>
          <code>${tokens.refresh_token || 'Refresh token alınamadı - tekrar deneyin'}</code>
          
          <h3>📋 .env.local'a eklenecek satır:</h3>
          <code>YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}</code>
        </div>
        
        <div class="warning">
          <strong>⚠️ ÖNEMLİ:</strong> Bu token'ı güvenli bir yerde saklayın ve kimseyle paylaşmayın!
        </div>
        
        <p style="margin-top: 30px; color: #9ca3af;">
          Access Token: ${tokens.access_token ? '✅ Alındı' : '❌ Alınamadı'}<br>
          Expires In: ${tokens.expires_in} saniye
        </p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    
  } catch (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.json({ error: 'Token alınamadı' }, { status: 500 });
  }
}
