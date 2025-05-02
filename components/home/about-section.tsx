"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CheckCircle, ArrowRight } from "lucide-react"
import Image from "next/image"

export function AboutSection() {
  const features = [
    "Eventos exclusivos de música electrónica",
    "Pagos en cuotas sin interés",
    "Merchandise oficial de artistas",
    "Experiencias VIP personalizadas",
    "Comunidad de amantes de la música",
    "Soporte al cliente 24/7",
  ]

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-muted/50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Quiénes Somos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Sobre RaveHub</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Conectamos a los amantes de la música con los mejores eventos, artistas y productos en Latinoamérica.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="order-2 md:order-1"
          >
            <div className="relative h-[350px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl group bg-muted">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/event-ticket-website-6b541.firebasestorage.app/o/rave-1-_1_-min.webp?alt=media&token=c1d8ad9c-7131-4174-9c0c-dbc52fb2af28"
                alt="Comunidad RaveHub en Road to Ultra Ecuador"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover w-full h-full transform scale-110 transition-transform duration-700 group-hover:scale-125"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.onerror = null
                  target.src = "/images/placeholder-blog.jpg"
                }}
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="order-1 md:order-2"
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              La plataforma líder en eventos de música electrónica
            </h3>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 text-muted-foreground">
              RaveHub es la plataforma líder en eventos de música electrónica en Latinoamérica. Conectamos a los amantes
              de la música con los mejores eventos, artistas y productos.
            </p>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-muted-foreground">
              Ofrecemos opciones flexibles de pago, incluyendo pagos en cuotas, para que nunca te pierdas tu evento
              favorito.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base">{feature}</span>
                </motion.div>
              ))}
            </div>

            <Button asChild size="lg" className="w-full sm:w-auto group">
              <Link href="/nosotros">
                Conoce más sobre nosotros
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
