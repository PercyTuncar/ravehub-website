"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react"

export default function CartPage() {
  const cart = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Tu carrito está vacío</h1>
          <p className="mt-2 text-muted-foreground">Parece que no has añadido ningún producto a tu carrito todavía.</p>
          <Button asChild className="mt-6">
            <Link href="/tienda">Explorar productos</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleRemoveItem = (id: string, variantId: string | null) => {
    cart.removeFromCart(id, variantId)
  }

  const handleUpdateQuantity = (id: string, variantId: string | null, quantity: number) => {
    cart.updateQuantity(id, variantId, quantity)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <Card key={`${item.id}-${item.variantId}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                      <Image
                        src={item.image || "/placeholder.svg?height=96&width=96"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium">{item.name}</h3>
                      {item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}
                      <div className="mt-2 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.variantId, item.quantity - 1)}
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.variantId, item.quantity + 1)}
                          aria-label="Aumentar cantidad"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-auto"
                        onClick={() => handleRemoveItem(item.id, item.variantId)}
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span>Calculado en el checkout</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Impuestos</span>
                <span>Calculado en el checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total estimado</span>
                <span>{formatCurrency(cart.getSubtotal())}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/tienda/checkout" className="flex items-center justify-center">
                  Proceder al checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
