"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, Users, Ticket } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 px-4 md:px-8 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white/20 mb-6">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para vivir la experiencia?</h2>
            <p className="text-xl mb-8 max-w-xl text-primary-foreground/90">
              Regístrate ahora y sé el primero en enterarte de nuevos eventos, ofertas exclusivas y más.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="secondary" className="group">
                <Link href="/registro">
                  <Users className="mr-2 h-5 w-5" />
                  Crear cuenta
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <Link href="/eventos">
                  <Ticket className="mr-2 h-5 w-5" />
                  Ver próximos eventos
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-primary-foreground/80">Eventos anuales</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-primary-foreground/80">Usuarios activos</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-primary-foreground/80">Países</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm p-6 rounded-xl"
            >
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80">Soporte al cliente</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
