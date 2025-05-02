import type React from "react"
import "../globals.css"
import "./styles.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sorteo | RaveHub",
  description: "Sistema de sorteo para los comentarios de blog",
}

export default function SorteoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-white">{children}</div>
}
