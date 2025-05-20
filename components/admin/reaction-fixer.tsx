"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { fixPostReactions, fixAllReactions } from "@/lib/firebase/reaction-fixer"
import { useToast } from "@/components/ui/use-toast"

export function ReactionFixer() {
  const [postId, setPostId] = useState("")
  const [isFixingPost, setIsFixingPost] = useState(false)
  const [isFixingAll, setIsFixingAll] = useState(false)
  const { toast } = useToast()

  const handleFixPost = async () => {
    if (!postId.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce un ID de post válido",
        variant: "destructive",
      })
      return
    }

    try {
      setIsFixingPost(true)
      await fixPostReactions(postId)
      toast({
        title: "Éxito",
        description: `Se han corregido las reacciones para el post ${postId}`,
      })
    } catch (error) {
      console.error("Error al corregir reacciones:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al corregir las reacciones. Consulta la consola para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsFixingPost(false)
    }
  }

  const handleFixAll = async () => {
    try {
      setIsFixingAll(true)
      await fixAllReactions()
      toast({
        title: "Éxito",
        description: "Se han corregido todas las reacciones",
      })
    } catch (error) {
      console.error("Error al corregir todas las reacciones:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al corregir todas las reacciones. Consulta la consola para más detalles.",
        variant: "destructive",
      })
    } finally {
      setIsFixingAll(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Corrector de Reacciones</CardTitle>
        <CardDescription>
          Corrige y normaliza las reacciones para evitar duplicados y problemas de visualización
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="postId">ID del Post</Label>
          <Input
            id="postId"
            placeholder="Introduce el ID del post"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          />
        </div>
        <Button onClick={handleFixPost} disabled={isFixingPost || isFixingAll} className="w-full">
          {isFixingPost ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Corrigiendo...
            </>
          ) : (
            "Corregir Reacciones del Post"
          )}
        </Button>
      </CardContent>
      <CardFooter>
        <Button onClick={handleFixAll} disabled={isFixingPost || isFixingAll} variant="outline" className="w-full">
          {isFixingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Corrigiendo todas las reacciones...
            </>
          ) : (
            "Corregir Todas las Reacciones"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
