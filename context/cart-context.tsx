"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useCurrency } from "@/context/currency-context"
import { formatCurrency } from "@/lib/utils"
// Importar el hook de sincronización offline
import { useOfflineSync } from "@/hooks/use-offline-sync"

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  currency: string
  quantity: number
  image?: string
  variantName?: string
  stock: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  formattedSubtotal: string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// En el componente CartProvider, añadir el hook de sincronización
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [formattedSubtotal, setFormattedSubtotal] = useState("")
  const { currency, exchangeRates } = useCurrency()

  const { isOnline, addPendingAction } = useOfflineSync()

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        setItems(parsedCart)
        console.log("CartContext: Carrito cargado desde localStorage", parsedCart.length)
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }, [])

  // Calculate subtotal whenever items change
  useEffect(() => {
    const newSubtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
    setSubtotal(newSubtotal)

    // Format subtotal with current currency
    if (Object.keys(exchangeRates).length > 0) {
      // Assuming all items are in the same currency (first item's currency)
      const baseCurrency = items.length > 0 ? items[0].currency : "USD"
      setFormattedSubtotal(formatCurrency(newSubtotal, baseCurrency, currency, exchangeRates))
    } else {
      setFormattedSubtotal(formatCurrency(newSubtotal, "USD", currency))
    }

    // Save cart to localStorage
    localStorage.setItem("cart", JSON.stringify(items))

    // Notificar cambios en el carrito
    if (typeof window !== "undefined") {
      console.log("CartContext: Guardando carrito en localStorage", items.length)
    }
  }, [items, currency, exchangeRates])

  // Add item to cart
  const addItem = useCallback(
    (newItem: Omit<CartItem, "id">) => {
      console.log("CartContext: Agregando item al carrito", newItem)

      // Si estamos offline, añadir la acción a la cola de sincronización
      if (!isOnline) {
        addPendingAction("ADD_TO_CART", newItem)
      }

      setItems((prevItems) => {
        // Check if item with same productId and variantId already exists
        const existingItemIndex = prevItems.findIndex(
          (item) => item.productId === newItem.productId && item.variantId === newItem.variantId,
        )

        let updatedItems

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          updatedItems = [...prevItems]
          const existingItem = updatedItems[existingItemIndex]

          // Ensure we don't exceed stock
          const newQuantity = Math.min(existingItem.quantity + newItem.quantity, newItem.stock)

          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          }

          console.log("CartContext: Item ya existía, actualizando cantidad", {
            index: existingItemIndex,
            oldQuantity: existingItem.quantity,
            newQuantity,
          })
        } else {
          // Add new item with unique id
          const id = `${newItem.productId}-${newItem.variantId || ""}-${Date.now()}`
          updatedItems = [...prevItems, { ...newItem, id }]
          console.log("CartContext: Agregando nuevo item", { id })
        }

        // Disparar evento inmediatamente después de actualizar el estado
        setTimeout(() => {
          console.log("CartContext: Disparando evento cart-updated")
          window.dispatchEvent(new CustomEvent("cart-updated"))
        }, 10)

        return updatedItems
      })
    },
    [isOnline, addPendingAction],
  )

  // Remove item from cart
  const removeItem = useCallback((id: string) => {
    console.log("CartContext: Eliminando item del carrito", id)

    setItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id)

      // Disparar evento inmediatamente después de actualizar el estado
      setTimeout(() => {
        console.log("CartContext: Disparando evento cart-updated")
        window.dispatchEvent(new CustomEvent("cart-updated"))
      }, 10)

      return updatedItems
    })
  }, [])

  // Update quantity of item in cart
  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      console.log("CartContext: Actualizando cantidad", { id, quantity })

      if (quantity <= 0) {
        removeItem(id)
        return
      }

      setItems((prevItems) => {
        const updatedItems = prevItems.map((item) => {
          if (item.id === id) {
            // Ensure quantity doesn't exceed stock
            const newQuantity = Math.min(quantity, item.stock)
            return { ...item, quantity: newQuantity }
          }
          return item
        })

        // Disparar evento inmediatamente después de actualizar el estado
        setTimeout(() => {
          console.log("CartContext: Disparando evento cart-updated")
          window.dispatchEvent(new CustomEvent("cart-updated"))
        }, 10)

        return updatedItems
      })
    },
    [removeItem],
  )

  // Clear cart
  const clearCart = useCallback(() => {
    console.log("CartContext: Vaciando carrito")

    setItems([])

    // Disparar evento inmediatamente después de actualizar el estado
    setTimeout(() => {
      console.log("CartContext: Disparando evento cart-updated")
      window.dispatchEvent(new CustomEvent("cart-updated"))
    }, 10)
  }, [])

  // Calculate total number of items
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        formattedSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
