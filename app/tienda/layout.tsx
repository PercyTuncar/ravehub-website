import type { ReactNode } from "react"
import type { Metadata } from "next"

interface TiendaLayoutProps {
  children: ReactNode
}

// Añadir metadatos estáticos para la sección de tienda
export const metadata: Metadata = {
  title: "Tienda | RaveHub",
  description: "Descubre nuestra selección de productos para eventos y fiestas.",
  openGraph: {
    title: "Tienda | RaveHub",
    description: "Descubre nuestra selección de productos para eventos y fiestas.",
    url: "/tienda",
    siteName: "RaveHub",
    type: "website",
  },
}

export default function TiendaLayout({ children }: TiendaLayoutProps) {
  return <div className="container mx-auto px-4 py-8">{children}</div>
}
