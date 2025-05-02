import { AdminDashboardRedesigned } from "@/components/admin/admin-dashboard-redesigned"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Panel de Administración | RaveHub",
  description: "Gestiona todos los aspectos de tu plataforma desde un solo lugar",
}

export default function AdminPage() {
  return <AdminDashboardRedesigned />
}
