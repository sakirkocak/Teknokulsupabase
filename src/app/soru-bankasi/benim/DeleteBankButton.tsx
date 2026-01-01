'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface DeleteBankButtonProps {
  bankId: string
  bankTitle: string
}

export default function DeleteBankButton({ bankId, bankTitle }: DeleteBankButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  
  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('question_banks')
        .delete()
        .eq('id', bankId)
      
      if (error) throw error
      
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Silme işlemi başarısız oldu')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }
  
  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Evet, Sil'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
        >
          İptal
        </button>
      </div>
    )
  }
  
  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      title="Sil"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
