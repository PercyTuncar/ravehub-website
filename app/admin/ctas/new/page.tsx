import { CTAForm } from "@/components/admin/cta-form"

export const metadata = {
  title: "Nuevo CTA | RaveHub",
  description: "Crear un nuevo Call to Action personalizado para eventos",
}

export default function NewCTAPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Crear nuevo CTA</h1>
      <CTAForm />
    </div>
  )
}
