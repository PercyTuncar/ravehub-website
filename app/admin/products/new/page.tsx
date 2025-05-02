import { ProductForm } from "@/components/admin/product-form"

export const viewport = {
  themeColor: "#000000",
}

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProductForm />
    </div>
  )
}
