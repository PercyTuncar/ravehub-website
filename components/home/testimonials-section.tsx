"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "María González",
    role: "Asistente frecuente",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "RaveHub ha transformado mi experiencia asistiendo a eventos. La facilidad para comprar entradas y la opción de pagar en cuotas me ha permitido asistir a más eventos de los que pensaba posible.",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "DJ y Productor",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "Como artista, valoro enormemente la plataforma que RaveHub ofrece. La organización es impecable y la comunidad que han creado es increíble. Siempre es un placer participar en sus eventos.",
    rating: 5,
  },
  {
    id: 3,
    name: "Laura Martínez",
    role: "Coleccionista de merchandise",
    image: "/placeholder.svg?height=100&width=100",
    content:
      "La tienda de RaveHub tiene los mejores productos oficiales. La calidad es excelente y siempre encuentro artículos exclusivos de mis artistas favoritos. ¡Totalmente recomendado!",
    rating: 4,
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 px-4 md:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Testimonios
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre por qué miles de personas confían en RaveHub para vivir las mejores experiencias musicales.
          </p>
        </motion.div>

        <div className="relative max-w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-muted/30 rounded-2xl p-8 md:p-12 relative"
            >
              <div className="absolute top-8 right-8 text-primary/20">
                <Quote className="h-24 w-24" />
              </div>

              <div className="grid md:grid-cols-[1fr_2fr] gap-8 items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <Image
                      src={testimonials[current].image || "/placeholder.svg"}
                      alt={testimonials[current].name}
                      fill
                      className="object-cover"
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

                <div>
                  <p className="text-lg md:text-xl italic leading-relaxed">"{testimonials[current].content}"</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={prev}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background rounded-full p-2 shadow-lg hover:bg-primary/10 transition-colors"
            aria-label="Testimonio anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background rounded-full p-2 shadow-lg hover:bg-primary/10 transition-colors"
            aria-label="Testimonio siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center mt-6 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === current ? "bg-primary w-8" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ver testimonio ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
