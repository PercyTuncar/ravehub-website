import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import type { Product, ProductCategory, ProductVariant } from "@/types"
import { v4 as uuidv4 } from "uuid"
import { filterBlobUrls, cleanAltTexts } from "@/lib/firebase/image-utils"
import { validateProductSchema } from "@/lib/validation/product-schema"

// Helper function to remove undefined values from an object
function removeUndefinedValues(obj: any): any {
  return JSON.parse(JSON.stringify(obj))
}

// Get featured products for homepage
export async function getFeaturedProducts(limitCount = 6): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const q = query(
      productsRef,
      where("isActive", "==", true),
      where("isHighlighted", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    return products
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}

// Get all active products
export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const q = query(productsRef, where("isActive", "==", true), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    return products
  } catch (error) {
    console.error("Error fetching all products:", error)
    return []
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const q = query(
      productsRef,
      where("isActive", "==", true),
      where("categoryId", "==", categoryId),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    return products
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error)
    return []
  }
}

// Get product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    if (!slug) {
      console.error("No slug provided to getProductBySlug")
      return null
    }

    const productsRef = collection(db, "products")
    const q = query(productsRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No product found with slug: ${slug}`)
      return null
    }

    // Get document data
    const docData = querySnapshot.docs[0].data()
    const productId = querySnapshot.docs[0].id

    // Get variants if any
    let variants: ProductVariant[] = []
    try {
      if (docData.hasVariants) {
        const variantsQuery = query(collection(db, "productVariants"), where("productId", "==", productId))
        const variantsSnapshot = await getDocs(variantsQuery)
        variants = variantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProductVariant)
      }
    } catch (variantError) {
      console.error("Error fetching product variants:", variantError)
      // Continue without variants
    }

    // Safely handle dates
    let createdAt = new Date()
    try {
      createdAt =
        docData.createdAt && typeof docData.createdAt.toDate === "function"
          ? docData.createdAt.toDate()
          : new Date(docData.createdAt || Date.now())
    } catch (dateError) {
      console.error("Error parsing createdAt date:", dateError)
    }

    let updatedAt = new Date()
    try {
      updatedAt =
        docData.updatedAt && typeof docData.updatedAt.toDate === "function"
          ? docData.updatedAt.toDate()
          : new Date(docData.updatedAt || Date.now())
    } catch (dateError) {
      console.error("Error parsing updatedAt date:", dateError)
    }

    // Get the data with videos and media order
    const normalizedProduct: Product = {
      id: productId,
      ...docData,
      videos: docData.videos || [],
      mediaOrder: docData.mediaOrder || [],
      createdAt,
      updatedAt,
      variants,
    } as Product

    return normalizedProduct
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error)
    return null
  }
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const productDoc = await getDoc(doc(db, "products", id))

    if (!productDoc.exists()) {
      return null
    }

    const productData = productDoc.data()

    // Get variants if any
    let variants: ProductVariant[] = []
    if (productData.hasVariants) {
      const variantsQuery = query(collection(db, "productVariants"), where("productId", "==", id))
      const variantsSnapshot = await getDocs(variantsQuery)
      variants = variantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProductVariant)
    }

    return {
      id: productDoc.id,
      ...productData,
      videos: productData.videos || [],
      mediaOrder: productData.mediaOrder || [],
      variants,
      createdAt:
        productData.createdAt && typeof productData.createdAt.toDate === "function"
          ? productData.createdAt.toDate()
          : new Date(productData.createdAt || Date.now()),
      updatedAt:
        productData.updatedAt && typeof productData.updatedAt.toDate === "function"
          ? productData.updatedAt.toDate()
          : new Date(productData.updatedAt || Date.now()),
    } as Product
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error)
    return null
  }
}

// Create a new product
export async function createProduct(productData: Product): Promise<string> {
  try {
    // Filter out blob URLs from images and clean alt texts
    const filteredImages = filterBlobUrls(productData.images)
    const cleanedAltTexts = cleanAltTexts(productData.imageAltTexts)

    // Add server timestamp and remove undefined values
    const productWithTimestamp = removeUndefinedValues({
      ...productData,
      images: filteredImages,
      imageAltTexts: cleanedAltTexts,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure new fields are included with defaults if not provided
      brand: productData.brand || "Ravehub",
      videoUrl: productData.videoUrl || "",
      eligibleRegions: productData.eligibleRegions || [],
      shippingDetails: productData.shippingDetails || {
        shippingRate: 0,
        shippingCurrency: "PEN",
        eligibleRegion: "Latinoamérica",
      },
    })

    // Remove variants from the main product object
    const { variants, ...productWithoutVariants } = productWithTimestamp

    // Create product document
    const docRef = await addDoc(collection(db, "products"), productWithoutVariants)

    // Create variants if any
    if (variants && variants.length > 0) {
      const batch = writeBatch(db)

      variants.forEach((variant) => {
        const variantRef = doc(collection(db, "productVariants"), variant.id || uuidv4())
        batch.set(
          variantRef,
          removeUndefinedValues({
            ...variant,
            productId: docRef.id,
          }),
        )
      })

      await batch.commit()
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

// Update an existing product
export async function updateProduct(id: string, productData: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, "products", id)

    // Filter out blob URLs from images and clean alt texts
    const filteredImages = filterBlobUrls(productData.images)
    const cleanedAltTexts = cleanAltTexts(productData.imageAltTexts)

    // Add server timestamp for update and remove undefined values
    const { variants, ...productWithoutVariants } = productData
    const productWithTimestamp = removeUndefinedValues({
      ...productWithoutVariants,
      images: filteredImages,
      imageAltTexts: cleanedAltTexts,
      updatedAt: serverTimestamp(),
    })

    // Update product document
    await updateDoc(productRef, productWithTimestamp)

    // Update variants if any
    if (variants && variants.length > 0) {
      const batch = writeBatch(db)

      // Get existing variants
      const variantsQuery = query(collection(db, "productVariants"), where("productId", "==", id))
      const variantsSnapshot = await getDocs(variantsQuery)
      const existingVariants = new Map<string, any>()
      variantsSnapshot.forEach((doc) => {
        existingVariants.set(doc.id, doc.ref)
      })

      // Update or create variants
      variants.forEach((variant) => {
        if (variant.id && existingVariants.has(variant.id)) {
          // Update existing variant
          batch.update(existingVariants.get(variant.id), removeUndefinedValues(variant))
          existingVariants.delete(variant.id)
        } else {
          // Create new variant
          const variantId = variant.id || uuidv4()
          const variantRef = doc(collection(db, "productVariants"), variantId)
          batch.set(
            variantRef,
            removeUndefinedValues({
              ...variant,
              id: variantId,
              productId: id,
            }),
          )
        }
      })

      // Delete removed variants
      existingVariants.forEach((variantRef) => {
        batch.delete(variantRef)
      })

      await batch.commit()
    }
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error)
    throw error
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<void> {
  try {
    const batch = writeBatch(db)

    // Delete product document
    const productRef = doc(db, "products", id)
    batch.delete(productRef)

    // Delete all variants
    const variantsQuery = query(collection(db, "productVariants"), where("productId", "==", id))
    const variantsSnapshot = await getDocs(variantsQuery)
    variantsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error)
    throw error
  }
}

// Add or update these functions for category management

// Get all categories
export async function getAllCategories() {
  const categoriesRef = collection(db, "productCategories")
  const snapshot = await getDocs(categoriesRef)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProductCategory[]
}

// Get category by ID
export async function getCategoryById(id: string) {
  const docRef = doc(db, "productCategories", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ProductCategory
  }

  return null
}

// Update the createCategory function to handle parent-child relationships
export async function createCategory(category: Omit<ProductCategory, "id">) {
  try {
    const categoriesRef = collection(db, "productCategories")

    // Prepare category data
    const categoryData = {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Create the category
    const docRef = await addDoc(categoriesRef, categoryData)

    // If this is a subcategory, update the parent category to include this subcategory
    if (category.isSubcategory && category.parentCategoryId) {
      const parentRef = doc(db, "productCategories", category.parentCategoryId)
      const parentDoc = await getDoc(parentRef)

      if (parentDoc.exists()) {
        const parentData = parentDoc.data()
        const subcategories = parentData.subcategories || []

        // Add this subcategory to the parent's subcategories array
        await updateDoc(parentRef, {
          subcategories: [...subcategories, docRef.id],
          updatedAt: serverTimestamp(),
        })
      }
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

// Update the updateCategory function to handle parent-child relationships
export async function updateCategory(id: string, category: Partial<ProductCategory>) {
  try {
    const docRef = doc(db, "productCategories", id)
    const currentDoc = await getDoc(docRef)

    if (!currentDoc.exists()) {
      throw new Error("Category not found")
    }

    const currentData = currentDoc.data() as ProductCategory

    // Check if parent category has changed
    if (
      category.isSubcategory &&
      category.parentCategoryId &&
      currentData.parentCategoryId !== category.parentCategoryId
    ) {
      // Remove from old parent if it exists
      if (currentData.parentCategoryId) {
        const oldParentRef = doc(db, "productCategories", currentData.parentCategoryId)
        const oldParentDoc = await getDoc(oldParentRef)

        if (oldParentDoc.exists()) {
          const oldParentData = oldParentDoc.data()
          const oldSubcategories = oldParentData.subcategories || []

          // Remove this subcategory from old parent
          await updateDoc(oldParentRef, {
            subcategories: oldSubcategories.filter((subId) => subId !== id),
            updatedAt: serverTimestamp(),
          })
        }
      }

      // Add to new parent
      const newParentRef = doc(db, "productCategories", category.parentCategoryId)
      const newParentDoc = await getDoc(newParentRef)

      if (newParentDoc.exists()) {
        const newParentData = newParentDoc.data()
        const newSubcategories = newParentData.subcategories || []

        // Add this subcategory to new parent
        await updateDoc(newParentRef, {
          subcategories: [...newSubcategories, id],
          updatedAt: serverTimestamp(),
        })
      }
    }

    // If changing from subcategory to main category, remove from parent
    if (currentData.isSubcategory && !category.isSubcategory && currentData.parentCategoryId) {
      const parentRef = doc(db, "productCategories", currentData.parentCategoryId)
      const parentDoc = await getDoc(parentRef)

      if (parentDoc.exists()) {
        const parentData = parentDoc.data()
        const subcategories = parentData.subcategories || []

        // Remove this subcategory from parent
        await updateDoc(parentRef, {
          subcategories: subcategories.filter((subId) => subId !== id),
          updatedAt: serverTimestamp(),
        })
      }
    }

    // Update the category
    await updateDoc(docRef, {
      ...category,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error)
    throw error
  }
}

// Update the deleteCategory function to handle parent-child relationships
export async function deleteCategory(id: string) {
  try {
    const docRef = doc(db, "productCategories", id)
    const categoryDoc = await getDoc(docRef)

    if (!categoryDoc.exists()) {
      throw new Error("Category not found")
    }

    const categoryData = categoryDoc.data() as ProductCategory

    // If this is a subcategory, update the parent
    if (categoryData.isSubcategory && categoryData.parentCategoryId) {
      const parentRef = doc(db, "productCategories", categoryData.parentCategoryId)
      const parentDoc = await getDoc(parentRef)

      if (parentDoc.exists()) {
        const parentData = parentDoc.data()
        const subcategories = parentData.subcategories || []

        // Remove this subcategory from parent
        await updateDoc(parentRef, {
          subcategories: subcategories.filter((subId) => subId !== id),
          updatedAt: serverTimestamp(),
        })
      }
    }

    // If this is a parent category with subcategories, update all subcategories
    if (categoryData.subcategories && categoryData.subcategories.length > 0) {
      const batch = writeBatch(db)

      for (const subcatId of categoryData.subcategories) {
        const subcatRef = doc(db, "productCategories", subcatId)

        // Either delete subcategories or convert them to main categories
        // Here we're converting them to main categories
        batch.update(subcatRef, {
          isSubcategory: false,
          parentCategoryId: "",
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
    }

    // Delete the category
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error)
    throw error
  }
}

// Upload category image
export async function uploadProductImage(file: File, folder = "products") {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

// Get all product categories
// export async function getAllCategories(): Promise<ProductCategory[]> {
//   try {
//     const categoriesRef = collection(db, "productCategories")
//     const q = query(categoriesRef, where("isActive", "==", true), orderBy("order", "asc"))

//     const querySnapshot = await getDocs(q)
//     const categories: ProductCategory[] = []

//     querySnapshot.forEach((doc) => {
//       categories.push({ id: doc.id, ...doc.data() } as ProductCategory)
//     })

//     return categories
//   } catch (error) {
//     console.error("Error fetching product categories:", error)
//     return []
//   }
// }

// Get category by ID
// export async function getCategoryById(id: string): Promise<ProductCategory | null> {
//   try {
//     const categoryDoc = await getDoc(doc(db, "productCategories", id))

//     if (!categoryDoc.exists()) {
//       return null
//     }

//     return { id: categoryDoc.id, ...categoryDoc.data() } as ProductCategory
//   } catch (error) {
//     console.error(`Error fetching category with ID ${id}:`, error)
//     return null
//   }
// }

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  try {
    const categoriesRef = collection(db, "productCategories")
    const q = query(categoriesRef, where("slug", "==", slug))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as ProductCategory
  } catch (error) {
    console.error(`Error fetching category with slug ${slug}:`, error)
    return null
  }
}

// Create a new category
// export async function createCategory(categoryData: ProductCategory): Promise<string> {
//   try {
//     // Add server timestamp and remove undefined values
//     const categoryWithTimestamp = removeUndefinedValues({
//       ...categoryData,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     })

//     const docRef = await addDoc(collection(db, "productCategories"), categoryWithTimestamp)
//     return docRef.id
//   } catch (error) {
//     console.error("Error creating category:", error)
//     throw error
//   }
// }

// Update an existing category
// export async function updateCategory(id: string, categoryData: Partial<ProductCategory>): Promise<void> {
//   try {
//     const categoryRef = doc(db, "productCategories", id)

//     // Add server timestamp for update and remove undefined values
//     const categoryWithTimestamp = removeUndefinedValues({
//       ...categoryData,
//       updatedAt: serverTimestamp(),
//     })

//     await updateDoc(categoryRef, categoryWithTimestamp)
//   } catch (error) {
//     console.error(`Error updating category with ID ${id}:`, error)
//     throw error
//   }
// }

// Delete a category
// export async function deleteCategory(id: string): Promise<void> {
//   try {
//     const categoryRef = doc(db, "productCategories", id)
//     await deleteDoc(categoryRef)
//   } catch (error) {
//     console.error(`Error deleting category with ID ${id}:`, error)
//     throw error
//   }
// }

// Upload product image
// export async function uploadProductImage(file: File, productId: string): Promise<string> {
//   try {
//     const storageRef = ref(storage, `products/${productId}/${uuidv4()}`)
//     await uploadBytes(storageRef, file)
//     const downloadURL = await getDownloadURL(storageRef)
//     return downloadURL
//   } catch (error) {
//     console.error("Error uploading product image:", error)
//     throw error
//   }
// }

// Get products for admin (all products, including inactive)
export async function getProductsForAdmin(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const q = query(productsRef, orderBy("updatedAt", "desc"))

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    for (const docSnapshot of querySnapshot.docs) {
      const productData = docSnapshot.data()
      const productId = docSnapshot.id

      // Get variants if any
      let variants: ProductVariant[] = []
      if (productData.hasVariants) {
        const variantsQuery = query(collection(db, "productVariants"), where("productId", "==", productId))
        const variantsSnapshot = await getDocs(variantsQuery)
        variants = variantsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProductVariant)
      }

      products.push({
        id: productId,
        ...productData,
        variants,
        createdAt:
          productData.createdAt && typeof productData.createdAt.toDate === "function"
            ? productData.createdAt.toDate()
            : new Date(productData.createdAt || Date.now()),
        updatedAt:
          productData.updatedAt && typeof productData.updatedAt.toDate === "function"
            ? productData.updatedAt.toDate()
            : new Date(productData.updatedAt || Date.now()),
      } as Product)
    }

    return products
  } catch (error) {
    console.error("Error fetching products for admin:", error)
    return []
  }
}

// Función para obtener productos aleatorios
export async function getRandomProducts(count = 2): Promise<Product[]> {
  try {
    // En Firestore no hay una forma directa de obtener documentos aleatorios
    // Una estrategia es obtener más productos de los necesarios y luego seleccionar aleatoriamente
    const productsRef = collection(db, "products")
    const q = query(
      productsRef,
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(20), // Obtenemos más productos para luego seleccionar aleatoriamente
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    // Si no hay suficientes productos, devolvemos los que hay
    if (products.length <= count) {
      return products
    }

    // Seleccionar aleatoriamente 'count' productos
    const randomProducts: Product[] = []
    const selectedIndices = new Set<number>()

    while (randomProducts.length < count && selectedIndices.size < products.length) {
      const randomIndex = Math.floor(Math.random() * products.length)

      if (!selectedIndices.has(randomIndex)) {
        selectedIndices.add(randomIndex)
        randomProducts.push(products[randomIndex])
      }
    }

    return randomProducts
  } catch (error) {
    console.error("Error fetching random products:", error)
    return []
  }
}

// Función para verificar si un slug de producto ya existe
export async function checkProductSlugExists(slug: string): Promise<boolean> {
  try {
    const productsRef = collection(db, "products")
    const q = query(productsRef, where("slug", "==", slug))
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error) {
    console.error(`Error checking if product slug ${slug} exists:`, error)
    throw error
  }
}

// Función para verificar si una categoría existe
export async function checkCategoryExists(categoryId: string): Promise<boolean> {
  try {
    const categoryDoc = await getDoc(doc(db, "productCategories", categoryId))
    return categoryDoc.exists()
  } catch (error) {
    console.error(`Error checking if category ${categoryId} exists:`, error)
    throw error
  }
}

// Mejorar la función importProductsFromJSON para manejar mejor las categorías

// Función para importar productos desde JSON
export async function importProductsFromJSON(
  products: any[],
  progressCallback?: (progress: number) => void,
): Promise<{
  success: boolean
  imported: number
  errors: { product: string; error: string }[]
}> {
  const result = {
    success: true,
    imported: 0,
    errors: [] as { product: string; error: string }[],
  }

  const totalProducts = products.length

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    try {
      // Actualizar progreso
      if (progressCallback) {
        progressCallback(Math.round((i / totalProducts) * 100))
      }

      // Validar el producto usando nuestro esquema
      const validation = validateProductSchema(product)
      if (!validation.valid) {
        result.errors.push({
          product: product.name || `Producto #${i + 1}`,
          error: `Errores de validación: ${validation.errors.join(", ")}`,
        })
        continue
      }

      // Verificar si el slug ya existe
      const slugExists = await checkProductSlugExists(product.slug)
      if (slugExists) {
        result.errors.push({
          product: product.name,
          error: `Ya existe un producto con el slug "${product.slug}"`,
        })
        continue
      }

      // Verificar si la categoría existe
      if (product.categoryId === "REPLACE_WITH_ACTUAL_CATEGORY_ID") {
        result.errors.push({
          product: product.name,
          error: `Debes reemplazar el valor de ejemplo 'REPLACE_WITH_ACTUAL_CATEGORY_ID' con un ID de categoría real`,
        })
        continue
      }

      const categoryExists = await checkCategoryExists(product.categoryId)
      if (!categoryExists) {
        result.errors.push({
          product: product.name,
          error: `La categoría con ID "${product.categoryId}" no existe`,
        })
        continue
      }

      // Verificar subcategoría si está presente
      if (product.subcategoryId) {
        if (product.subcategoryId === "REPLACE_WITH_ACTUAL_SUBCATEGORY_ID") {
          result.errors.push({
            product: product.name,
            error: `Debes reemplazar el valor de ejemplo 'REPLACE_WITH_ACTUAL_SUBCATEGORY_ID' con un ID de subcategoría real`,
          })
          continue
        }

        const subcategoryExists = await checkCategoryExists(product.subcategoryId)
        if (!subcategoryExists) {
          result.errors.push({
            product: product.name,
            error: `La subcategoría con ID "${product.subcategoryId}" no existe`,
          })
          continue
        }
      }

      // Preparar datos para Firebase
      const productData = {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Extraer variantes para procesarlas por separado
      const { variants, ...productWithoutVariants } = productData

      // Crear el producto en Firebase
      const productId = await createProduct({
        ...productWithoutVariants,
        variants: variants || [],
      } as Product)

      result.imported++
    } catch (error) {
      result.success = false
      result.errors.push({
        product: product.name || `Producto #${i + 1}`,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  // Actualizar progreso final
  if (progressCallback) {
    progressCallback(100)
  }

  return result
}

// Update the validateProduct function to handle subcategories
export function validateProduct(product: any) {
  const errors = []

  // Required fields
  if (!product.name) errors.push("Nombre del producto es requerido")
  if (!product.slug) errors.push("Slug del producto es requerido")
  if (!product.shortDescription) errors.push("Descripción corta es requerida")
  if (!product.description) errors.push("Descripción es requerida")
  if (!product.categoryId) errors.push("ID de categoría es requerido")

  // If subcategoryId is provided, validate it's not empty
  if (product.hasOwnProperty("subcategoryId") && !product.subcategoryId) {
    errors.push("ID de subcategoría no puede estar vacío si se proporciona")
  }

  // Rest of validation remains the same...

  return {
    valid: errors.length === 0,
    errors,
  }
}
