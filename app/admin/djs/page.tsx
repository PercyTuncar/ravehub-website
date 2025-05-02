import { AdminDJSuggestions } from "@/components/admin/dj-ranking/admin-dj-suggestions"

export const metadata = {
  title: "Admin DJs | RaveHub",
  description: "Administración de DJs",
}

export default function AdminDJsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Administración de DJs</h1>

      <AdminDJSuggestions />
    </div>
  )
}
