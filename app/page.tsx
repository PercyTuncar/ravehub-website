import { getFeaturedEvents } from "@/lib/firebase/events"
import { HomeSchema } from "@/components/home/home-schema"
import type { Metadata } from "next"
import { HomeClient } from "@/components/home/home-client"

export const metadata: Metadata = {
  title: "Ravehub - Eventos de Música Electrónica en Latinoamérica",
  description: "Descubre los mejores eventos de música electrónica en Latinoamérica. Compra entradas, merchandise oficial y vive experiencias únicas con opciones de pago en cuotas.",
  authors: [{ name: "Ravehub" }],
  keywords: [
    "eventos música electrónica",
    "festivales electrónicos",
    "entradas eventos",
    "ravehub",
    "música electrónica latinoamérica",
    "comprar entradas",
    "eventos techno",
    "eventos house",
    "fiestas electrónicas",
    "merchandise oficial",
    "ravehub.pe",
  ],
  robots: "index, follow",
  verification: {
    google: "LJ0E6g_s2v1d9W5Mt-T1SD-r7asbrP8WsFt4f5yHZ7E",
  },
  openGraph: {
    title: "Ravehub - Eventos de Música Electrónica en Latinoamérica",
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica. Encuentra los mejores raves, compra entradas con pago en cuotas y merchandise oficial.",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/ravehubultra.webp?alt=media&token=126bf601-f0dd-463e-9661-4665ba50e015",
        width: 1200,
        height: 630,
        alt: "Ravehub - Eventos de Música Electrónica",
      },
    ],
    url: "https://ravehublatam.com",
    siteName: "Ravehub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravehub - Eventos de Música Electrónica en Latinoamérica",
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica. Encuentra los mejores raves, compra entradas con pago en cuotas.",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/ravehubultra.webp?alt=media&token=126bf601-f0dd-463e-9661-4665ba50e015",
    ],
  },
}

export const viewport = {
  themeColor: "#000000",
}

export default async function Home() {
  // Prefetch critical data
  const featuredEvents = await getFeaturedEvents()

  return (
    <>
      <HomeClient featuredEvents={featuredEvents} />
      {/* Schema data for SEO - doesn't affect visual rendering */}
      <HomeSchema featuredEvents={featuredEvents} />
    </>
  )
}
