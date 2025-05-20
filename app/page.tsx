import { getFeaturedEvents } from "@/lib/firebase/events"
import { HomeSchema } from "@/components/home/home-schema"
import type { Metadata } from "next"
import { HomeClient } from "@/components/home/home-client"

export const metadata: Metadata = {
  title: "RaveHub - Eventos de música electrónica",
  description:
    "Encuentra los mejores eventos de música electrónica, compra entradas y merchandise oficial, con opciones de pago en cuotas para que disfrutes sin preocupaciones.",
  authors: [{ name: "RaveHub" }],
  keywords: ["eventos", "música electrónica", "entradas", "merchandise", "raves"],
  robots: "index, follow",
  verification: {
    google: "LJ0E6g_s2v1d9W5Mt-T1SD-r7asbrP8WsFt4f5yHZ7E",
  },
  openGraph: {
    title: "RaveHub - Eventos de música electrónica",
    description: "Encuentra los mejores eventos de música electrónica en Latinoamérica",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/ravehubultra.webp?alt=media&token=126bf601-f0dd-463e-9661-4665ba50e015",
    ],
    url: "https://ravehublatam.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RaveHub - Eventos de música electrónica",
    description: "Encuentra los mejores eventos de música electrónica en Latinoamérica",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/ravehubultra.webp?alt=media&token=126bf601-f0dd-463e-9661-4665ba50e015",
    ],
  },
  icons: {
    icon: "https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/faviconravehub.ico?alt=media&token=6217b1fa-b7f8-4f1c-96a3-8f4ff3bdf917",
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
