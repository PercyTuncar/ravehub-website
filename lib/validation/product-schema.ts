// Actualizar la validación para manejar mejor las relaciones entre categorías y subcategorías

// Product validation schema
export const productValidationSchema = {
  // Required fields
  required: [
    "name",
    "slug",
    "shortDescription",
    "description",
    "categoryId",
    "price",
    "currency",
    "stock",
    "images",
    "hasVariants",
    "gender",
    "isActive",
  ],

  // Field types and constraints
  types: {
    name: { type: "string", minLength: 3, maxLength: 100 },
    slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
    shortDescription: { type: "string", maxLength: 200 },
    description: { type: "string" },
    categoryId: { type: "string" },
    subcategoryId: { type: "string" }, // Añadido explícitamente
    price: { type: "number", min: 0 },
    currency: { type: "string", enum: ["PEN", "USD", "EUR"] },
    stock: { type: "number", min: 0, integer: true },
    images: { type: "array", minItems: 1 },
    hasVariants: { type: "boolean" },
    gender: { type: "string", enum: ["male", "female", "unisex"] },
    isActive: { type: "boolean" },

    // Optional fields
    discountPercentage: { type: "number", min: 0, max: 100 },
    sku: { type: "string" },
    brand: { type: "string" },
    isHighlighted: { type: "boolean" },
    videoUrl: { type: "string" },
    specifications: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "value"],
        properties: {
          name: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    shippingDetails: {
      type: "object",
      required: ["shippingRate", "shippingCurrency", "eligibleRegion"],
      properties: {
        shippingRate: { type: "number", min: 0 },
        shippingCurrency: { type: "string" },
        eligibleRegion: { type: "string" },
      },
    },
    eligibleRegions: { type: "array", items: { type: "string" } },
    imageAltTexts: { type: "object" }, // Corregido de imagesAltTexts a imageAltTexts
    variants: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "name", "additionalPrice", "stock", "sku", "isActive"],
        properties: {
          type: { type: "string", enum: ["size", "color", "style"] },
          name: { type: "string" },
          additionalPrice: { type: "number", min: 0 },
          stock: { type: "number", min: 0, integer: true },
          sku: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
    },
    videos: {
      type: "array",
      items: {
        type: "object",
        required: ["url", "thumbnailUrl", "isExternal"],
        properties: {
          url: { type: "string" },
          thumbnailUrl: { type: "string" },
          isExternal: { type: "boolean" },
          provider: { type: "string" },
          videoId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
  },
}

// Validate a product against the schema
export function validateProduct(product: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  for (const field of productValidationSchema.required) {
    if (product[field] === undefined || product[field] === null) {
      errors.push(`Campo requerido: ${field}`)
    }
  }

  // Validación especial para categoryId
  if (product.categoryId === "REPLACE_WITH_ACTUAL_CATEGORY_ID") {
    errors.push("Debes reemplazar el valor de ejemplo 'REPLACE_WITH_ACTUAL_CATEGORY_ID' con un ID de categoría real")
  }

  // Validación especial para subcategoryId si está presente
  if (product.subcategoryId && product.subcategoryId === "REPLACE_WITH_ACTUAL_SUBCATEGORY_ID") {
    errors.push(
      "Debes reemplazar el valor de ejemplo 'REPLACE_WITH_ACTUAL_SUBCATEGORY_ID' con un ID de subcategoría real",
    )
  }

  // Check field types and constraints
  for (const [field, value] of Object.entries(product)) {
    const schema = productValidationSchema.types[field as keyof typeof productValidationSchema.types]

    if (!schema) {
      // No reportamos error para _instructions o campos desconocidos que empiezan con _
      if (!field.startsWith("_")) {
        errors.push(`Campo desconocido: ${field}`)
      }
      continue
    }

    // Type checking
    if (schema.type === "string" && typeof value !== "string") {
      errors.push(`${field} debe ser una cadena de texto`)
    } else if (schema.type === "number" && typeof value !== "number") {
      errors.push(`${field} debe ser un número`)
    } else if (schema.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${field} debe ser un booleano`)
    } else if (schema.type === "array" && !Array.isArray(value)) {
      errors.push(`${field} debe ser un array`)
    } else if (schema.type === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
      errors.push(`${field} debe ser un objeto`)
    }

    // String constraints
    if (typeof value === "string" && schema.type === "string") {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${field} debe tener al menos ${schema.minLength} caracteres`)
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${field} debe tener como máximo ${schema.maxLength} caracteres`)
      }
      if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${field} no tiene un formato válido`)
      }
      if (schema.enum !== undefined && !schema.enum.includes(value)) {
        errors.push(`${field} debe ser uno de: ${schema.enum.join(", ")}`)
      }
    }

    // Number constraints
    if (typeof value === "number" && schema.type === "number") {
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${field} debe ser mayor o igual a ${schema.min}`)
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${field} debe ser menor o igual a ${schema.max}`)
      }
      if (schema.integer === true && !Number.isInteger(value)) {
        errors.push(`${field} debe ser un número entero`)
      }
    }

    // Array constraints
    if (Array.isArray(value) && schema.type === "array") {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push(`${field} debe tener al menos ${schema.minItems} elementos`)
      }

      // Validate array items
      if (schema.items && typeof schema.items === "object") {
        value.forEach((item, index) => {
          if (schema.items.type === "object" && typeof item === "object" && item !== null) {
            // Check required properties
            if (schema.items.required) {
              for (const requiredProp of schema.items.required) {
                if (item[requiredProp] === undefined || item[requiredProp] === null) {
                  errors.push(`${field}[${index}]: Propiedad requerida: ${requiredProp}`)
                }
              }
            }

            // Check property types
            if (schema.items.properties) {
              for (const [propName, propValue] of Object.entries(item)) {
                const propSchema = schema.items.properties[propName]
                if (!propSchema) continue

                if (propSchema.type === "string" && typeof propValue !== "string") {
                  errors.push(`${field}[${index}].${propName} debe ser una cadena de texto`)
                } else if (propSchema.type === "number" && typeof propValue !== "number") {
                  errors.push(`${field}[${index}].${propName} debe ser un número`)
                } else if (propSchema.type === "boolean" && typeof propValue !== "boolean") {
                  errors.push(`${field}[${index}].${propName} debe ser un booleano`)
                }

                // Enum validation
                if (propSchema.enum && !propSchema.enum.includes(propValue)) {
                  errors.push(`${field}[${index}].${propName} debe ser uno de: ${propSchema.enum.join(", ")}`)
                }
              }
            }
          } else if (schema.items.type && typeof item !== schema.items.type) {
            errors.push(`${field}[${index}] debe ser de tipo ${schema.items.type}`)
          }
        })
      }
    }

    // Object constraints
    if (typeof value === "object" && value !== null && !Array.isArray(value) && schema.type === "object") {
      // Check required properties
      if (schema.required) {
        for (const requiredProp of schema.required) {
          if (value[requiredProp] === undefined || value[requiredProp] === null) {
            errors.push(`${field}: Propiedad requerida: ${requiredProp}`)
          }
        }
      }

      // Check property types
      if (schema.properties) {
        for (const [propName, propValue] of Object.entries(value)) {
          const propSchema = schema.properties[propName]
          if (!propSchema) continue

          if (propSchema.type === "string" && typeof propValue !== "string") {
            errors.push(`${field}.${propName} debe ser una cadena de texto`)
          } else if (propSchema.type === "number" && typeof propValue !== "number") {
            errors.push(`${field}.${propName} debe ser un número`)
          } else if (propSchema.type === "boolean" && typeof propValue !== "boolean") {
            errors.push(`${field}.${propName} debe ser un booleano`)
          }
        }
      }
    }
  }

  // Special validation for hasVariants
  if (
    product.hasVariants === true &&
    (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0)
  ) {
    errors.push("Si hasVariants es true, debe proporcionar al menos una variante")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Validate an array of products
export function validateProducts(products: any[]): {
  valid: boolean
  validProducts: any[]
  invalidProducts: { product: any; errors: string[] }[]
} {
  const validProducts: any[] = []
  const invalidProducts: { product: any; errors: string[] }[] = []

  for (const product of products) {
    const validation = validateProduct(product)

    if (validation.valid) {
      validProducts.push(product)
    } else {
      invalidProducts.push({
        product,
        errors: validation.errors,
      })
    }
  }

  return {
    valid: invalidProducts.length === 0,
    validProducts,
    invalidProducts,
  }
}

// Add this alias for backward compatibility
export const validateProductSchema = validateProduct
