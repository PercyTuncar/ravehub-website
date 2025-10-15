import { AdminEventArtists } from "@/components/admin/event-artists"

export const metadata = {
  title: "Artistas de Eventos | Ravehub",
  description: "Administración de artistas para eventos",
}

export default function AdminEventArtistsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Artistas de Eventos</h1>

      <AdminEventArtists />
    </div>
  )
}