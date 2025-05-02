"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { CartItem as CartItemType } from "@/context/cart-context"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { currency, formatCurrency } = useCurrency()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      removeItem(item.id)
    }, 300)
  }

  return (
    <div className={`flex gap-4 py-4 transition-opacity duration-300 ${isRemoving ? "opacity-0" : "opacity-100"}`}>
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <Link href={`/tienda/${item.productId}`} className="text-lg font-medium hover:underline">
            {item.name}
          </Link>
          <span className="font-medium">
            {formatCurrency(item.price * item.quantity, item.currency, currency)} {currency}
          </span>
        </div>

        {item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Disminuir cantidad"
            >
              -
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              aria-label="Aumentar cantidad"
            >
              +
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRemove}
            aria-label="Eliminar producto"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
