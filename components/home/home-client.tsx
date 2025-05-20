"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import type { Event } from "@/types"
import { HeroSection } from "@/components/home/hero-section"

// Optimized dynamic imports with reduced loading components
const CountriesSection = dynamic(
  () => import("@/components/home/countries-section").then((mod) => ({ default: mod.CountriesSection })),
  {
    loading: () => <div aria-hidden="true" className="h-20"></div>,
  },
)

const FeaturedEventsSection = dynamic(
  () => import("@/components/home/featured-events-section").then((mod) => ({ default: mod.FeaturedEventsSection })),
  {
    loading: () => <div aria-hidden="true" className="py-8"></div>,
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

interface HomeClientProps {
  featuredEvents: Event[]
}

export function HomeClient({ featuredEvents }: HomeClientProps) {
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
    </div>
  )
}
