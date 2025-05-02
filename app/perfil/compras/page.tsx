import type { Metadata } from "next"
import { UserOrders } from "@/components/store/user-orders"
import AuthRouteGuard from "@/components/auth/auth-route-guard"

export const metadata: Metadata = {
  title: "Mis Compras | RaveHub",
  description: "Historial de compras en RaveHub",
}

export default function PurchasesPage() {
  return (
    <AuthRouteGuard>
      <main className="container py-8 px-4 md:px-6">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mis Compras</h1>
          <p className="text-muted-foreground">Historial y estado de tus compras en RaveHub</p>
        </div>

        <UserOrders />
      </main>
    </AuthRouteGuard>
  )
}
