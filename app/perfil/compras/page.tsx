import type { Metadata } from "next"
import { UserOrders } from "@/components/store/user-orders"
import AuthRouteGuard from "@/components/auth/auth-route-guard"
import { ProfileLayout } from "@/components/profile/profile-layout"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Mis Compras | RaveHub",
  description: "Historial de compras en RaveHub",
}

export default function PurchasesPage() {
  return (
    <AuthRouteGuard>
      <ProfileLayout>
        <div>
          <PageHeader title="Mis Compras" description="Historial y estado de tus compras en RaveHub" />
          <div className="mt-6">
            <UserOrders />
          </div>
        </div>
      </ProfileLayout>
    </AuthRouteGuard>
  )
}
