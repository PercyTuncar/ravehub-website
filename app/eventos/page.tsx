import { Suspense } from "react"
import { EventsFilterWrapper } from "@/components/events/events-filter-wrapper"
import { EventsList } from "@/components/events/events-list"
import { EventsLoading } from "@/components/events/events-loading"
import { EventsBanner } from "@/components/events/events-banner"
import { EventsCategories } from "@/components/events/events-categories"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { EventsPageSchema } from "@/components/events/events-page-schema"

export const metadata = {
  title: "Próximos Eventos de Música Electrónica en Latinoamérica | Ravehub",
  description: "Descubre los mejores raves, festivales y eventos de música electrónica en LATAM. Encuentra fechas, lineup de artistas y compra tus entradas de forma segura en Ravehub.",
  keywords: ["eventos música electrónica", "raves Latinoamérica", "festivales electrónicos", "comprar entradas", "eventos rave"],
  openGraph: {
    title: "Próximos Eventos de Música Electrónica en Latinoamérica | Ravehub",
    description: "Descubre los mejores raves, festivales y eventos de música electrónica en LATAM. Encuentra fechas, lineup de artistas y compra tus entradas de forma segura en Ravehub.",
    url: "https://www.ravehublatam.com/eventos",
    siteName: "Ravehub",
    type: "website",
    images: [
      {
        url: "https://www.ravehublatam.com/electronic-music-festival-night.png",
        width: 1200,
        height: 630,
        alt: "Eventos de Música Electrónica - Ravehub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Próximos Eventos de Música Electrónica en Latinoamérica | Ravehub",
    description: "Descubre los mejores raves, festivales y eventos de música electrónica en LATAM.",
    images: ["https://www.ravehublatam.com/electronic-music-festival-night.png"],
  },
  alternates: {
    canonical: "https://www.ravehublatam.com/eventos",
  },
}

export const viewport = {
  themeColor: "#000000",
}

export default function EventsPage() {
  return (
    <div className="w-full">
      <EventsPageSchema />
      <EventsBanner />
      <Breadcrumbs className="container mx-auto" />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center mb-6">Eventos</h1>

        <Suspense fallback={<div>Cargando categorías...</div>}>
          <EventsCategories />
        </Suspense>

        <div className="mt-6">
          <Suspense fallback={<div>Cargando filtros...</div>}>
            <EventsFilterWrapper />
          </Suspense>
        </div>

        <Suspense fallback={<EventsLoading />}>
          <EventsList />
        </Suspense>
      </div>
    </div>
  )
}
