"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "María González",
    role: "Asistente frecuente",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "Ravehub ha transformado mi experiencia asistiendo a eventos. La facilidad para comprar entradas y la opción de pagar en cuotas me ha permitido asistir a más eventos de los que pensaba posible.",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "DJ y Productor",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "Como artista, valoro enormemente la plataforma que Ravehub ofrece. La organización es impecable y la comunidad que han creado es increíble. Siempre es un placer participar en sus eventos.",
    rating: 5,
  },
  {
    id: 3,
    name: "Laura Martínez",
    role: "Coleccionista de merchandise",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "La tienda de Ravehub tiene los mejores productos oficiales. La calidad es excelente y siempre encuentro artículos exclusivos de mis artistas favoritos. ¡Totalmente recomendado!",
    rating: 4,
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Use requestAnimationFrame for smoother transitions
  const changeTestimonial = (index: number) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    setCurrent(index)

    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }

  // Simple auto-rotate with reduced frequency
  useEffect(() => {
    // Skip on slow connections
    if (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType.includes("2g"))) {
      return
    }

    const interval = setInterval(() => {
      changeTestimonial((current + 1) % testimonials.length)
    }, 6000) // Longer duration between transitions

    return () => clearInterval(interval)
  }, [current])

  const next = () => {
    changeTestimonial((current + 1) % testimonials.length)
  }

  const prev = () => {
    changeTestimonial((current - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-16 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="fade-in-up text-center mb-12">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre por qué miles de personas confían en Ravehub para vivir las mejores experiencias musicales.
          </p>
        </div>

        <div className="relative max-w-full">
          <div
            className={`bg-muted/30 rounded-2xl p-8 md:p-12 relative transition-opacity ${isTransitioning ? "opacity-80" : "opacity-100"}`}
          >
            <div className="absolute top-8 right-8 text-primary/20">
              <Quote className="h-16 w-16 md:h-24 md:w-24" />
            </div>

            <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-center">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                  <Image
                    src={testimonials[current].image || "/placeholder.svg"}
                    alt={testimonials[current].name}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-bold">{testimonials[current].name}</h3>
                <p className="text-muted-foreground">{testimonials[current].role}</p>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonials[current].rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="transition-all duration-300">
                <p className="text-lg md:text-xl italic leading-relaxed">"{testimonials[current].content}"</p>
              </div>
            </div>
          </div>

          <button
            onClick={prev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background rounded-full p-2 shadow-lg hover:bg-primary/10 transition-colors"
            aria-label="Testimonio anterior"
            disabled={isTransitioning}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background rounded-full p-2 shadow-lg hover:bg-primary/10 transition-colors"
            aria-label="Testimonio siguiente"
            disabled={isTransitioning}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center mt-6 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => changeTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === current ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ver testimonio ${index + 1}`}
              disabled={isTransitioning}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
