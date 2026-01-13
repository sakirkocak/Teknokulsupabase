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
  const processedContent = useMemo(() => {
    let processed = rawContent

    // 1. "frac" -> "\frac" (Eğer backslash eksikse)
    // Örnek: $frac{1}{2}$ -> $\frac{1}{2}$
    // Ancak "\frac" olanları bozmamalıyız.
    // (?<!\\)frac -> backslash ile başlamayan frac'ları bul
    processed = processed.replace(/(?<!\\)frac\{/g, '\\frac{')

    // 2. "sqrt" -> "\sqrt"
    processed = processed.replace(/(?<!\\)sqrt\{/g, '\\sqrt{')

    // 3. "times" -> "\times"
    // Genellikle $ içinde olur: $2times3$ -> $2\times3$
    // Dikkat: "sometimes" gibi kelimeleri bozmamalı. 
    // Sadece $...$ blokları içinde veya rakamların arasında güvenli değişim yapabiliriz ama
    // regex ile $ bloklarını tam yakalamak zordur.
    // Basit bir yaklaşım: rakam+times veya times+rakam
    processed = processed.replace(/(\d)times/g, '$1\\times ')
    processed = processed.replace(/times(\d)/g, '\\times $1')
    
    // 4. Double backslash temizliği (JSON'dan gelirken oluşabilir)
    // \\frac -> \frac
    processed = processed.replace(/\\\\frac/g, '\\frac')
    processed = processed.replace(/\\\\sqrt/g, '\\sqrt')
    processed = processed.replace(/\\\\times/g, '\\times')
    processed = processed.replace(/\\\\cdot/g, '\\cdot')

    // 5. Kesirleri düzelt: frac12 -> \frac{1}{2} (Bozuk render pattern'i)
    // Bu çok riskli olabilir, sadece çok belirgin desenleri düzeltelim
    // Örnek: frac29 -> \frac{2}{9} (tek haneli)
    processed = processed.replace(/(?<!\\)frac(\d)(\d)/g, '\\frac{$1}{$2}')

    return processed
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
