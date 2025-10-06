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
  title: "RaveHub - Eventos de música electrónica en Latinoamérica",
  description:
    "Encuentra los mejores eventos de música electrónica, compra entradas y merchandise oficial. La plataforma líder para festivales y fiestas electrónicas en Latinoamérica.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RaveHub",
  },
  icons: {
    icon: "/favicon-ravehub.ico",
    shortcut: "/favicon-ravehub.ico",
    apple: "/icons/icon-192x192.png",
  },
  alternates: {
    canonical: "https://www.weareravehub.com",
    languages: {
      es: "https://www.weareravehub.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: "https://www.weareravehub.com",
    title: "RaveHub - Eventos de música electrónica en Latinoamérica",
    description:
      "Encuentra los mejores eventos de música electrónica, compra entradas y merchandise oficial. La plataforma líder para festivales y fiestas electrónicas en Latinoamérica.",
    siteName: "RaveHub",
    images: [
      {
        url: "https://www.weareravehub.com/electronic-music-festival-night.png",
        width: 1200,
        height: 630,
        alt: "RaveHub - Eventos de música electrónica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RaveHub - Eventos de música electrónica en Latinoamérica",
    description: "Encuentra los mejores eventos de música electrónica, compra entradas y merchandise oficial.",
    images: ["https://www.weareravehub.com/electronic-music-festival-night.png"],
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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RaveHub" />

        {/* Favicon links - ensure they appear on all pages */}
        <link rel="icon" href="/favicon-ravehub.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon-ravehub.ico" />

        {/* Optimización de fuentes */}
        <FontOptimization />
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
