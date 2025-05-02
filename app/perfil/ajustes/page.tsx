import type { Metadata } from "next"
import AuthRouteGuard from "@/components/auth/auth-route-guard"
import UserSettingsForm from "@/components/profile/user-settings-form"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Ajustes de Cuenta | RaveHub",
  description: "Personaliza tus preferencias y ajustes de cuenta en RaveHub",
}

export default function UserSettingsPage() {
  return (
    <AuthRouteGuard>
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Ajustes de Cuenta" description="Personaliza tu experiencia en RaveHub" className="mb-8" />
        <UserSettingsForm />
      </div>
    </AuthRouteGuard>
  )
}
