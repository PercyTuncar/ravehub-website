"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function ProductTemplateDownload() {
  // Example product template with all possible fields
  const productTemplate = {
    products: [
      {
        // Required fields
        name: "Example Product",
        slug: "example-product",
        shortDescription: "A short description of the product",
        description: "<p>A detailed description of the product with HTML formatting</p>",
        categoryId: "REPLACE_WITH_ACTUAL_CATEGORY_ID", // Instrucción clara para reemplazar
        // New field for subcategory support
        subcategoryId: "", // Optional: ID of a subcategory if applicable
        price: 99.99,
        currency: "PEN", // Default currency code
        stock: 100,
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
        hasVariants: false,
        gender: "unisex", // "male", "female", or "unisex"
        isActive: true,

        // Optional fields
        discountPercentage: 10, // 0-100
        sku: "SKU123456",
        brand: "Ravehub",
        isHighlighted: false,
        videoUrl: "https://www.youtube.com/watch?v=example",

        // Specifications (optional)
        specifications: [
          { name: "Material", value: "Cotton" },
          { name: "Weight", value: "200g" },
        ],

        // Shipping details (optional)
        shippingDetails: {
          shippingRate: 10,
          shippingCurrency: "PEN",
          eligibleRegion: "Latinoamérica",
        },

        // Eligible regions (optional)
        eligibleRegions: ["Peru", "Colombia", "Mexico"],

        // Image alt texts (optional)
        imageAltTexts: {
          // Corregido de imagesAltTexts a imageAltTexts para coincidir con el esquema
          "https://example.com/image1.jpg": "Front view of the product",
          "https://example.com/image2.jpg": "Back view of the product",
        },

        // Variants (only if hasVariants is true)
        variants: [
          {
            type: "size", // "size", "color", or "style"
            name: "Small",
            additionalPrice: 0,
            stock: 30,
            sku: "SKU123456-S",
            isActive: true,
          },
          {
            type: "size",
            name: "Medium",
            additionalPrice: 5,
            stock: 40,
            sku: "SKU123456-M",
            isActive: true,
          },
          {
            type: "size",
            name: "Large",
            additionalPrice: 10,
            stock: 30,
            sku: "SKU123456-L",
            isActive: true,
          },
        ],

        // Videos (optional)
        videos: [
          {
            url: "https://www.youtube.com/watch?v=example",
            thumbnailUrl: "https://example.com/thumbnail.jpg",
            isExternal: true,
            provider: "youtube",
            videoId: "example",
            title: "Product Demo",
            description: "Watch how to use this product",
          },
        ],
      },
      // You can add more example products here
    ],
    // Add a categories section to the template with clearer instructions
    categories: [
      {
        name: "Example Category",
        slug: "example-category",
        description: "A description of the category",
        isActive: true,
        order: 0,
        isSubcategory: false,
        parentCategoryId: "", // Vacío para categorías principales
        subcategories: [], // Array vacío para nuevas categorías
      },
      {
        name: "Example Subcategory",
        slug: "example-subcategory",
        description: "A description of the subcategory",
        isActive: true,
        order: 0,
        isSubcategory: true,
        parentCategoryId: "REPLACE_WITH_PARENT_CATEGORY_ID", // Instrucción clara para reemplazar
      },
    ],
    // Agregar instrucciones para el usuario
    _instructions: {
      general: "Reemplaza los valores de ejemplo con tus datos reales antes de importar.",
      categories:
        "Primero importa las categorías principales, luego obtén sus IDs para usarlos en las subcategorías y productos.",
      categoryId: "Reemplaza 'REPLACE_WITH_ACTUAL_CATEGORY_ID' con el ID real de la categoría.",
      parentCategoryId: "Reemplaza 'REPLACE_WITH_PARENT_CATEGORY_ID' con el ID real de la categoría.",
    },
  }

  const handleDownload = () => {
    try {
      // Convert the template to a JSON string with pretty formatting
      const jsonString = JSON.stringify(productTemplate, null, 2)

      // Create a blob from the JSON string
      const blob = new Blob([jsonString], { type: "application/json" })

      // Create a URL for the blob
      const url = URL.createObjectURL(blob)

      // Create a temporary anchor element
      const a = document.createElement("a")
      a.href = url
      a.download = "product-template.json"

      // Trigger the download
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Plantilla descargada",
        description: "La plantilla de productos ha sido descargada correctamente",
      })
    } catch (error) {
      console.error("Error downloading template:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al descargar la plantilla",
        variant: "destructive",
      })
    }
  }

  return (
    <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      <span>Descargar plantilla JSON</span>
    </Button>
  )
}
