import type { Metadata } from "next"
import { CategoryList } from "@/components/store/category-list"
import { ProductFiltersWrapper } from "@/components/store/product-filters-wrapper"
import { ProductListWrapper } from "@/components/store/product-list-wrapper"
import { FeaturedProducts } from "@/components/store/featured-products"
import { StoreBanner } from "@/components/store/store-banner"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Tienda RaveHub | Productos para eventos y fiestas",
  description:
    "Explora nuestra colección de productos para tus eventos y fiestas. Encuentra todo lo que necesitas para tus celebraciones en RaveHub.",
  keywords: "tienda, productos, eventos, fiestas, rave, accesorios, ropa, decoración",
  openGraph: {
    title: "Tienda RaveHub | Productos para eventos y fiestas",
    description:
      "Explora nuestra colección de productos para tus eventos y fiestas. Encuentra todo lo que necesitas para tus celebraciones en RaveHub.",
    type: "website",
    url: "https://ravehub.com/tienda",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda RaveHub | Productos para eventos y fiestas",
    description:
      "Explora nuestra colección de productos para tus eventos y fiestas. Encuentra todo lo que necesitas para tus celebraciones en RaveHub.",
  },
}

export default function StorePage() {
  return (
    <main className="container mx-auto px-4 py-8 md:px-6">
      {/* Banner Slider */}
      <section className="mb-12">
        <StoreBanner />
      </section>

      {/* Featured Products Carousel - Desktop Only */}
      <section className="hidden md:block mb-12" aria-labelledby="featured-products-heading">
        <h2 id="featured-products-heading" className="sr-only">
          Productos destacados
        </h2>
        <FeaturedProducts />
      </section>

      {/* Categories */}
      <section className="mb-12" aria-labelledby="categories-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="categories-heading" className="text-2xl font-semibold">
            Categorías
          </h2>
        </div>
        <CategoryList />
      </section>

      <Separator className="my-8" />

      {/* Products with Filters */}
      <section aria-labelledby="products-heading">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filters - Sidebar on Desktop */}
          <div className="hidden md:block">
            <ProductFiltersWrapper />
          </div>

          {/* Product Grid */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 id="products-heading" className="text-2xl font-semibold">
                Productos
              </h2>
              {/* Filtro en móvil - Botón que abre modal */}
              <div className="md:hidden">
                <ProductFiltersWrapper />
              </div>
            </div>
            <ProductListWrapper />
          </div>
        </div>
      </section>
    </main>
  )
}
