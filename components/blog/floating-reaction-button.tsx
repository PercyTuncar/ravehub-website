"use client"

import { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Heart } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { addOrUpdateReaction, getUserReaction, removeReaction } from "@/lib/firebase/blog"
import { useToast } from "@/hooks/use-toast"
import type { ReactionType } from "@/types/blog"

interface FloatingReactionButtonProps {
  postId: string
}

// Definir los emojis de reacciones (usando el mismo mapeo que en el sistema existente)
const reactionEmojis: Record<ReactionType, string> = {
  hot: "🥵",
  crazy: "🤪",
  somos: "👌",
  excited: "😈",
  scream: "🌈",
  ono: "🌸",
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
}

// Definir etiquetas para cada tipo de reacción
const reactionLabels: Record<ReactionType, string> = {
  hot: "Me calienta",
  crazy: "Me aloca",
  somos: "¡Somos, Gente!",
  excited: "Me excita",
  scream: "Me hace gritar",
  ono: "Oño",
  like: "Me gusta",
  love: "Me encanta",
  haha: "Me divierte",
  wow: "Me sorprende",
  sad: "Me entristece",
  angry: "Me enoja",
}

export function FloatingReactionButton({ postId }: FloatingReactionButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Comprobar al inicio
    checkMobile()

    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Cargar la reacción actual del usuario
  useEffect(() => {
    const loadUserReaction = async () => {
      if (!user?.id || !postId) return

      try {
        console.log(`Verificando reacción del usuario: ${user.id} para post: ${postId}`)
        const reaction = await getUserReaction(postId, user.id)
        if (reaction) {
          console.log(`Reacción del usuario encontrada: ${reaction.reactionType}`)
          setUserReaction(reaction.reactionType)
        } else {
          console.log("No se encontró reacción del usuario")
          setUserReaction(null)
        }
      } catch (error) {
        console.error("Error loading user reaction:", error)
      }
    }

    if (user?.id && postId) {
      loadUserReaction()
    } else {
      setUserReaction(null)
    }
  }, [user?.id, postId])

  // Controlar la visibilidad basada en el scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Mostrar después de desplazarse un 25% del contenido
      const scrollThreshold = 0.25
      const scrollPercentage = scrollPosition / (documentHeight - windowHeight)

      if (scrollPercentage > scrollThreshold) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
        setIsOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    // Ejecutar una vez para verificar la posición inicial
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Manejar la selección de reacción (usando la misma lógica del sistema existente)
  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      toast({
        title: "Inicia sesión para reaccionar",
        description: "Debes iniciar sesión para poder reaccionar a este artículo",
        variant: "destructive",
      })
      return
    }

    if (!user.id) {
      console.error("ID de usuario no disponible")
      toast({
        title: "Error",
        description: "No se pudo identificar tu cuenta. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Actualizar el estado local inmediatamente para feedback instantáneo
      const previousReaction = userReaction

      // Si el usuario ya reaccionó con este tipo, simular eliminación
      if (userReaction === type) {
        setUserReaction(null)
      } else {
        // Simular añadir o actualizar la reacción
        setUserReaction(type)
      }

      // Disparar evento de sincronización inmediatamente para otros componentes
      window.dispatchEvent(
        new CustomEvent("reaction-updated", {
          detail: {
            postId,
            userId: user.id,
            reactionType: userReaction === type ? null : type,
            source: "floating-button",
            timestamp: Date.now(),
          },
        }),
      )

      // Ahora realizar la operación en la base de datos
      if (userReaction === type) {
        await removeReaction(postId, user.id)
        console.log("Reacción eliminada correctamente")
        toast({
          title: "Reacción eliminada",
          description: "Tu reacción ha sido eliminada correctamente",
        })
      } else {
        // Añadir o actualizar la reacción
        const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario"
        const userImageUrl = user.photoURL || undefined

        await addOrUpdateReaction(postId, user.id, userName, userImageUrl, type)
        console.log("Reacción guardada correctamente")
        toast({
          title: previousReaction ? "Reacción actualizada" : "¡Gracias por tu reacción!",
          description: `Has reaccionado con "${reactionLabels[type]}"`,
        })
      }
    } catch (error) {
      console.error("Error handling reaction:", error)
      // Revertir al estado anterior en caso de error
      setUserReaction(userReaction)
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu reacción. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const handleReactionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (
        customEvent.detail &&
        customEvent.detail.postId === postId &&
        customEvent.detail.userId === user?.id &&
        customEvent.detail.source !== "floating-button"
      ) {
        // Actualizar el estado local cuando otro componente actualiza la reacción
        setUserReaction(customEvent.detail.reactionType)
      }
    }

    window.addEventListener("reaction-updated", handleReactionUpdate)
    return () => {
      window.removeEventListener("reaction-updated", handleReactionUpdate)
    }
  }, [postId, user?.id])

  // Manejar eventos de hover
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300)
  }

  // Si no es visible, no renderizar nada
  if (!isVisible) return null

  // Determinar la posición según el dispositivo y si el usuario ha iniciado sesión
  const positionClass = isMobile
    ? user
      ? "bottom-20" // Móvil con sesión iniciada (más arriba para evitar el menú inferior)
      : "bottom-6" // Móvil sin sesión iniciada
    : "bottom-6" // Desktop (posición normal)

  return (
    <div
      className={`fixed right-6 z-50 animate-fade-in ${positionClass}`}
      style={{
        animation: "fadeIn 0.5s ease-out forwards",
      }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 relative ${
              userReaction
                ? "bg-primary/15 border-2 border-primary text-primary"
                : "bg-white text-primary hover:bg-primary/10"
            }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={isLoading}
            aria-label={
              userReaction
                ? `Has reaccionado con ${reactionLabels[userReaction]}. Haz clic para cambiar.`
                : "Reaccionar a este artículo"
            }
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <>
                {userReaction ? (
                  <span className="text-2xl drop-shadow-sm">{reactionEmojis[userReaction]}</span>
                ) : (
                  <Heart className="h-5 w-5" />
                )}

                {/* Efecto de pulso sutil */}
                {!userReaction && (
                  <span
                    className="absolute inset-0 rounded-full bg-primary/20 animate-pulse opacity-75"
                    style={{ animationDuration: "3s" }}
                  />
                )}
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-3 rounded-xl shadow-xl border-none bg-white/95 backdrop-blur-sm"
          sideOffset={16}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          align="end"
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-w-[280px] sm:max-w-[360px]">
            {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
              <div
                key={type}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg cursor-pointer transition-all hover:scale-105 hover:bg-gray-100 ${
                  userReaction === type ? "bg-primary/20 ring-2 ring-primary/30" : ""
                }`}
                onClick={() => handleReaction(type)}
                title={reactionLabels[type]}
              >
                <span className="text-2xl mb-1">{reactionEmojis[type]}</span>
                <span className="text-[10px] font-medium text-center text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {reactionLabels[type]}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-xs text-gray-500">
            {userReaction
              ? `Has reaccionado con ${reactionLabels[userReaction]}. Haz clic para cambiar o eliminar.`
              : "¿Qué te pareció este artículo?"}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
