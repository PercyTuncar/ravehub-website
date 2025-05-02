import { db } from "./config"
import { doc, getDoc, increment, runTransaction } from "firebase/firestore"
import type { OrderItem } from "@/types"

/**
 * Verifica si hay suficiente stock disponible para todos los productos en una orden
 */
export async function checkStockAvailability(orderItems: OrderItem[]): Promise<boolean> {
  try {
    // Agrupar items por productId para verificar el stock total
    const productQuantities: Record<string, number> = {}

    for (const item of orderItems) {
      if (!productQuantities[item.productId]) {
        productQuantities[item.productId] = 0
      }
      productQuantities[item.productId] += item.quantity
    }

    // Verificar stock para cada producto
    for (const productId in productQuantities) {
      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        console.error(`Producto no encontrado: ${productId}`)
        return false
      }

      const productData = productSnap.data()

      // Verificar si hay suficiente stock
      if (productData.stock < productQuantities[productId]) {
        console.error(`Stock insuficiente para el producto: ${productId}`)
        return false
      }
    }

    // Verificar stock para variantes específicas si es necesario
    for (const item of orderItems) {
      if (item.variantId) {
        const productRef = doc(db, "products", item.productId)
        const productSnap = await getDoc(productRef)

        if (!productSnap.exists()) continue

        const productData = productSnap.data()
        const variant = productData.variants?.find((v: any) => v.id === item.variantId)

        if (variant && variant.stock < item.quantity) {
          console.error(`Stock insuficiente para la variante: ${item.variantId}`)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error al verificar disponibilidad de stock:", error)
    return false
  }
}

/**
 * Actualiza el stock de productos después de una orden exitosa
 */
export async function updateStockAfterOrder(orderItems: OrderItem[]): Promise<void> {
  try {
    // Usar una transacción para garantizar la integridad de los datos
    await runTransaction(db, async (transaction) => {
      // Primero, realizar TODAS las lecturas
      const productReads: Record<string, any> = {}

      // Leer todos los productos primero
      for (const item of orderItems) {
        if (!productReads[item.productId]) {
          const productRef = doc(db, "products", item.productId)
          const productSnap = await transaction.get(productRef)

          if (!productSnap.exists()) {
            console.error(`Producto no encontrado: ${item.productId}`)
            continue
          }

          productReads[item.productId] = {
            ref: productRef,
            data: productSnap.data(),
          }
        }
      }

      // Después de completar TODAS las lecturas, realizar las escrituras

      // Actualizar stock para cada producto
      const productQuantities: Record<string, number> = {}

      for (const item of orderItems) {
        if (!productQuantities[item.productId]) {
          productQuantities[item.productId] = 0
        }
        productQuantities[item.productId] += item.quantity
      }

      // Ahora realizar todas las escrituras
      for (const productId in productQuantities) {
        if (productReads[productId]) {
          transaction.update(productReads[productId].ref, {
            stock: increment(-productQuantities[productId]),
          })
        }
      }

      // Actualizar stock para variantes específicas
      for (const item of orderItems) {
        if (item.variantId && productReads[item.productId]) {
          const productData = productReads[item.productId].data
          const variants = productData.variants || []
          const updatedVariants = variants.map((variant: any) => {
            if (variant.id === item.variantId) {
              return {
                ...variant,
                stock: Math.max(0, variant.stock - item.quantity),
              }
            }
            return variant
          })

          transaction.update(productReads[item.productId].ref, {
            variants: updatedVariants,
          })
        }
      }
    })

    console.log("Stock actualizado correctamente")
  } catch (error) {
    console.error("Error al actualizar stock:", error)
    throw error
  }
}
