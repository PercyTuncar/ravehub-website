"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Album } from "@/types/gallery"
import { createAlbum, updateAlbum } from "@/lib/firebase/gallery"
import { slugify } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const albumSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "La fecha debe tener el formato YYYY-MM-DD" }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" }),
  slug: z
    .string()
    .min(3, { message: "El slug debe tener al menos 3 caracteres" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "El slug solo puede contener letras minúsculas, números y guiones",
    }),
})

type AlbumFormValues = z.infer<typeof albumSchema>

interface AlbumFormProps {
  album?: Album
}

export function AlbumForm({ album }: AlbumFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false)

  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumSchema),
    defaultValues: {
      name: album?.name || "",
      date: album?.date || new Date().toISOString().split("T")[0],
      description: album?.description || "",
      slug: album?.slug || "",
    },
  })

  const watchName = form.watch("name")

  useEffect(() => {
    if (!form.getValues("slug") && watchName) {
      setIsGeneratingSlug(true)
      const generatedSlug = slugify(watchName)
      form.setValue("slug", generatedSlug)
      setIsGeneratingSlug(false)
    }
  }, [watchName, form])

  async function onSubmit(values: AlbumFormValues) {
    setIsSubmitting(true)
    try {
      if (album) {
        // Actualizar álbum existente
        await updateAlbum(album.id, values)
        toast({
          title: "Álbum actualizado",
          description: "El álbum se ha actualizado correctamente",
        })
      } else {
        // Crear nuevo álbum
        const albumId = await createAlbum(values)
        toast({
          title: "Álbum creado",
          description: "El álbum se ha creado correctamente",
        })
        router.push(`/admin/galeria/${albumId}`)
      }
    } catch (error) {
      console.error("Error al guardar el álbum:", error)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el álbum",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{album ? "Editar álbum" : "Crear nuevo álbum"}</CardTitle>
        <CardDescription>
          {album ? "Actualiza la información del álbum existente" : "Crea un nuevo álbum para la galería de imágenes"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del evento</FormLabel>
                  <FormControl>
                    <Input placeholder="EDC México 2025" {...field} />
                  </FormControl>
                  <FormDescription>Nombre del evento o álbum</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del evento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Fecha en que se realizó el evento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el evento y las fotos que contiene este álbum..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Una descripción detallada del evento y las fotos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input placeholder="edc-mexico-2025" {...field} />
                      {isGeneratingSlug && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormDescription>
                    URL amigable para el álbum (se genera automáticamente, pero puedes editarlo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {album ? "Actualizar álbum" : "Crear álbum"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
