import { BannerForm } from "@/components/admin/banner-form"

export const metadata = {
  title: "Editar Banner | Ravehub Admin",
  description: "Edita un banner existente de la tienda",
}

interface EditBannerPageProps {
  params: {
    id: string
  }
}

export default function EditBannerPage({ params }: EditBannerPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Banner</h1>
      <BannerForm bannerId={params.id} />
    </div>
  )
}
