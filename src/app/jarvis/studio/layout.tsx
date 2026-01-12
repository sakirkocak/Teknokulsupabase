/**
 * Jarvis Studio Layout
 * Tam ekran, navbar olmadan
 */

export default function JarvisStudioLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}
