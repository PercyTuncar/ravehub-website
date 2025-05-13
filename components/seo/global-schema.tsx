"use client"

import Script from "next/script"

export function GlobalSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

  // WebSite schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "RaveHub",
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    ],
    inLanguage: "es",
  }

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "RaveHub",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/images/logo-full.png`,
      width: 600,
      height: 60,
    },
    sameAs: [
      "https://www.facebook.com/ravehublatam",
      "https://www.instagram.com/ravehublatam",
      "https://twitter.com/ravehublatam",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+51 944 784 488",
        contactType: "customer service",
        areaServed: ["PE", "CL"],
        availableLanguage: ["Spanish"],
      },
    ],
  }

  return (
    <>
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        strategy="afterInteractive"
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        strategy="afterInteractive"
      />
    </>
  )
}
