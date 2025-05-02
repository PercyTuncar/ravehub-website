"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import type { Album } from "@/types/gallery"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useInView } from "react-intersection-observer"
import { Calendar, Camera, ImageIcon } from "lucide-react"

interface AlbumGridProps {
  albums: Album[]
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {albums.map((album, index) => (
        <motion.div
          key={album.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <AlbumCard album={album} />
        </motion.div>
      ))}
    </motion.div>
  )
}

interface AlbumCardProps {
  album: Album
}

function AlbumCard({ album }: AlbumCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  return (
    <Link href={`/galeria/${album.slug}`} passHref>
      <Card
        ref={ref}
        className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-muted/40 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video overflow-hidden">
          {inView && album.coverImage ? (
            <>
              <Image
                src={album.coverImage || "/placeholder.svg"}
                alt={album.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                className={`object-cover transition-all duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${isHovered ? "scale-110" : "scale-100"}`}
                onLoad={() => setLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="h-4 w-4" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          {!loaded && album.coverImage && <div className="absolute inset-0 bg-muted animate-pulse" />}
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-200">
            {album.name}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {formatDate(album.date)}
          </div>
          <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">{album.description}</p>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t flex justify-between items-center">
          <div className="text-sm flex items-center text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
            {album.imageCount || 0} {(album.imageCount || 0) === 1 ? "imagen" : "imágenes"}
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Ver galería</div>
        </CardFooter>
      </Card>
    </Link>
  )
}
