'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { Camera, Loader2, X, Upload } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  fullName: string | undefined
  onUploadComplete: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  fullName,
  onUploadComplete,
  size = 'lg'
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-3xl',
  }

  const buttonSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalı')
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir')
      return
    }

    // Önizleme oluştur
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Yükle
    await uploadFile(file)
  }

  async function uploadFile(file: File) {
    setUploading(true)

    try {
      // Eski avatarı sil (varsa)
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1]
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }

      // Dosya adı oluştur
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`

      // Yükle
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Profili güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onUploadComplete(publicUrl)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('Yükleme hatası: ' + error.message)
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  function handleClick() {
    fileInputRef.current?.click()
  }

  function handleRemove() {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Avatar */}
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold overflow-hidden shadow-lg`}>
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(fullName)
          )}
          
          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload button */}
        <button
          onClick={handleClick}
          disabled={uploading}
          className={`absolute -bottom-1 -right-1 ${buttonSizeClasses[size]} bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50`}
        >
          <Camera className="w-1/2 h-1/2" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Helper text */}
      <p className="text-xs text-surface-500 mt-3 text-center">
        Tıklayarak fotoğraf yükle<br />
        (Max 5MB, JPG/PNG)
      </p>
    </div>
  )
}



