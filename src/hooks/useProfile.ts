'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TeacherProfile, StudentProfile, ParentProfile } from '@/types/database'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setProfile(data)
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  return { profile, loading, setProfile }
}

export function useTeacherProfile(userId: string) {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getTeacherProfile() {
      try {
        const { data, error } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setTeacherProfile(data)
      } catch (error) {
        console.error('Error loading teacher profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      getTeacherProfile()
    }
  }, [userId])

  return { teacherProfile, loading }
}

export function useStudentProfile(userId: string) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getStudentProfile() {
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setStudentProfile(data)
      } catch (error) {
        console.error('Error loading student profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      getStudentProfile()
    }
  }, [userId])

  return { studentProfile, loading }
}

export function useParentProfile(userId: string) {
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getParentProfile() {
      try {
        const { data, error } = await supabase
          .from('parent_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        setParentProfile(data)
      } catch (error) {
        console.error('Error loading parent profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      getParentProfile()
    }
  }, [userId])

  return { parentProfile, loading }
}

