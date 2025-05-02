"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export const GA_TRACKING_ID = "G-KLMK6Q830S"

// This function will be called on route change
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof window.gtag !== "undefined") {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// TypeScript declarations for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      trackingId: string,
      config?: {
        page_path?: string
        [key: string]: any
      },
    ) => void
    dataLayer: any[]
  }
}

// Separate client component for search params tracking
function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname()
  const [url, setUrl] = useState<string>("")

  useEffect(() => {
    // Only track page views on the client side
    if (pathname) {
      const newUrl = pathname
      setUrl(newUrl)
      pageview(newUrl)
    }
  }, [pathname])

  return null
}

export default function GoogleAnalytics() {
  return (
    <>
      {/* Google Analytics Script */}
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <GoogleAnalyticsRouteTracker />
    </>
  )
}
