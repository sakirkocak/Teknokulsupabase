'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TeacherProfile, StudentProfile, ParentProfile } from '@/types/database'

// Cache key'leri ve süreleri
const PROFILE_CACHE_KEY = 'teknokul_profile_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 dakika

// Cache yardımcı fonksiyonları
function getProfileFromCache(): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    // Cache süresi dolmuş mu kontrol et
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
      return null
    }
    return data as Profile
  } catch {
    return null
  }
}

function setProfileToCache(profile: Profile): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
      data: profile,
      timestamp: Date.now()
    }))
  } catch {
    // Storage hatası, sessizce devam et
  }
}

// Profil güncellendiğinde veya çıkış yapıldığında cache'i temizle
export function clearProfileCache(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {
    // Storage hatası, sessizce devam et
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadProfile = useCallback(async (forceRefresh = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        clearProfileCache()
        setLoading(false)
        return
      }

      // Cache'den oku (force refresh değilse)
      if (!forceRefresh) {
        const cachedProfile = getProfileFromCache()
        if (cachedProfile && cachedProfile.id === user.id) {
          setProfile(cachedProfile)
          setLoading(false)
          return
        }
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, phone, role, is_active, created_at, updated_at')
        .eq('id', user.id)
        .single()

      // Profil yoksa oluştur (trigger çalışmamış olabilir)
      if (error && error.code === 'PGRST116') {
        const role = user.user_metadata?.role || 'ogrenci'
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || ''

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            role: role,
          })
          .select()
          .single()

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Profil oluşturma hatası:', insertError)
        } else if (newProfile) {
          data = newProfile
          error = null
          
          // Role göre ek profil de oluştur
          if (role === 'ogrenci') {
            await supabase
              .from('student_profiles')
              .insert({ user_id: user.id })
              .single()
          } else if (role === 'ogretmen') {
            await supabase
              .from('teacher_profiles')
              .insert({ user_id: user.id, is_coach: true })
              .single()
          } else if (role === 'veli') {
            await supabase
              .from('parent_profiles')
              .insert({ user_id: user.id })
              .single()
          }
        }
      }

      if (error && error.code !== 'PGRST116') throw error
      
      // Profili cache'e kaydet
      if (data) {
        setProfileToCache(data)
      }
      
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // refetch her zaman fresh data çeker
  const refetch = useCallback(() => loadProfile(true), [loadProfile])

  return { profile, loading, setProfile, refetch, clearCache: clearProfileCache }
}

export function useTeacherProfile(userId: string) {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadTeacherProfile = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, headline, bio, experience_years, education, languages, hourly_rate, available_days, lesson_types, average_rating, review_count, is_coach, is_listed, video_url, certificates, specializations, teaching_style, target_students, achievements, created_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setTeacherProfile(data)
    } catch (error) {
      console.error('Error loading teacher profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadTeacherProfile()
    }
  }, [userId, loadTeacherProfile])

  return { teacherProfile, loading, refetch: loadTeacherProfile }
}

export function useStudentProfile(userId: string) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadStudentProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      let { data, error } = await supabase
        .from('student_profiles')
        .select('id, user_id, grade_level, grade, target_exam, school_name, city_id, district_id, school_id, created_at')
        .eq('user_id', userId)
        .single()

      // Öğrenci profili yoksa oluştur
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('student_profiles')
          .insert({ user_id: userId })
          .select()
          .single()

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error('Öğrenci profili oluşturma hatası:', insertError)
        } else if (newProfile) {
          data = newProfile
          error = null
        }
      }

      if (error && error.code !== 'PGRST116') throw error
      setStudentProfile(data)
    } catch (error) {
      console.error('Error loading student profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadStudentProfile()
    } else {
      setLoading(false)
    }
  }, [userId, loadStudentProfile])

  return { studentProfile, loading, refetch: loadStudentProfile }
}

export function useParentProfile(userId: string) {
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadParentProfile = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('parent_profiles')
        .select('id, user_id, phone, created_at')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setParentProfile(data)
    } catch (error) {
      console.error('Error loading parent profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      loadParentProfile()
    }
  }, [userId, loadParentProfile])

  return { parentProfile, loading, refetch: loadParentProfile }
}
