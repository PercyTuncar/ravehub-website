import type { Metadata } from "next"
import OfflineContent from "@/components/offline/offline-content"

export const metadata: Metadata = {
  title: "Sin conexión | Ravehub",
  description: "Parece que no tienes conexión a internet",
}

export const viewport = {
  themeColor: "#000000",
}

export default function OfflinePage() {
  return <OfflineContent />
}
