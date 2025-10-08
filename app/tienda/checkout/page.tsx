import type { Metadata } from "next"
import { CheckoutForm } from "@/components/store/checkout-form"

export const metadata: Metadata = {
  title: "Checkout | Ravehub",
  description: "Completa tu compra en Ravehub",
}

export default function CheckoutPage() {
  return (
    <main className="container py-8 px-4 md:px-6">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">Completa tu información para finalizar la compra</p>
      </div>

      <CheckoutForm />
    </main>
  )
}
