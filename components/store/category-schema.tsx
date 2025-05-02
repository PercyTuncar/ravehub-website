import type { ProductCategory, Product } from "@/types"

interface CategorySchemaProps {
  category: ProductCategory
  productCount: number
  products?: Product[]
  parentCategory?: ProductCategory
  subcategories?: ProductCategory[]
}

export function CategorySchema({
  category,
  productCount,
  products = [],
  parentCategory,
  subcategories = [],
}: CategorySchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehub.com"

  // Create the basic structured data
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.seoTitle || category.name,
    description: category.seoDescription || category.description,
    url: `${baseUrl}/tienda/categorias/${category.slug}`,
    numberOfItems: productCount,
  }

  // Add parent category relationship if this is a subcategory
  if (category.isSubcategory && parentCategory) {
    structuredData.breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: parentCategory.name,
          item: `${baseUrl}/tienda/categorias/${parentCategory.slug}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: category.name,
          item: `${baseUrl}/tienda/categorias/${category.slug}`,
        },
      ],
    }
  }

  // Add subcategories if this is a parent category
  if (!category.isSubcategory && subcategories.length > 0) {
    structuredData.hasPart = subcategories.map((subcat) => ({
      "@type": "CollectionPage",
      name: subcat.name,
      url: `${baseUrl}/tienda/categorias/${subcat.slug}`,
    }))
  }

  // Add products to the schema
  if (products.length > 0) {
    structuredData.mainEntity = {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          url: `${baseUrl}/tienda/${product.slug}`,
          ...(product.images &&
            product.images.length > 0 && {
              image: product.images[0],
            }),
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency || "MXN",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        },
      })),
    }
  } else {
    structuredData.mainEntity = {
      "@type": "ItemList",
      itemListElement: {
        "@type": "ListItem",
        position: 1,
        url: `${baseUrl}/tienda/categorias/${category.slug}`,
      },
    }
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
