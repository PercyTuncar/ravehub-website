"use client"

interface SeoPreviewProps {
  title: string
  description: string
  url: string
}

export function SeoPreview({ title, description, url }: SeoPreviewProps) {
  const displayTitle = title || "Título del artículo"
  const displayDescription = description || "Descripción del artículo..."
  const displayUrl = url || "https://ravehub.es/blog/titulo-del-articulo"

  return (
    <div className="border rounded-md p-4 mt-2 bg-white">
      <div className="text-xl text-blue-800 font-medium line-clamp-1">{displayTitle}</div>
      <div className="text-green-700 text-sm line-clamp-1">{displayUrl}</div>
      <div className="text-gray-600 text-sm mt-1 line-clamp-2">{displayDescription}</div>
    </div>
  )
}
