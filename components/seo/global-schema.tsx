"use client"

import Script from "next/script"

interface GlobalSchemaProps {
  baseUrl?: string
}

export function GlobalSchema({ baseUrl = "https://www.ravehublatam.com" }: GlobalSchemaProps) {
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
        areaServed: "PE",
        availableLanguage: "Spanish",
      },
      {
        "@type": "ContactPoint",
        telephone: "+56 944 324 385",
        contactType: "customer service",
        areaServed: "CL",
        availableLanguage: "Spanish",
      },
    ],
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "RaveHub",
    description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
    publisher: {
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

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema, null, 2) }}
        strategy="afterInteractive"
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema, null, 2) }}
        strategy="afterInteractive"
      />
    </>
  )
}
