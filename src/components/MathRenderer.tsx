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
    
    // 4. Çoklu backslash temizliği (JSON encoding, DB escape vb.)
    // \\frac, \\\frac, \\\\frac -> \frac
    // Bilinen LaTeX komutlarından önceki fazla backslash'leri tek'e indir
    processed = processed.replace(/\\{2,}(frac|sqrt|times|cdot|pi|alpha|beta|gamma|theta|omega|sigma|lambda|mu|delta|Delta|circ|approx|text|begin|end|left|right|rightarrow|div|neq|leq|geq|infty|sum|prod|int|log|ln|sin|cos|tan|lim|pm|mp)/g, '\\$1')

    // 5. Kesirleri düzelt: frac12 -> \frac{1}{2} (Bozuk render pattern'i)
    // Örnek: frac29 -> \frac{2}{9} (sadece tek haneli sayılar için güvenli)
    processed = processed.replace(/(?<!\\)frac\s*(\d)\s*(\d)(?!\d)/g, '\\frac{$1}{$2}')

    // 6. Environment düzeltmeleri (begin, end, cases, text vb.)
    processed = processed.replace(/(?<!\\)begin\{/g, '\\begin{')
    processed = processed.replace(/(?<!\\)end\{/g, '\\end{')
    processed = processed.replace(/(?<!\\)text\{/g, '\\text{')
    processed = processed.replace(/(?<!\\)left\{/g, '\\left{')
    processed = processed.replace(/(?<!\\)right\}/g, '\\right}')

    // 7. Spesifik bozuk komut düzeltmeleri (ightarrow, ext, rac vb.)
    // ightarrow -> \rightarrow
    processed = processed.replace(/ightarrow/g, '\\rightarrow')
    // ext -> \text (sadece rakam veya boşluktan sonra gelen)
    processed = processed.replace(/(\d)\s*ext/g, '$1 \\text')
    processed = processed.replace(/\s+ext\{/g, ' \\text{')
    // rac -> \frac (standalone, kelime içinde değil: brace, trace vb. koruma)
    processed = processed.replace(/(?<![a-zA-Z\\])rac(?![a-zA-Z])/g, '\\frac')
    // imes -> \times (standalone, sometimes vb. koruma)
    processed = processed.replace(/(?<![a-zA-Z\\])imes(?![a-zA-Z])/g, '\\times')
    // div -> \div (sadece rakamdan önce)
    processed = processed.replace(/(?<![a-zA-Z\\])div(\d)/g, '\\div $1')

    // Greek letters ve semboller - word boundary ile (Türkçe kelimeleri bozmaz)
    processed = processed.replace(/(?<!\\)\bDelta\b/g, '\\Delta')
    processed = processed.replace(/(?<!\\)\bcirc\b/g, '^\\circ')
    processed = processed.replace(/(?<!\\)\bapprox\b/g, '\\approx')
    processed = processed.replace(/(?<!\\)\bmu\b/g, '\\mu')
    processed = processed.replace(/(?<!\\)\blambda\b/g, '\\lambda')
    processed = processed.replace(/(?<!\\)\bsigma\b/g, '\\sigma')
    processed = processed.replace(/(?<!\\)\balpha\b/g, '\\alpha')
    processed = processed.replace(/(?<!\\)\bbeta\b/g, '\\beta')
    processed = processed.replace(/(?<!\\)\btheta\b/g, '\\theta')
    processed = processed.replace(/(?<!\\)\bomega\b/g, '\\omega')
    // pi: Çok riskli (piyano, piknik, api vb.) - sadece $ blokları içinde veya standalone
    // $ içindeki pi'leri yakala: rakam/boşluk/operatör yanındaki pi
    processed = processed.replace(/(?<![a-zA-Z\\])pi(?![a-zA-Z])/g, '\\pi')

    // 8. Gereksiz backslash temizliği (\f -> f, \t -> t, \n -> n)
    // Sadece tek harfli ve arkasında boşluk/rakam olanları hedefliyoruz
    // frac, text, times gibi komutları bozmamalıyız
    processed = processed.replace(/\\f(\W)/g, 'f$1')
    processed = processed.replace(/\\t(\W)/g, 't$1')
    processed = processed.replace(/\\n(\W)/g, 'n$1') // \n (newline) ile karışabilir, dikkatli olalım.
    // Newline (\n) genelde string içinde gerçek newline'dır, LaTeX komutu değildir.
    // Ancak formül içinde \n varsa n olarak düzeltelim.

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
