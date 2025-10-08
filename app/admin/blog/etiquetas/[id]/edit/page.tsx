import type { Metadata } from "next"
import { TagForm } from "@/components/admin/tag-form"

interface EditTagPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditTagPageProps): Promise<Metadata> {
  return {
    title: "Editar Etiqueta | Admin Ravehub",
    description: "Editar una etiqueta existente del blog",
  }
}

export default function EditTagPage({ params }: EditTagPageProps) {
  const { id } = params

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Etiqueta</h1>
      <TagForm tagId={id} />
    </div>
  )
}
