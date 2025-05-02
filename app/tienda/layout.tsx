import type { ReactNode } from "react"
import type { Metadata } from "next"

interface TiendaLayoutProps {
  children: ReactNode
}

// Update the metadata for the store page with a more descriptive and accurate content
export const metadata: Metadata = {
  title: "Tienda | RaveHub - Merchandise Oficial de Eventos",
  description:
    "Descubre nuestra selección de productos oficiales para eventos y fiestas electrónicas. Merchandise exclusivo, ropa y accesorios con opciones de pago en cuotas.",
  openGraph: {
    title: "Tienda | RaveHub - Merchandise Oficial de Eventos",
    description:
      "Descubre nuestra selección de productos oficiales para eventos y fiestas electrónicas. Merchandise exclusivo, ropa y accesorios con opciones de pago en cuotas.",
    url: "https://www.ravehublatam.com/tienda",
    siteName: "RaveHub",
    type: "website",
    images: [
      {
        url: "https://www.ravehublatam.com/electronic-music-festival-night.png",
        width: 1200,
        height: 630,
        alt: "RaveHub Tienda - Merchandise Oficial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tienda | RaveHub - Merchandise Oficial de Eventos",
    description:
      "Descubre nuestra selección de productos oficiales para eventos y fiestas electrónicas. Merchandise exclusivo, ropa y accesorios.",
    images: ["https://www.ravehublatam.com/electronic-music-festival-night.png"],
  },
  alternates: {
    canonical: "https://www.ravehublatam.com/tienda",
  },
}

export default function TiendaLayout({ children }: TiendaLayoutProps) {
  return <div className="container mx-auto px-4 py-8">{children}</div>
}
