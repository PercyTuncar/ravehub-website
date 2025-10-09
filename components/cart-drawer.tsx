"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/cart-context"
import { formatCurrency } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash, Plus, Minus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCurrency } from "@/context/currency-context"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"

export function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, totalItems, formattedSubtotal, subtotal } = useCart()
  const { currency } = useCurrency()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // No router needed, will use window.location

  // Forzar actualización del drawer cuando cambia el carrito
  useEffect(() => {
    console.log("CartDrawer: Componente montado/actualizado", { itemsCount: items.length, totalItems })

    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = () => {
      console.log("CartDrawer: Evento cart-updated recibido")
      // Forzar re-renderizado
      setForceUpdate((prev) => prev + 1)
    }

    window.addEventListener("cart-updated", handleCartUpdate)
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate)
    }
  }, [items.length, totalItems])

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para continuar con la compra",
      })
      setIsOpen(false)
      window.location.href = "/login?redirect=/tienda/checkout"
      return
    }

    setIsOpen(false)
    window.location.href = "/tienda/checkout"
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5 text-gray-800" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Ver carrito ({totalItems} items)</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Tu Carrito</SheetTitle>
          <SheetDescription>
            {totalItems === 0
              ? "Tu carrito está vacío"
              : `Tienes ${totalItems} ${totalItems === 1 ? "producto" : "productos"} en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Tu carrito está vacío</p>
            <Button asChild onClick={() => setIsOpen(false)} className="mt-4">
              <Link href="/tienda">Ver productos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                      {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                      <div className="flex items-center mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.price * item.quantity, item.currency, currency)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => removeItem(item.id)}>
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-auto">
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={clearCart} className="flex items-center gap-1">
                  <Trash className="h-4 w-4" />
                  <span>Vaciar carrito</span>
                </Button>
                <Button onClick={handleCheckout}>Proceder al pago</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
