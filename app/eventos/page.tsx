import { Suspense } from "react"
import { EventsFilterWrapper } from "@/components/events/events-filter-wrapper"
import { EventsList } from "@/components/events/events-list"
import { EventsLoading } from "@/components/events/events-loading"
import { EventsBanner } from "@/components/events/events-banner"
import { EventsCategories } from "@/components/events/events-categories"
import { Breadcrumbs } from "@/components/breadcrumbs"

export const metadata = {
  title: "Eventos | Ravehub - Música Electrónica en Latinoamérica",
  description:
    "Explora los mejores eventos de música electrónica en Latinoamérica. Filtra por país, fecha y precio. Compra entradas con opciones de pago en cuotas.",
  openGraph: {
    title: "Eventos | Ravehub - Música Electrónica en Latinoamérica",
    description:
      "Explora los mejores eventos de música electrónica en Latinoamérica. Filtra por país, fecha y precio. Compra entradas con opciones de pago en cuotas.",
    url: "https://www.ravehublatam.com/eventos",
    siteName: "Ravehub",
    type: "website",
    images: [
      {
        url: "https://www.ravehublatam.com/electronic-music-festival-night.png",
        width: 1200,
        height: 630,
        alt: "Ravehub Eventos - Música Electrónica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos | Ravehub - Música Electrónica en Latinoamérica",
    description: "Explora los mejores eventos de música electrónica en Latinoamérica. Filtra por país, fecha y precio.",
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
