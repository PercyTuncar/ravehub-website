import type { Metadata } from "next"
import AuthRouteGuard from "@/components/auth/auth-route-guard"
import UserSettingsForm from "@/components/profile/user-settings-form"
import { PageHeader } from "@/components/page-header"
import { ProfileLayout } from "@/components/profile/profile-layout"

export const metadata: Metadata = {
  title: "Ajustes de Cuenta | Ravehub",
  description: "Personaliza tus preferencias y ajustes de cuenta en Ravehub",
}

export default function UserSettingsPage() {
  return (
    <AuthRouteGuard>
      <ProfileLayout>
        <div>
          <PageHeader title="Ajustes de Cuenta" description="Personaliza tu experiencia en Ravehub" />
          <div className="mt-6">
            <UserSettingsForm />
          </div>
        </div>
      </ProfileLayout>
    </AuthRouteGuard>
  )
}
