import { getAllCategories } from "@/lib/firebase/products"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categorías de Productos | Tienda RaveHub",
  description:
    "Explora todas las categorías de productos disponibles en la tienda RaveHub. Encuentra lo que necesitas para tus eventos y fiestas.",
  keywords: "categorías, productos, tienda, eventos, fiestas, rave",
  openGraph: {
    title: "Categorías de Productos | Tienda RaveHub",
    description: "Explora todas las categorías de productos disponibles en la tienda RaveHub.",
    type: "website",
    url: "https://ravehub.com/tienda/categorias",
  },
}

export default async function CategoriesPage() {
  const categories = await getAllCategories()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Categorías de Productos</h1>
        <p className="text-muted-foreground">
          Explora nuestra amplia selección de categorías y encuentra exactamente lo que estás buscando
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link key={category.id} href={`/tienda/categorias/${category.slug}`} passHref>
            <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
              <div className="relative aspect-square">
                <Image
                  src={category.imageUrl || "/placeholder.svg?height=300&width=300"}
                  alt={category.imageAltText || category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <CardContent className="p-4 text-white">
                    <h2 className="text-xl font-bold">{category.name}</h2>
                    {category.description && (
                      <p className="text-sm mt-1 line-clamp-2 text-white/80">{category.description}</p>
                    )}
                  </CardContent>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
