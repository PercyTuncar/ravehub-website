import { BannerForm } from "@/components/admin/banner-form"

export const metadata = {
  title: "Nuevo Banner | RaveHub Admin",
  description: "Crea un nuevo banner para la tienda",
}

export default function NewBannerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Banner</h1>
      <BannerForm />
    </div>
  )
}
