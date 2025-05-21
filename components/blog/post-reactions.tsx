"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, AlertCircle, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getPostReactions,
  getUserReaction,
  addOrUpdateReaction,
  removeReaction,
  getUsersByReactionType,
} from "@/lib/firebase/blog"
import { verifyAuthConsistency } from "@/lib/firebase/auth"
import type { ReactionType, PostReaction, PostReactionsSummary } from "@/types/blog"
import { auth } from "@/lib/firebase/config"

// Importar las constantes centralizadas
import { REACTION_INFO, getReactionInfo } from "@/lib/constants/reaction-types"

// Hook para manejar el long press
function useLongPress(callback: () => void, ms = 500) {
  const [startLongPress, setStartLongPress] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update the callback ref whenever the callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (startLongPress) {
      timerRef.current = setTimeout(() => {
        callbackRef.current()
      }, ms)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [ms, startLongPress])

  const start = useCallback(() => {
    setStartLongPress(true)
  }, [])

  const stop = useCallback(() => {
    setStartLongPress(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  }
}

interface PostReactionsProps {
  postId: string
}

// Definición de las reacciones disponibles
const REACTIONS = REACTION_INFO

interface ReactionsModalProps {
  postId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  reactionsSummary: PostReactionsSummary
}

export function ReactionsModal({ postId, isOpen, onOpenChange, reactionsSummary }: ReactionsModalProps) {
  const [selectedTab, setSelectedTab] = useState<ReactionType | "all">("all")
  const [reactionUsers, setReactionUsers] = useState<PostReaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Cargar usuarios que han reaccionado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadReactionUsers("all")
    }
  }, [isOpen, postId])

  useEffect(() => {
    // Desconectar el observador anterior si existe
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Crear un nuevo observador
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreReactions()
        }
      },
      { threshold: 0.5 },
    )

    observerRef.current = observer

    // Observar el elemento de carga si existe
    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, isLoading, reactionUsers, selectedTab, postId])

  const loadMoreReactions = async () => {
    if (!hasMore || isLoadingMore || !lastVisible) return

    try {
      setIsLoadingMore(true)
      const result = await getUsersByReactionType(postId, selectedTab as ReactionType, 10, lastVisible)

      // Ordenar las nuevas reacciones y combinarlas con las existentes
      const sortedNewReactions = result.reactions.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds
        }
        return 0
      })

      setReactionUsers((prev) => [...prev, ...sortedNewReactions])
      setLastVisible(result.lastVisible)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error(`Error loading more reactions:`, error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Cargar usuarios que han reaccionado con un tipo específico
  const loadReactionUsers = async (type: ReactionType | "all") => {
    try {
      setIsLoading(true)
      const result = await getUsersByReactionType(postId, type as ReactionType)

      // Ordenar las reacciones por fecha (más recientes primero)
      setReactionUsers(
        result.reactions.sort((a, b) => {
          // Si tienen timestamp, ordenar por timestamp (más reciente primero)
          if (a.timestamp && b.timestamp) {
            return b.timestamp.seconds - a.timestamp.seconds
          }
          // Si no tienen timestamp, mantener el orden que vino de la base de datos
          return 0
        }),
      )

      setLastVisible(result.lastVisible)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error(`Error loading users for reaction type ${type}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar el cambio de pestaña
  const handleTabChange = (value: string) => {
    const tabValue = value as ReactionType | "all"
    setSelectedTab(tabValue)
    loadReactionUsers(tabValue)
  }

  // Obtener todas las reacciones con conteo > 0 para mostrar en las pestañas
  const activeReactions = Object.entries(reactionsSummary.types)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type: type as ReactionType, count: count as number }))
    .sort((a, b) => b.count - a.count)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[94%] sm:max-w-[90%] md:max-w-lg lg:max-w-xl max-h-[90vh] p-0 overflow-hidden bg-background flex flex-col rounded-lg shadow-lg border mx-auto"
        closeButton={false}
      >
        <div className="flex items-center justify-between border-b p-3 sticky top-0 bg-background z-10">
          <h2 className="text-base font-semibold">Reacciones ({reactionsSummary.total})</h2>
          <DialogClose className="rounded-full hover:bg-muted p-2 transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
          {/* Barra de pestañas de reacciones - Versión mejorada para móviles */}
          <div className="ml-2 border-b sticky top-[49px] bg-background z-10">
            <div className="w-full overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              <div className="flex px-2 py-2 bg-transparent">
                <TabsList className="bg-background/80 backdrop-blur-sm h-auto p-1.5 flex flex-nowrap gap-1.5 rounded-md border shadow-sm w-max whitespace-nowrap">
                  <TabsTrigger
                    value="all"
                    className="flex-shrink-0 h-8 px-3 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium transition-all"
                  >
                    <span className="font-medium">Todas</span>
                    <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{reactionsSummary.total}</span>
                  </TabsTrigger>

                  {/* Mostrar todas las reacciones activas en un diseño más compacto y atractivo */}
                  {activeReactions.map(({ type, count }) => {
                    const { emoji, label } = getReactionInfo(type)
                    return (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="flex items-center justify-center flex-shrink-0 h-8 px-2.5 rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium transition-all"
                        title={label}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{emoji}</span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
                        </div>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
            </div>
          </div>

          <TabsContent value={selectedTab} className="m-0 p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
              <div className="ml-2 space-y-4">
                {isLoading && !reactionUsers.length ? (
                  <div className="flex justify-center items-center h-[200px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reactionUsers.length > 0 ? (
                  reactionUsers.map((reaction) => {
                    const { emoji, label } = getReactionInfo(reaction.reactionType)
                    return (
                      <div key={reaction.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reaction.userImageUrl || ""} alt={reaction.userName} />
                          <AvatarFallback>{reaction.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{reaction.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {getReactionInfo(reaction.reactionType).label}
                          </div>
                        </div>
                        <div className="text-xl">{emoji}</div>
                      </div>
                    )
                  })
                ) : (
                  !isLoading && <div className="text-center py-8 text-muted-foreground">No hay reacciones aún</div>
                )}
                {/* Elemento de carga para la intersección */}
                {hasMore && (
                  <div ref={loadingRef} className="flex justify-center items-center py-4">
                    {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function PostReactions({ postId }: PostReactionsProps) {
  const { user, refreshUserData, authStatus } = useAuth()
  const { toast } = useToast()
  const [reactionsSummary, setReactionsSummary] = useState<PostReactionsSummary>({
    total: 0,
    types: {},
    topReactions: [],
  })
  const [userReaction, setUserReaction] = useState<ReactionType | undefined>(undefined)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [authCheckResult, setAuthCheckResult] = useState<{
    isAuthenticated: boolean
    hasFirestoreData: boolean
    isConsistent: boolean
  } | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null)
  const longPressProps = useLongPress(() => {
    setShowReactionPicker(true)
  }, 400)
  let previousReaction: ReactionType | undefined = undefined // Declare previousReaction here

  // Registrar cambios en el estado de autenticación y actualizar el ID efectivo
  useEffect(() => {
    // Intentar obtener un ID de usuario válido de múltiples fuentes
    const currentAuthUser = auth.currentUser
    const contextUserId = user?.id
    const firebaseAuthId = currentAuthUser?.uid

    // Determinar el ID efectivo del usuario
    const effectiveId = contextUserId || firebaseAuthId || null

    console.log("PostReactions - Estado de autenticación actualizado:", {
      isAuthenticated: !!user || !!currentAuthUser,
      contextUserId,
      firebaseAuthId,
      effectiveUserId: effectiveId,
      userEmail: user?.email || currentAuthUser?.email,
      authInitialized: authStatus.initialized,
      authLastChecked: authStatus.lastChecked,
      authConsistent: authStatus.isConsistent,
      timestamp: new Date().toISOString(),
    })

    setEffectiveUserId(effectiveId)

    // Si tenemos un ID efectivo pero el contexto no tiene ID, refrescar los datos
    if (effectiveId && !contextUserId) {
      console.log("ID efectivo encontrado pero falta en el contexto, refrescando datos...")
      refreshUserData()
    }
  }, [user, authStatus, refreshUserData])

  // Cargar las reacciones al montar el componente o cuando cambia el usuario
  useEffect(() => {
    loadReactions()

    // Crear un sistema de escucha para cambios en las reacciones
    const syncReactions = () => {
      // Verificar si el documento está visible para optimizar recursos
      if (document.visibilityState === "visible" && effectiveUserId) {
        loadReactions(false) // Pasar false para indicar que es una actualización silenciosa
      }
    }

    // Escuchar eventos de visibilidad del documento
    document.addEventListener("visibilitychange", syncReactions)

    // Escuchar un evento personalizado para sincronización de reacciones
    window.addEventListener("reaction-updated", syncReactions)

    // Sincronizar cada 30 segundos si la página está visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible" && effectiveUserId) {
        loadReactions(false) // Actualización silenciosa
      }
    }, 30000)

    return () => {
      document.removeEventListener("visibilitychange", syncReactions)
      window.removeEventListener("reaction-updated", syncReactions)
      clearInterval(intervalId)
    }
  }, [postId, effectiveUserId])

  // Verificar autenticación cuando se monta el componente
  useEffect(() => {
    checkAuthConsistency()
  }, [])

  // Verificar consistencia de autenticación
  const checkAuthConsistency = async () => {
    try {
      const result = await verifyAuthConsistency()
      console.log("Resultado de verificación de consistencia:", result)
      setAuthCheckResult(result)

      // Si hay inconsistencia, mostrar diálogo
      if (!result.isConsistent && result.isAuthenticated && !result.hasFirestoreData) {
        console.log("Inconsistencia detectada: autenticado en Firebase pero sin datos en Firestore")
        setShowAuthDialog(true)
      }
    } catch (error) {
      console.error("Error verificando consistencia de autenticación:", error)
    }
  }

  // Función para depurar las reacciones (solo en desarrollo)
  const debugReactions = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("Resumen de reacciones:", {
        total: reactionsSummary.total,
        types: reactionsSummary.types,
        topReactions: reactionsSummary.topReactions,
      })
    }
  }

  // Llamar a la función de depuración cuando cambian las reacciones
  useEffect(() => {
    debugReactions()
  }, [reactionsSummary])

  // Cargar las reacciones del post
  const loadReactions = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true)
      }

      // Usar un caché local para reducir llamadas a Firestore
      const cacheKey = `reactions_${postId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      const now = Date.now()

      // Si hay datos en caché y tienen menos de 10 segundos, usarlos
      if (cachedData && !showLoadingState) {
        try {
          const { data, timestamp } = JSON.parse(cachedData)
          // Usar caché solo si tiene menos de 10 segundos
          if (now - timestamp < 10000) {
            console.log("Usando datos de reacciones en caché")
            setReactionsSummary(data.summary)

            // Aún así verificar la reacción del usuario por si cambió
            if (effectiveUserId) {
              const userReactionData = await getUserReaction(postId, effectiveUserId)
              if (userReactionData) {
                setUserReaction(userReactionData.reactionType)
              } else {
                setUserReaction(undefined)
              }
            }

            if (showLoadingState) {
              setIsLoading(false)
            }
            return
          }
        } catch (e) {
          console.error("Error parsing cached reactions:", e)
        }
      }

      console.log("Cargando reacciones para post:", postId)
      const reactionsData = await getPostReactions(postId)
      console.log("Reacciones cargadas:", {
        total: reactionsData.summary.total,
        topReactions: reactionsData.summary.topReactions,
      })

      // Normalizar las reacciones para asegurar consistencia
      const normalizedTypes = { ...reactionsData.summary.types }

      // Actualizar el resumen de reacciones con datos normalizados
      setReactionsSummary({
        total: reactionsData.summary.total,
        types: normalizedTypes,
        topReactions: reactionsData.summary.topReactions,
      })

      // Guardar en caché local
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: reactionsData,
            timestamp: now,
          }),
        )
      } catch (e) {
        console.error("Error caching reactions:", e)
      }

      // Si tenemos un ID de usuario efectivo, verificar si ya reaccionó
      if (effectiveUserId) {
        console.log("Verificando reacción del usuario:", effectiveUserId)
        const userReactionData = await getUserReaction(postId, effectiveUserId)
        if (userReactionData) {
          console.log("Reacción del usuario encontrada:", userReactionData.reactionType)
          setUserReaction(userReactionData.reactionType)
        } else {
          console.log("Usuario no ha reaccionado a este post")
          setUserReaction(undefined)
        }
      } else {
        console.log("No hay ID de usuario efectivo para verificar reacciones")
      }
    } catch (error) {
      console.error("Error loading reactions:", error)
      if (showLoadingState) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las reacciones. Inténtalo de nuevo más tarde.",
          variant: "destructive",
        })
        // Establecer un estado de error para mostrar un mensaje adecuado en la UI
        setReactionsSummary({
          total: 0,
          types: {},
          topReactions: [],
        })
      }
    } finally {
      if (showLoadingState) {
        setIsLoading(false)
      }
    }
  }

  // Añadir debounce a handleReactionSelect para evitar múltiples clics rápidos
  const debouncedReactionSelect = debounce(async (type: ReactionType) => {
    // Obtener el ID efectivo del usuario
    const userId = effectiveUserId || auth.currentUser?.uid

    console.log("handleReactionSelect - Estado de autenticación:", {
      isAuthenticated: !!user || !!auth.currentUser,
      contextUserId: user?.id,
      firebaseAuthId: auth.currentUser?.uid,
      effectiveUserId: userId,
      userEmail: user?.email || auth.currentUser?.email,
    })

    // Verificar autenticación antes de procesar
    if (!userId) {
      console.log("Usuario no autenticado o sin ID, verificando consistencia")

      // Verificar si hay inconsistencia de autenticación
      const authCheck = await verifyAuthConsistency()
      setAuthCheckResult(authCheck)

      if (authCheck.isAuthenticated && !authCheck.hasFirestoreData) {
        console.log("Inconsistencia detectada: autenticado en Firebase pero sin datos en Firestore")
        setShowAuthDialog(true)
        return
      }

      toast({
        title: "Inicia sesión para reaccionar",
        description: "Debes iniciar sesión para poder reaccionar a este artículo",
        variant: "destructive",
      })
      return
    }

    // Evitar múltiples clics mientras se procesa
    if (isProcessing) return

    try {
      setIsProcessing(true)

      // Guardar la reacción anterior para posible reversión
      previousReaction = userReaction

      // Actualizar el estado local inmediatamente para feedback instantáneo
      if (userReaction === type) {
        setUserReaction(undefined)
      } else {
        setUserReaction(type)
      }

      // Actualizar el estado local de reacciones para feedback instantáneo
      setReactionsSummary((prevSummary) => {
        const newSummary = { ...prevSummary }
        const types = { ...newSummary.types }

        // Si estamos eliminando una reacción
        if (userReaction === type) {
          if (newSummary.total > 0) newSummary.total -= 1
          if (types[type] && types[type] > 0) types[type] -= 1
        }
        // Si estamos cambiando de una reacción a otra
        else if (userReaction) {
          if (types[userReaction] && types[userReaction] > 0) types[userReaction] -= 1
          types[type] = (types[type] || 0) + 1
        }
        // Si estamos añadiendo una nueva reacción
        else {
          newSummary.total += 1
          types[type] = (types[type] || 0) + 1
        }

        newSummary.types = types

        // Recalcular las reacciones principales
        newSummary.topReactions = Object.entries(types)
          .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
          .slice(0, 3)
          .map(([type]) => type as ReactionType)

        return newSummary
      })

      // Obtener datos de usuario para la reacción
      const userName = user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Usuario"
        : auth.currentUser?.displayName || "Usuario"

      const userPhotoURL = user?.photoURL || auth.currentUser?.photoURL || undefined

      console.log("Procesando reacción:", {
        userId,
        userName,
        currentReaction: userReaction,
        newReaction: type,
      })

      // Disparar evento de sincronización inmediatamente para otros componentes
      window.dispatchEvent(
        new CustomEvent("reaction-updated", {
          detail: {
            postId,
            userId,
            reactionType: userReaction === type ? null : type,
            source: "post-reactions",
            timestamp: Date.now(),
          },
        }),
      )

      // Ahora realizar la operación en la base de datos
      if (userReaction === type) {
        await removeReaction(postId, userId)
        toast({
          title: "Reacción eliminada",
          description: "Tu reacción ha sido eliminada correctamente",
        })
      } else {
        // Añadir o actualizar la reacción (ya sea nueva o cambiando una existente)
        await addOrUpdateReaction(postId, userId, userName, userPhotoURL, type)
        toast({
          title: previousReaction ? "Reacción actualizada" : "Reacción añadida",
          description: `Has reaccionado con "${getReactionInfo(type).label}"`,
        })
      }

      // Recargar las reacciones para actualizar los contadores exactos
      // Usar un timeout para no bloquear la UI
      setTimeout(() => {
        loadReactions(false)
      }, 1000)
    } catch (error) {
      console.error("Error handling reaction:", error)

      // Revertir cambios locales en caso de error
      setUserReaction(previousReaction)

      // Recargar las reacciones para restaurar el estado correcto
      loadReactions()

      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu reacción. Inténtalo nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setShowReactionPicker(false)
    }
  }, 100)

  const handleReactionSelect = (type: ReactionType) => {
    debouncedReactionSelect(type)
  }

  // Manejar la apertura del modal de reacciones
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  // Manejar el refresco manual de datos de usuario
  const handleRefreshUserData = async () => {
    try {
      setIsProcessing(true)
      await refreshUserData()
      await checkAuthConsistency()
      await loadReactions()

      toast({
        title: "Datos actualizados",
        description: "Se han actualizado los datos de tu sesión correctamente",
      })
    } catch (error) {
      console.error("Error al refrescar datos:", error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos. Intenta recargar la página.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setShowAuthDialog(false)
    }
  }

  const renderMainReactionButton = () => {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5 touch-none"
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        disabled={isProcessing}
        {...longPressProps}
      >
        <span className="text-lg select-none">{getReactionInfo(userReaction || "like").emoji}</span>
        <span className="select-none">{userReaction ? getReactionInfo(userReaction).label : "Reaccionar"}</span>
      </Button>
    )
  }

  // Renderizar el resumen de reacciones
  const renderReactionsSummary = () => {
    if (reactionsSummary.total === 0) {
      return <div className="text-sm text-muted-foreground">¡Sé el primero en reaccionar y mostrar lo que piensas!</div>
    }

    // Normalizar y agrupar las reacciones por tipo
    const normalizedReactions = { ...reactionsSummary.types }

    // Asegurarse de que las reacciones estén agrupadas correctamente
    const topReactions = Object.entries(normalizedReactions)
      .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
      .slice(0, 3)
      .map(([type]) => type as ReactionType)

    return (
      <div
        className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleOpenModal}
        role="button"
        aria-label="Ver todas las reacciones"
      >
        {/* Mostrar los emojis de las reacciones más populares */}
        <div className="flex -space-x-1">
          {topReactions.map((type) => (
            <div
              key={type}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-lg shadow-sm border border-background"
            >
              {getReactionInfo(type).emoji}
            </div>
          ))}
        </div>

        {/* Mostrar el total de reacciones */}
        <span className="text-sm text-muted-foreground hover:text-foreground">{reactionsSummary.total}</span>
      </div>
    )
  }

  // Renderizar alerta de estado de autenticación si es necesario
  const renderAuthAlert = () => {
    // Si hay inconsistencia en la autenticación, mostrar alerta
    if (authCheckResult && !authCheckResult.isConsistent) {
      return (
        <Alert variant="warning" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema con tu sesión</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Es posible que tu sesión no esté sincronizada correctamente.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshUserData}
              disabled={isProcessing}
              className="ml-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  useEffect(() => {
    // Escuchar eventos de actualización de reacciones desde otros componentes
    const handleReactionUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (
        customEvent.detail &&
        customEvent.detail.postId === postId &&
        customEvent.detail.source !== "post-reactions"
      ) {
        // Si el evento es para el usuario actual, actualizar su reacción
        if (customEvent.detail.userId === effectiveUserId) {
          setUserReaction(customEvent.detail.reactionType)
        }

        // Recargar las reacciones de forma silenciosa después de un breve retraso
        // para no sobrecargar la base de datos
        setTimeout(() => {
          loadReactions(false)
        }, 500)
      }
    }

    window.addEventListener("reaction-updated", handleReactionUpdate)

    return () => {
      window.removeEventListener("reaction-updated", handleReactionUpdate)
    }
  }, [postId, effectiveUserId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between py-3 px-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
        <div className="flex items-center gap-3">
          {/* Botón principal de reacción con diseño mejorado */}
          <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 touch-none bg-background/80 hover:bg-background shadow-sm border border-border/50 rounded-full px-4 transition-all hover:scale-105"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                disabled={isProcessing}
                {...longPressProps}
              >
                <span className="text-lg select-none">{getReactionInfo(userReaction || "like").emoji}</span>
                <span className="select-none font-medium">
                  {userReaction ? getReactionInfo(userReaction).label : "¿Qué te pareció?"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex flex-wrap gap-2 max-w-xs">
                {REACTIONS.map(({ type, emoji, label }) => (
                  <TooltipProvider key={type}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-full text-xl transition-transform hover:scale-110 select-none",
                            userReaction === type && "bg-primary/10 text-primary",
                          )}
                          onClick={() => handleReactionSelect(type)}
                          disabled={isProcessing}
                        >
                          {emoji}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Separador con estilo mejorado */}
          <Separator orientation="vertical" className="h-6 bg-border/50" />

          {/* Resumen de reacciones */}
          {renderReactionsSummary()}
        </div>

        {/* Texto de ayuda para móviles */}
        <span className="text-xs text-muted-foreground hidden sm:block">Mantén presionado para más opciones</span>
      </div>

      {/* Alerta de estado de autenticación */}
      {renderAuthAlert()}

      {/* Modal de reacciones detalladas */}
      <ReactionsModal
        postId={postId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        reactionsSummary={reactionsSummary}
      />
    </div>
  )
}
