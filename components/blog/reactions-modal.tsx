"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { getUsersByReactionType } from "@/lib/firebase/blog"
import { getReactionInfo } from "./post-reactions"
import type { ReactionType, PostReaction, PostReactionsSummary } from "@/types/blog"

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
      // Resetear el estado cuando se abre el modal
      setReactionUsers([])
      setLastVisible(null)
      setHasMore(true)
      loadReactionUsers(selectedTab)
    }
  }, [isOpen, postId, selectedTab])

  // Configurar el observador de intersección para la carga infinita
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
  }, [hasMore, isLoadingMore, isLoading, reactionUsers])

  // Cargar usuarios que han reaccionado con un tipo específico
  const loadReactionUsers = async (type: ReactionType | "all") => {
    try {
      setIsLoading(true)
      const result = await getUsersByReactionType(postId, type as ReactionType)

      setReactionUsers(result.reactions)
      setLastVisible(result.lastVisible)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error(`Error loading users for reaction type ${type}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar más reacciones cuando el usuario hace scroll
  const loadMoreReactions = async () => {
    if (!hasMore || isLoadingMore || !lastVisible) return

    try {
      setIsLoadingMore(true)
      const result = await getUsersByReactionType(postId, selectedTab as ReactionType, 10, lastVisible)

      setReactionUsers((prev) => [...prev, ...result.reactions])
      setLastVisible(result.lastVisible)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error(`Error loading more reactions:`, error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Manejar el cambio de pestaña
  const handleTabChange = (value: string) => {
    const tabValue = value as ReactionType | "all"
    setSelectedTab(tabValue)
    // Resetear el estado para la nueva pestaña
    setReactionUsers([])
    setLastVisible(null)
    setHasMore(true)
    setIsLoading(true)
    loadReactionUsers(tabValue)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reacciones</DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all">Todas ({reactionsSummary.total})</TabsTrigger>
            {reactionsSummary.topReactions.slice(0, 3).map((type) => (
              <TabsTrigger key={type} value={type}>
                <span className="mr-1">{getReactionInfo(type).emoji}</span>
                <span>{reactionsSummary.types[type] || 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="mt-0">
            <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
              {isLoading ? (
                <div className="flex justify-center items-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reactionUsers.length > 0 ? (
                <div className="space-y-4">
                  {reactionUsers.map((reaction) => (
                    <div key={reaction.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reaction.userImageUrl || ""} alt={reaction.userName} />
                        <AvatarFallback>{reaction.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{reaction.userName}</div>
                      </div>
                      <div className="text-xl">{getReactionInfo(reaction.reactionType).emoji}</div>
                    </div>
                  ))}

                  {/* Elemento de carga para la intersección */}
                  {hasMore && (
                    <div ref={loadingRef} className="flex justify-center items-center py-4">
                      {isLoadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No hay reacciones aún</div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
