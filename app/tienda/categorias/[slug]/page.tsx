import { getCategoryBySlug, getProductsByCategory, getCategoryById } from "@/lib/firebase/products"
import { ProductList } from "@/components/store/product-list"
import { CategoryList } from "@/components/store/category-list"
import { ProductFiltersWrapper } from "@/components/store/product-filters-wrapper"
import { CategorySchema } from "@/components/store/category-schema"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { ProductCategory } from "@/lib/firebase/types"
import Link from "next/link"
import Image from "next/image"

interface CategoryPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    return {
      title: "Categoría no encontrada | RaveHub",
      description: "La categoría que buscas no existe o ha sido eliminada",
    }
  }

  // Use SEO fields if available, otherwise use category name/description
  const title = category.seoTitle || `${category.name} | Tienda RaveHub`
  const description =
    category.seoDescription || category.description || `Explora nuestra colección de ${category.name} en RaveHub`

  // Prepare keywords
  const keywords = category.seoKeywords || []

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      images: category.imageUrl ? [category.imageUrl] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.imageUrl ? [category.imageUrl] : [],
    },
  }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    notFound()
  }

  // Fetch subcategories if this is a parent category
  let subcategories: ProductCategory[] = []
  if (category && !category.isSubcategory && category.subcategories && category.subcategories.length > 0) {
    const subcatsPromises = category.subcategories.map((id) => getCategoryById(id))
    subcategories = (await Promise.all(subcatsPromises)).filter(Boolean) as ProductCategory[]
  }

  // Fetch parent category if this is a subcategory
  let parentCategory: ProductCategory | null = null
  if (category && category.isSubcategory && category.parentCategoryId) {
    parentCategory = await getCategoryById(category.parentCategoryId)
  }

  // Get products count for structured data
  const products = await getProductsByCategory(category.id)
  const productCount = products.length

  return (
    <>
      {/* Add JSON-LD structured data */}
      <CategorySchema
        category={category}
        productCount={products.length}
        products={products}
        parentCategory={parentCategory || undefined}
        subcategories={subcategories}
      />

      <div className="container mx-auto px-4 py-8">
        {parentCategory && (
          <div className="mb-4 flex items-center text-sm text-muted-foreground">
            <Link href="/tienda/categorias" className="hover:text-foreground">
              Categorías
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tienda/categorias/${parentCategory.slug}`} className="hover:text-foreground">
              {parentCategory.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{category.name}</span>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>

          {category.description && <p className="text-muted-foreground mb-4">{category.description}</p>}
        </div>

        {subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Subcategorías</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((subcat) => (
                <Link
                  key={subcat.id}
                  href={`/tienda/categorias/${subcat.slug}`}
                  className="p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  {subcat.imageUrl && (
                    <div className="relative w-full aspect-square mb-2">
                      <Image
                        src={subcat.imageUrl || "/placeholder.svg"}
                        alt={subcat.imageAltText || subcat.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}
                  <h3 className="font-medium">{subcat.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="sticky top-20">
              <CategoryList activeCategorySlug={params.slug} />
              <ProductFiltersWrapper />
            </div>
          </div>

          <div className="md:col-span-3">
            <ProductList categoryId={category.id} />
          </div>
        </div>
      </div>
    </>
  )
}
