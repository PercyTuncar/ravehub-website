import type { Metadata } from "next"
import SorteoClient from "./sorteo-client"

export const metadata: Metadata = {
  title: "Sorteo | RaveHub",
  description: "Sistema de sorteo para los comentarios de blog",
}

export default function SorteoPage() {
  return <SorteoClient />
}
