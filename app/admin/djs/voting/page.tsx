import { AdminVotingPeriods } from "@/components/admin/dj-ranking/admin-voting-periods"

export const metadata = {
  title: "Periodos de Votación | RaveHub",
  description: "Administración de periodos de votación para rankings de DJs",
}

export default function AdminVotingPeriodsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Periodos de Votación</h1>

      <AdminVotingPeriods />
    </div>
  )
}
