import { AdminDJProfiles } from "@/components/admin/dj-ranking/admin-dj-profiles"

export const metadata = {
  title: "Perfiles de DJs | Ravehub",
  description: "Administración de perfiles de DJs",
}

export default function AdminDJProfilesPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Perfiles de DJs</h1>

      <AdminDJProfiles />
    </div>
  )
}
