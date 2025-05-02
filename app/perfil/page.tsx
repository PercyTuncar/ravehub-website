import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import ProfileWrapper from "@/components/profile/profile-wrapper"
import AuthRouteGuard from "@/components/auth/auth-route-guard"

export const metadata: Metadata = {
  title: "Mi Perfil | RaveHub",
  description: "Gestiona tu información personal y configuraciones de cuenta",
}

export default function ProfilePage() {
  return (
    <AuthRouteGuard>
      <div className="container max-w-5xl py-8">
        <PageHeader title="Mi Perfil" description="Gestiona tu información personal y configuraciones de cuenta" />

        <div className="mt-8">
          <ProfileWrapper />
        </div>
      </div>
    </AuthRouteGuard>
  )
}
