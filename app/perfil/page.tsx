import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import ProfileWrapper from "@/components/profile/profile-wrapper"
import AuthRouteGuard from "@/components/auth/auth-route-guard"
import { ProfileLayout } from "@/components/profile/profile-layout"

export const metadata: Metadata = {
  title: "Mi Perfil | RaveHub",
  description: "Gestiona tu información personal y configuraciones de cuenta",
}

export default function ProfilePage() {
  return (
    <AuthRouteGuard>
      <ProfileLayout>
        <div>
          <PageHeader title="Mi Perfil" description="Gestiona tu información personal y configuraciones de cuenta" />
          <div className="mt-6">
            <ProfileWrapper />
          </div>
        </div>
      </ProfileLayout>
    </AuthRouteGuard>
  )
}
