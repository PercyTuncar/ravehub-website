import { CTAForm } from "@/components/admin/cta-form"
import { getCTAById } from "@/lib/firebase/ctas"
import { notFound } from "next/navigation"

interface EditCTAPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditCTAPageProps) {
  const cta = await getCTAById(params.id)

  if (!cta) {
    return {
      title: "CTA no encontrado | Ravehub",
      description: "El CTA que buscas no existe o ha sido eliminado.",
    }
  }

  return {
    title: `Editar CTA: ${cta.title} | Ravehub`,
    description: "Editar Call to Action personalizado para eventos",
  }
}

export default async function EditCTAPage({ params }: EditCTAPageProps) {
  const cta = await getCTAById(params.id)

  if (!cta) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar CTA: {cta.title}</h1>
      <CTAForm cta={cta} />
    </div>
  )
}
