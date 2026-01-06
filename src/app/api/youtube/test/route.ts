/**
 * YouTube API Test - Credentials kontrolü
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    credentials: {
      hasClientId: !!process.env.YOUTUBE_CLIENT_ID,
      hasClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
      hasRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
      clientIdPrefix: process.env.YOUTUBE_CLIENT_ID?.slice(0, 20) + '...'
    },
    tests: {}
  }
  
  try {
    // 1. OAuth client oluştur
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    )
    
    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    })
    
    results.tests.oauthClient = '✓ Oluşturuldu'
    
    // 2. Access token al
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      results.tests.accessToken = '✓ Alındı'
      results.tests.tokenExpiry = credentials.expiry_date
    } catch (tokenError: any) {
      results.tests.accessToken = `✗ Hata: ${tokenError.message}`
      return NextResponse.json(results, { status: 500 })
    }
    
    // 3. YouTube API'ye bağlan
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    results.tests.youtubeClient = '✓ Oluşturuldu'
    
    // 4. Kanal bilgisini al (test)
    try {
      const channelResponse = await youtube.channels.list({
        part: ['snippet', 'statistics'],
        mine: true
      })
      
      const channel = channelResponse.data.items?.[0]
      if (channel) {
        results.tests.channel = '✓ Bağlandı'
        results.channelInfo = {
          id: channel.id,
          title: channel.snippet?.title,
          subscriberCount: channel.statistics?.subscriberCount,
          videoCount: channel.statistics?.videoCount
        }
      } else {
        results.tests.channel = '✗ Kanal bulunamadı'
      }
    } catch (channelError: any) {
      results.tests.channel = `✗ Hata: ${channelError.message}`
    }
    
    results.success = true
    return NextResponse.json(results)
    
  } catch (error: any) {
    results.error = error.message
    results.success = false
    return NextResponse.json(results, { status: 500 })
  }
}
