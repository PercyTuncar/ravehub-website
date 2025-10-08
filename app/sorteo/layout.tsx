import type React from "react" 
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sorteo | Ravehub",
  description: "Sistema de sorteo para los comentarios de blog",
}

export default function SorteoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-white">{children}</div>
}
