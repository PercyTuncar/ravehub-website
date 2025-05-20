import { getFeaturedEvents } from "@/lib/firebase/events"
import { HomeSchema } from "@/components/home/home-schema"
import { HeroSection } from "@/components/home/hero-section"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Optimized dynamic imports with reduced loading components
const CountriesSection = dynamic(
  () => import("@/components/home/countries-section").then((mod) => ({ default: mod.CountriesSection })),
  {
    loading: () => <div aria-hidden="true" className="h-20"></div>,
    ssr: true,
  },
)

const FeaturedEventsSection = dynamic(
  () => import("@/components/home/featured-events-section").then((mod) => ({ default: mod.FeaturedEventsSection })),
  {
    loading: () => <div aria-hidden="true" className="py-8"></div>,
    ssr: true,
  },
)

// Use intersection observer loading for less important sections
const AboutSection = dynamic(
  () => import("@/components/home/about-section").then((mod) => ({ default: mod.AboutSection })),
  { ssr: false },
)

const TestimonialsSection = dynamic(
  () => import("@/components/home/testimonials-section").then((mod) => ({ default: mod.TestimonialsSection })),
  { ssr: false },
)

const NewsletterSection = dynamic(
  () => import("@/components/home/newsletter-section").then((mod) => ({ default: mod.NewsletterSection })),
  { ssr: false },
)

const CtaSection = dynamic(() => import("@/components/home/cta-section").then((mod) => ({ default: mod.CtaSection })), {
  ssr: false,
})

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Critical path rendering - load immediately */}
      <HeroSection />

      {/* Important but can be loaded slightly after initial paint */}
      <Suspense fallback={<div aria-hidden="true" className="h-20"></div>}>
        <CountriesSection />
      </Suspense>

      <Suspense fallback={<div aria-hidden="true" className="py-8"></div>}>
        <FeaturedEventsSection events={featuredEvents} />
      </Suspense>

      {/* Non-critical sections loaded later */}
      <Suspense>
        <AboutSection />
      </Suspense>

      <Suspense>
        <TestimonialsSection />
      </Suspense>

      <Suspense>
        <NewsletterSection />
      </Suspense>

      <Suspense>
        <CtaSection />
      </Suspense>

      {/* Schema data for SEO - doesn't affect visual rendering */}
      <HomeSchema featuredEvents={featuredEvents} />
    </div>
  )
}
