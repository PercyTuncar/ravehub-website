import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/context/auth-context"
import { CurrencyProvider } from "@/context/currency-context"
import { GeolocationProvider } from "@/context/geolocation-context"
import { CartProvider } from "@/context/cart-context"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
// Añadir las importaciones de los componentes PWA
import { RegisterSW } from "@/components/pwa/register-sw"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { UpdatePrompt } from "@/components/pwa/update-prompt"
import GoogleAnalytics from "@/components/analytics/google-analytics"
import { Suspense } from "react"
import Script from "next/script"
import { FontOptimization } from "@/components/font-optimization"
import { ConnectionStatus } from "@/components/pwa/connection-status" // Import ConnectionStatus component

// Optimizar la carga de fuentes
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

// Actualizar el metadata para incluir el manifest y los colores de tema
export const metadata: Metadata = {
  metadataBase: new URL("https://www.ravehublatam.com"),
  title: "Ravehub - Eventos de Música Electrónica en Latinoamérica | Entradas y Merchandise",
  description:
    "Descubre los mejores eventos de música electrónica en Latinoamérica. Compra entradas, merchandise oficial y vive experiencias únicas con opciones de pago en cuotas.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ravehub",
  },
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon.ico', type: 'image/x-icon', sizes: 'any' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  alternates: {
    canonical: "https://www.ravehublatam.com",
    languages: {
      es: "https://www.ravehublatam.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: "https://www.ravehublatam.com",
    title: "Ravehub - Eventos de Música Electrónica en Latinoamérica | Entradas y Merchandise",
    description:
      "Descubre los mejores eventos de música electrónica en Latinoamérica. Compra entradas, merchandise oficial y vive experiencias únicas con opciones de pago en cuotas.",
    siteName: "Ravehub",
    images: [
      {
        url: "https://www.ravehublatam.com/placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Ravehub - Eventos de música electrónica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ravehub - Eventos de Música Electrónica en Latinoamérica | Entradas y Merchandise",
    description: "Descubre los mejores eventos de música electrónica en Latinoamérica. Compra entradas, merchandise oficial y vive experiencias únicas.",
    images: ["https://www.ravehublatam.com/electronic-music-festival-night.png"],
  },
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
  category: "Entertainment",
  verification: {
    google: "verification-code", // Replace with your actual Google verification code
  },
  other: {
    "facebook-domain-verification": "", // Add your Facebook domain verification if available
    "google-site-verification": "", // Add your Google site verification if available
    "msvalidate.01": "", // Add your Bing verification if available
  },
    generator: 'v0.dev'
}

// Añadir la exportación de viewport separada
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
}

// En el componente RootLayout, añadir los componentes PWA
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Precargar recursos críticos */}
        <link rel="preload" href="/images/logo-full.png" as="image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Añadir los meta tags para PWA */}
        <meta name="apple-mobile-web-app-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ravehub" />

        {/* Optimización de fuentes */}
        <FontOptimization />

        {/* Local Business Schema */}
        <Script id="local-business-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Ravehub",
            "url": "https://www.ravehublatam.com",
            "logo": "https://www.ravehublatam.com/images/logo-full.png",
            "description": "Plataforma líder en eventos de música electrónica en Latinoamérica",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "PE",
              "addressLocality": "Lima"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+51-944-784-488",
              "contactType": "customer service",
              "availableLanguage": "Spanish"
            },
            "sameAs": [
              "https://www.facebook.com/ravehub",
              "https://www.instagram.com/ravehub.pe",
              "https://twitter.com/dldkchile",
              "https://www.youtube.com/channel/UC-wATPEqoNpPPcFHfTFae8w"
            ]
          }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <GeolocationProvider>
            <AuthProvider>
              <CurrencyProvider>
                <CartProvider>
                  <UpdatePrompt />
                  <div className="flex min-h-screen flex-col">
                    <Navbar />
                    <main className="flex-1 w-full pb-safe bg-gray-50">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <InstallPrompt />
                  {/* Wrap GoogleAnalytics in Suspense */}
                  <Suspense fallback={null}>
                    <GoogleAnalytics />
                  </Suspense>
                </CartProvider>
              </CurrencyProvider>
            </AuthProvider>
          </GeolocationProvider>
        </ThemeProvider>
        <RegisterSW />
        <ConnectionStatus /> {/* Added ConnectionStatus component */}
      </body>
    </html>
  )
}
