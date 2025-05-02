"use client"

import { useEffect, useState } from "react"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface OrderSummaryProps {
  shippingCost: number
}

export function OrderSummary({ shippingCost }: OrderSummaryProps) {
  const { items, subtotal } = useCart()
  const { currency, formatCurrency, _forceUpdate } = useCurrency()
  const [, forceUpdate] = useState(0)
  const totalAmount = subtotal + shippingCost

  // Escuchar cambios de moneda
  useEffect(() => {
    const handleCurrencyChange = () => {
      // Forzar re-renderizado
      console.log(`OrderSummary: Moneda cambiada a ${currency}, actualizando...`)
      forceUpdate((prev) => prev + 1)
    }

    window.addEventListener("currency-changed", handleCurrencyChange)

    return () => {
      window.removeEventListener("currency-changed", handleCurrencyChange)
    }
  }, [currency])

  // Corregir la función para formatear correctamente los precios
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen del pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                <p className="text-xs">
                  {item.quantity} x {formatCurrency(item.price, item.currency, currency)} {currency}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(item.price * item.quantity, item.currency, currency)} {currency}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {formatCurrency(subtotal, items.length > 0 ? items[0].currency : "USD", currency)} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <span>
              {formatCurrency(shippingCost, "USD", currency)} {currency}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>
              {formatCurrency(totalAmount, items.length > 0 ? items[0].currency : "USD", currency)} {currency}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
