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

  // Pre-processing: Frontend tarafında render sorunlarını düzelt
  // Bu kısım veritabanındaki veriyi değiştirmeden sadece gösterimi düzeltir
  const processedContent = useMemo(() => {
    let processed = rawContent

    // 1. "frac" -> "\frac" (Eğer backslash eksikse ve önünde \ yoksa)
    // Örnek: $frac{1}{2}$ -> $\frac{1}{2}$
    // Ancak "\frac" olanları bozmamalıyız.
    processed = processed.replace(/(?<!\\)frac\{/g, '\\frac{')

    // 2. "sqrt" -> "\sqrt"
    processed = processed.replace(/(?<!\\)sqrt\{/g, '\\sqrt{')

    // 3. "times" -> "\times"
    // $ blokları içindeki times kelimelerini \times yapmaya çalışalım
    // Dikkat: "sometimes" gibi kelimeleri bozmamak için boşluk veya rakam kontrolü
    // Bu regex: rakam+times veya times+rakam veya boşluk+times+boşluk desenlerini yakalar
    // $...$ bağlamını tam kontrol edemediğimiz için global replace riskli olabilir
    // Ancak matematiksel metinlerde "times" genellikle çarpma anlamında kullanılır
    
    // Rakamdan sonra gelen times (örn: 2times3)
    processed = processed.replace(/(\d)\s*times\s*/g, '$1\\times ')
    // Times'tan sonra gelen rakam (örn: times3)
    processed = processed.replace(/\s*times\s*(\d)/g, ' \\times$1')
    
    // 4. Double backslash temizliği (JSON'dan gelirken oluşabilir)
    // \\frac -> \frac
    // Not: Bazen \\ gerekebilir (newline gibi), o yüzden sadece latex komutlarını hedefliyoruz
    processed = processed.replace(/\\\\frac/g, '\\frac')
    processed = processed.replace(/\\\\sqrt/g, '\\sqrt')
    processed = processed.replace(/\\\\times/g, '\\times')
    processed = processed.replace(/\\\\cdot/g, '\\cdot')
    processed = processed.replace(/\\\\pi/g, '\\pi')
    processed = processed.replace(/\\\\alpha/g, '\\alpha')
    processed = processed.replace(/\\\\beta/g, '\\beta')
    processed = processed.replace(/\\\\theta/g, '\\theta')

    // 5. Kesirleri düzelt: frac12 -> \frac{1}{2} (Bozuk render pattern'i)
    // Örnek: frac29 -> \frac{2}{9} (sadece tek haneli sayılar için güvenli)
    processed = processed.replace(/(?<!\\)frac\s*(\d)\s*(\d)(?!\d)/g, '\\frac{$1}{$2}')

    return processed
  }, [rawContent])

  return (
    <div className={`math-renderer prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          // Linkler yeni sekmede açılsın
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 underline" {...props} />
          ),
          // Tablolar için stil
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-surface-200 dark:border-surface-700">
              <table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-surface-50 dark:bg-surface-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider border-b dark:border-surface-700" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 dark:text-surface-300 border-b dark:border-surface-700" {...props} />
          ),
          // Paragraflar
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0 leading-relaxed" {...props} />
          ),
          // Listeler
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside ml-5 mb-4 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside ml-5 mb-4 space-y-1" {...props} />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
