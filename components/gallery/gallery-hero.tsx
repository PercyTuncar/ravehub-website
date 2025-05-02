"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Camera, ImageIcon } from "lucide-react"

export function GalleryHero() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="relative overflow-hidden bg-black">
      {/* Fondo con efecto de paralaje */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gallery-hero.jpg"
          alt="Galería de imágenes"
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
          onLoad={() => setLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      {/* Contenido del hero */}
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/20 backdrop-blur-sm mb-4">
            <Camera className="w-6 h-6 text-primary" />
          </div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Galería de Momentos
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Revive los mejores momentos de nuestros eventos a través de imágenes que capturan la esencia de cada
            experiencia
          </motion.p>
        </motion.div>

        {/* Elementos decorativos flotantes */}
        <div className="absolute top-1/4 left-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: loaded ? 0.7 : 0, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <ImageIcon className="w-12 h-12 text-white/30" />
          </motion.div>
        </div>

        <div className="absolute bottom-1/4 right-10 hidden lg:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
            animate={{ opacity: loaded ? 0.7 : 0, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <Camera className="w-10 h-10 text-white/30" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
