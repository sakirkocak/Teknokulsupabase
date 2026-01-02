'use client'

/**
 * TeknoÖğretmen Live - Tam Ekran Sesli Ders
 * Gemini Live API ile gerçek zamanlı sohbet
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TeknoTeacherLive from '@/components/TeknoTeacher/TeknoTeacherLive'
import { Loader2 } from 'lucide-react'

export default function TeknoOgretmenLivePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [studentName, setStudentName] = useState('Şakir')  // Hardcoded for testing
  const [grade, setGrade] = useState(8)
  const [error, setError] = useState<string | null>(null)
  
  // Kullanıcı bilgilerini al
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/giris')
          return
        }
        
        // Profil bilgilerini al
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, grade')
          .eq('id', user.id)
          .single()
        
        setStudentName(profile?.full_name || 'Öğrenci')
        setGrade(profile?.grade || 8)
        setIsLoading(false)
        
      } catch (err: any) {
        console.error('Load error:', err)
        setError(err.message)
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [router])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="text-purple-400 hover:underline"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      {/* Arka plan efekti */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_50%)]" />
      </div>
      
      {/* Live bileşeni - merkeze konumlandırılmış */}
      <div className="relative z-10">
        <TeknoTeacherLive
          studentName={studentName}
          grade={grade}
          onClose={() => router.push('/')}
        />
      </div>
      
      {/* Bilgi */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500">
        <p>🤖 OpenAI GPT-4o + TTS-HD</p>
        <p>Yüksek kaliteli AI eğitim asistanı</p>
      </div>
    </div>
  )
}
