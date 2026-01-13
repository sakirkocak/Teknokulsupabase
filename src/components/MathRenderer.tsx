'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'

interface MathRendererProps {
  text?: string
  content?: string
  className?: string
}

export default function MathRenderer({ text, content, className = '' }: MathRendererProps) {
  // text veya content prop'unu al
  const rawContent = text || content || ''

  // İçerik yoksa boş dön
  if (!rawContent) {
    return null
  }

  // Pre-processing: Bazı temel düzeltmeler (gerekirse)
  // Ancak eski zararlı replace'leri yapmıyoruz.
  // Sadece satır sonlarını ve boşlukları düzenleyebiliriz.
  const processedContent = useMemo(() => {
    // Çift dolar ($$) bloklarını react-markdown'un anlayacağı formata çevirmek gerekebilir
    // Ancak remark-math genellikle $$...$$ ve $...$ destekler.
    // Yine de bazı durumlarda \n ile ayırmak gerekebilir.
    return rawContent
  }, [rawContent])

  return (
    <div className={`math-renderer prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // Özel bileşenler eklenebilir
          // Örn: linkler yeni sekmede açılsın
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
          // Tablolar için stil
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200 border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
