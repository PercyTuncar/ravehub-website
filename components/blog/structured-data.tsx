"use client"

import { useEffect } from "react"
import type { BlogPost } from "@/types/blog"

interface StructuredDataProps {
  post: BlogPost
}

export function StructuredData({ post }: StructuredDataProps) {
  useEffect(() => {
    // Generar y añadir el script de JSON-LD al head
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.id = "post-jsonld"

    // Crear el objeto JSON-LD
    const jsonLd = generateJsonLd(post)

    script.innerHTML = JSON.stringify(jsonLd)

    // Eliminar cualquier script existente con el mismo ID
    const existingScript = document.getElementById("post-jsonld")
    if (existingScript) {
      existingScript.remove()
    }

    // Añadir el nuevo script
    document.head.appendChild(script)

    // Limpiar al desmontar
    return () => {
      const scriptToRemove = document.getElementById("post-jsonld")
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [post])

  return null
}

// Modificar la función generateJsonLd para incluir articleSection y VideoObject

function generateJsonLd(post: BlogPost) {
  const baseUrl = "https://ravehub.es"
  const postUrl = `${baseUrl}/blog/${post.slug}`

  // Estructura básica del JSON-LD
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": post.schemaType || "NewsArticle",
        headline: post.seoTitle || post.title || "",
        description: post.seoDescription || post.excerpt || "",
        author: {
          "@type": "Person",
          name: post.author || "",
          email: post.authorEmail || "",
        },
        datePublished: post.publishDate || new Date().toISOString(),
        dateModified: post.updatedDate || new Date().toISOString(),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": post.canonicalUrl || postUrl,
        },
        image: post.featuredImageUrl,
        publisher: {
          "@type": "Organization",
          name: "Ravehub",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/logo.png`,
          },
        },
        keywords: post.seoKeywords ? post.seoKeywords.join(", ") : "",
        isAccessibleForFree: post.isAccessibleForFree !== false,
        // Agregar articleSection basado en la primera categoría
        articleSection: post.categories && post.categories.length > 0 ? post.categories[0] : "",
      },
      ...(post.faq && post.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: post.faq.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
      // Agregar VideoObject si hay un video embebido
      ...(post.videoEmbedUrl
        ? [
            {
              "@type": "VideoObject",
              name: post.title || "",
              description: post.excerpt || "",
              thumbnailUrl: post.featuredImageUrl || "",
              uploadDate: post.publishDate || new Date().toISOString(),
              contentUrl: post.videoEmbedUrl,
            },
          ]
        : []),
    ],
  }

  return jsonLd
}
