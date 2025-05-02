import Link from "next/link"
import { Tag } from "lucide-react"

// Definir la interfaz para el objeto de etiqueta
interface TagObject {
  id?: string
  name: string
  slug: string
  color?: string
  // Otros campos opcionales que podrían estar presentes
  description?: string
  imageUrl?: string
  featured?: boolean
  // etc.
}

interface PostTagsProps {
  tags: (string | TagObject)[]
}

export function PostTags({ tags }: PostTagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  // Función auxiliar para procesar cada etiqueta
  const processTag = (tag: string | TagObject) => {
    const isObject = typeof tag !== "string"
    return {
      name: isObject ? (tag as TagObject).name : tag,
      slug: isObject ? (tag as TagObject).slug : (tag as string).toLowerCase().replace(/\s+/g, "-"),
      color: isObject ? (tag as TagObject).color : undefined,
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <Tag size={16} className="text-gray-500" />
      {tags.map((tag, index) => {
        const { name, slug, color } = processTag(tag)

        return (
          <Link
            key={index}
            href={`/blog/etiquetas/${slug}`}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors flex items-center gap-1.5"
          >
            {color && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
            )}
            {name}
          </Link>
        )
      })}
    </div>
  )
}
