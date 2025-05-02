"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw, Eye, AlertTriangle } from "lucide-react"
import { getAllPosts } from "@/lib/firebase/blog"
import {
  generateFakeViews,
  generateFakeReactions,
  generateFakeComments,
  generateFakeRatings,
  generateFakeSocialShares,
  generateFakePostReactions,
} from "@/lib/firebase/fake-data"
import { REACTION_TYPES, REACTION_EMOJIS } from "@/lib/fake-data/constants"
import type { BlogPost } from "@/types/blog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Esquema de validación para el formulario de vistas
const viewsFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  viewCount: z.coerce.number().int().positive("El número debe ser positivo"),
})

// Esquema para el formulario de reacciones
const reactionsFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  reactionTypes: z.array(z.string()).min(1, "Debes seleccionar al menos un tipo de reacción"),
  reactionCounts: z.record(z.coerce.number().int().min(0, "El número debe ser positivo o cero")),
})

// Esquema para el formulario de comentarios
const commentsFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  commentCount: z.coerce.number().int().positive("El número debe ser positivo"),
})

// Esquema para el formulario de reseñas
const ratingsFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  totalRatings: z.coerce.number().int().positive("El número debe ser positivo"),
  fourStarRatings: z.coerce.number().int().min(0, "El número debe ser positivo o cero"),
  fiveStarRatings: z.coerce.number().int().min(0, "El número debe ser positivo o cero"),
})

// Esquema para el formulario de shares
const sharesFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  totalShares: z.coerce.number().int().positive("El número debe ser positivo"),
  distributionMethod: z.enum(["equal", "random", "custom"]),
  customDistribution: z
    .object({
      facebook: z.coerce.number().int().min(0, "El número debe ser positivo o cero").optional(),
      twitter: z.coerce.number().int().min(0, "El número debe ser positivo o cero").optional(),
      linkedin: z.coerce.number().int().min(0, "El número debe ser positivo o cero").optional(),
      whatsapp: z.coerce.number().int().min(0, "El número debe ser positivo o cero").optional(),
    })
    .optional(),
})

// Esquema para el formulario de reacciones al post
const postReactionsFormSchema = z.object({
  postId: z.string().min(1, "Debes seleccionar un post"),
  totalReactions: z.coerce.number().int().positive("El número debe ser positivo"),
  distributionMethod: z.enum(["equal", "random", "custom"]),
  customDistribution: z.record(z.coerce.number().int().min(0, "El número debe ser positivo o cero")).optional(),
})

export function BlogFakeData() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("views")
  const [generating, setGenerating] = useState(false)

  // Añadimos estos estados para manejar la previsualización y confirmación
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    postTitle: string
    reactionTypes: string[]
    reactionCounts: Record<string, number>
    totalReactions: number
  }>({
    postTitle: "",
    reactionTypes: [],
    reactionCounts: {},
    totalReactions: 0,
  })

  // Formularios
  const viewsForm = useForm<z.infer<typeof viewsFormSchema>>({
    resolver: zodResolver(viewsFormSchema),
    defaultValues: {
      postId: "",
      viewCount: 100,
    },
  })

  const reactionsForm = useForm<z.infer<typeof reactionsFormSchema>>({
    resolver: zodResolver(reactionsFormSchema),
    defaultValues: {
      postId: "",
      reactionTypes: [],
      reactionCounts: {},
    },
  })

  const commentsForm = useForm<z.infer<typeof commentsFormSchema>>({
    resolver: zodResolver(commentsFormSchema),
    defaultValues: {
      postId: "",
      commentCount: 10,
    },
  })

  const ratingsForm = useForm<z.infer<typeof ratingsFormSchema>>({
    resolver: zodResolver(ratingsFormSchema),
    defaultValues: {
      postId: "",
      totalRatings: 10,
      fourStarRatings: 3,
      fiveStarRatings: 7,
    },
  })

  const sharesForm = useForm<z.infer<typeof sharesFormSchema>>({
    resolver: zodResolver(sharesFormSchema),
    defaultValues: {
      postId: "",
      totalShares: 50,
      distributionMethod: "random",
      customDistribution: {
        facebook: 0,
        twitter: 0,
        linkedin: 0,
        whatsapp: 0,
      },
    },
  })

  const postReactionsForm = useForm<z.infer<typeof postReactionsFormSchema>>({
    resolver: zodResolver(postReactionsFormSchema),
    defaultValues: {
      postId: "",
      totalReactions: 20,
      distributionMethod: "random",
      customDistribution: REACTION_TYPES.reduce((acc, type) => ({ ...acc, [type]: 0 }), {}),
    },
  })

  // Cargar posts al montar el componente
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const { posts: fetchedPosts } = await getAllPosts(1, 100)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error("Error fetching posts:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los posts",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Manejar envío del formulario de vistas
  const onSubmitViews = async (data: z.infer<typeof viewsFormSchema>) => {
    try {
      setGenerating(true)
      await generateFakeViews(data.postId, data.viewCount)
      toast({
        title: "Vistas generadas",
        description: `Se han generado ${data.viewCount} vistas para el post seleccionado.`,
      })
      viewsForm.reset({ ...data })
    } catch (error) {
      console.error("Error generating views:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las vistas",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Modificamos el manejador de envío para mostrar el diálogo de confirmación en lugar de ejecutar directamente
  const onSubmitReactions = (data: z.infer<typeof reactionsFormSchema>) => {
    // Encontrar el título del post seleccionado
    const selectedPost = posts.find((post) => post.id === data.postId)
    const postTitle = selectedPost?.title || "Post desconocido"

    // Calcular el total de reacciones
    const totalReactions = data.reactionTypes.reduce((acc, type) => acc + (data.reactionCounts[type] || 0), 0)

    // Preparar los datos para la previsualización
    setPreviewData({
      postTitle,
      reactionTypes: data.reactionTypes,
      reactionCounts: data.reactionCounts,
      totalReactions,
    })

    // Abrir el diálogo de confirmación
    setConfirmDialogOpen(true)
  }

  // Función para ejecutar la generación después de la confirmación
  const executeReactionsGeneration = async () => {
    try {
      setGenerating(true)
      setConfirmDialogOpen(false)

      const data = reactionsForm.getValues()
      const reactionData = data.reactionTypes.reduce(
        (acc, type) => ({
          ...acc,
          [type]: data.reactionCounts[type] || 0,
        }),
        {},
      )

      await generateFakeReactions(data.postId, reactionData)

      toast({
        title: "Reacciones generadas",
        description: `Se han generado las reacciones para el post seleccionado.`,
      })

      // No reseteamos el formulario para permitir generar más reacciones con los mismos valores
    } catch (error) {
      console.error("Error generating reactions:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las reacciones",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Función para mostrar la previsualización
  const handleShowPreview = () => {
    const data = reactionsForm.getValues()

    // Validar el formulario antes de mostrar la previsualización
    if (!data.postId || data.reactionTypes.length === 0) {
      toast({
        title: "Datos incompletos",
        description: "Por favor, selecciona un post y al menos un tipo de reacción",
        variant: "destructive",
      })
      return
    }

    // Encontrar el título del post seleccionado
    const selectedPost = posts.find((post) => post.id === data.postId)
    const postTitle = selectedPost?.title || "Post desconocido"

    // Calcular el total de reacciones
    const totalReactions = data.reactionTypes.reduce((acc, type) => acc + (data.reactionCounts[type] || 0), 0)

    // Preparar los datos para la previsualización
    setPreviewData({
      postTitle,
      reactionTypes: data.reactionTypes,
      reactionCounts: data.reactionCounts,
      totalReactions,
    })

    // Abrir el modal de previsualización
    setPreviewOpen(true)
  }

  // Manejar envío del formulario de comentarios
  const onSubmitComments = async (data: z.infer<typeof commentsFormSchema>) => {
    try {
      setGenerating(true)
      await generateFakeComments(data.postId, data.commentCount)
      toast({
        title: "Comentarios generados",
        description: `Se han generado ${data.commentCount} comentarios para el post seleccionado.`,
      })
      commentsForm.reset({ ...data })
    } catch (error) {
      console.error("Error generating comments:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar los comentarios",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Manejar envío del formulario de reseñas
  const onSubmitRatings = async (data: z.infer<typeof ratingsFormSchema>) => {
    try {
      setGenerating(true)

      // Convertir valores a números para asegurar una comparación correcta
      const totalRatings = Number(data.totalRatings)
      const fourStarRatings = Number(data.fourStarRatings)
      const fiveStarRatings = Number(data.fiveStarRatings)

      // Validar que la suma de reseñas de 4 y 5 estrellas sea igual al total
      if (fourStarRatings + fiveStarRatings !== totalRatings) {
        toast({
          title: "Error de validación",
          description: "La suma de reseñas de 4 y 5 estrellas debe ser igual al total de reseñas.",
          variant: "destructive",
        })
        setGenerating(false)
        return
      }

      await generateFakeRatings(data.postId, totalRatings, fourStarRatings, fiveStarRatings)
      toast({
        title: "Reseñas generadas",
        description: `Se han generado ${totalRatings} reseñas para el post seleccionado.`,
      })
      ratingsForm.reset({ ...data })
    } catch (error) {
      console.error("Error generating ratings:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las reseñas",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Manejar envío del formulario de shares
  const onSubmitShares = async (data: z.infer<typeof sharesFormSchema>) => {
    try {
      setGenerating(true)

      let distribution: Record<string, number> = {}

      if (data.distributionMethod === "custom" && data.customDistribution) {
        distribution = data.customDistribution as Record<string, number>

        // Validar que la suma de la distribución personalizada sea igual al total
        const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0)
        if (sum !== data.totalShares) {
          toast({
            title: "Error de validación",
            description: "La suma de la distribución personalizada debe ser igual al total de shares.",
            variant: "destructive",
          })
          return
        }
      }

      await generateFakeSocialShares(data.postId, data.totalShares, data.distributionMethod, distribution)
      toast({
        title: "Shares generados",
        description: `Se han generado ${data.totalShares} shares para el post seleccionado.`,
      })
      sharesForm.reset({ ...data })
    } catch (error) {
      console.error("Error generating shares:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar los shares",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Manejar envío del formulario de reacciones al post
  const onSubmitPostReactions = async (data: z.infer<typeof postReactionsFormSchema>) => {
    try {
      setGenerating(true)

      let distribution: Record<string, number> = {}

      if (data.distributionMethod === "custom" && data.customDistribution) {
        distribution = data.customDistribution

        // Validar que la suma de la distribución personalizada sea igual al total
        const sum = Object.values(distribution).reduce((acc, val) => acc + val, 0)
        if (sum !== data.totalReactions) {
          toast({
            title: "Error de validación",
            description: "La suma de la distribución personalizada debe ser igual al total de reacciones.",
            variant: "destructive",
          })
          return
        }
      }

      await generateFakePostReactions(data.postId, data.totalReactions, data.distributionMethod, distribution)
      toast({
        title: "Reacciones generadas",
        description: `Se han generado ${data.totalReactions} reacciones para el post seleccionado.`,
      })
      postReactionsForm.reset({ ...data })
    } catch (error) {
      console.error("Error generating post reactions:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las reacciones",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Manejar cambio en los tipos de reacción seleccionados
  const handleReactionTypesChange = (checked: boolean, value: string) => {
    const currentTypes = reactionsForm.getValues("reactionTypes")
    const updatedTypes = checked ? [...currentTypes, value] : currentTypes.filter((type) => type !== value)

    reactionsForm.setValue("reactionTypes", updatedTypes)

    // Si se deselecciona un tipo, establecer su contador a 0
    if (!checked) {
      const counts = reactionsForm.getValues("reactionCounts")
      reactionsForm.setValue("reactionCounts", {
        ...counts,
        [value]: 0,
      })
    }
  }

  // Actualizar distribución personalizada de shares cuando cambia el método
  useEffect(() => {
    const method = sharesForm.watch("distributionMethod")
    const totalShares = sharesForm.watch("totalShares")

    if (method === "equal") {
      const sharePerPlatform = Math.floor(totalShares / 4)
      const remainder = totalShares % 4

      sharesForm.setValue("customDistribution", {
        facebook: sharePerPlatform + (remainder > 0 ? 1 : 0),
        twitter: sharePerPlatform + (remainder > 1 ? 1 : 0),
        linkedin: sharePerPlatform + (remainder > 2 ? 1 : 0),
        whatsapp: sharePerPlatform,
      })
    }
  }, [sharesForm.watch("distributionMethod"), sharesForm.watch("totalShares"), sharesForm])

  // Actualizar distribución personalizada de reacciones al post cuando cambia el método
  useEffect(() => {
    const method = postReactionsForm.watch("distributionMethod")
    const totalReactions = postReactionsForm.watch("totalReactions")

    if (method === "equal") {
      const reactionPerType = Math.floor(totalReactions / REACTION_TYPES.length)
      const remainder = totalReactions % REACTION_TYPES.length

      const distribution = REACTION_TYPES.reduce(
        (acc, type, index) => ({
          ...acc,
          [type]: reactionPerType + (index < remainder ? 1 : 0),
        }),
        {},
      )

      postReactionsForm.setValue("customDistribution", distribution)
    }
  }, [postReactionsForm.watch("distributionMethod"), postReactionsForm.watch("totalReactions"), postReactionsForm])

  // Validar que la suma de reseñas de 4 y 5 estrellas sea igual al total
  useEffect(() => {
    const totalRatings = Number(ratingsForm.watch("totalRatings"))
    const fourStarRatings = Number(ratingsForm.watch("fourStarRatings"))
    const fiveStarRatings = Number(ratingsForm.watch("fiveStarRatings"))

    // Si el total cambia, ajustar automáticamente las reseñas de 5 estrellas
    if (fourStarRatings + fiveStarRatings !== totalRatings) {
      // Si las reseñas de 4 estrellas son mayores que el total, ajustarlas
      if (fourStarRatings > totalRatings) {
        ratingsForm.setValue("fourStarRatings", totalRatings)
        ratingsForm.setValue("fiveStarRatings", 0)
      } else {
        // Ajustar las reseñas de 5 estrellas para que la suma sea igual al total
        ratingsForm.setValue("fiveStarRatings", Math.max(0, totalRatings - fourStarRatings))
      }
    }
  }, [
    ratingsForm.watch("totalRatings"),
    ratingsForm.watch("fourStarRatings"),
    ratingsForm.watch("fiveStarRatings"),
    ratingsForm,
  ])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="views">Vistas</TabsTrigger>
          <TabsTrigger value="reactions">Reacciones</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="ratings">Reseñas</TabsTrigger>
          <TabsTrigger value="shares">Shares</TabsTrigger>
          <TabsTrigger value="postReactions">Reacciones al Post</TabsTrigger>
        </TabsList>

        {/* Formulario de Vistas */}
        <TabsContent value="views">
          <Card>
            <CardContent className="pt-6">
              <Form {...viewsForm}>
                <form onSubmit={viewsForm.handleSubmit(onSubmitViews)} className="space-y-6">
                  <FormField
                    control={viewsForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={viewsForm.control}
                    name="viewCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de vistas</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Ingresa el número de vistas que deseas asignar al post.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Vistas
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulario de Reacciones */}
        <TabsContent value="reactions">
          <Card>
            <CardContent className="pt-6">
              <Form {...reactionsForm}>
                <form onSubmit={reactionsForm.handleSubmit(onSubmitReactions)} className="space-y-6">
                  <FormField
                    control={reactionsForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={reactionsForm.control}
                    name="reactionTypes"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tipos de reacciones</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {REACTION_TYPES.map((type) => (
                            <FormField
                              key={type}
                              control={reactionsForm.control}
                              name="reactionTypes"
                              render={({ field }) => {
                                return (
                                  <FormItem key={type} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(type)}
                                        onCheckedChange={(checked) => {
                                          handleReactionTypesChange(!!checked, type)
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="flex items-center space-x-2 cursor-pointer">
                                      <span>{REACTION_EMOJIS[type]}</span>
                                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {reactionsForm.watch("reactionTypes").length > 0 && (
                    <div className="space-y-4">
                      <FormLabel>Cantidad por tipo de reacción</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reactionsForm.watch("reactionTypes").map((type) => (
                          <FormField
                            key={type}
                            control={reactionsForm.control}
                            name={`reactionCounts.${type}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <span>{REACTION_EMOJIS[type]}</span>
                                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                    value={field.value || 0}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleShowPreview}
                      disabled={reactionsForm.watch("reactionTypes").length === 0}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Previsualizar
                    </Button>
                    <Button type="submit" disabled={generating || reactionsForm.watch("reactionTypes").length === 0}>
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Generar Reacciones
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulario de Comentarios */}
        <TabsContent value="comments">
          <Card>
            <CardContent className="pt-6">
              <Form {...commentsForm}>
                <form onSubmit={commentsForm.handleSubmit(onSubmitComments)} className="space-y-6">
                  <FormField
                    control={commentsForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={commentsForm.control}
                    name="commentCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de comentarios</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingresa el número de comentarios que deseas generar para el post.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={generating}>
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Comentarios
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulario de Reseñas */}
        <TabsContent value="ratings">
          <Card>
            <CardContent className="pt-6">
              <Form {...ratingsForm}>
                <form onSubmit={ratingsForm.handleSubmit(onSubmitRatings)} className="space-y-6">
                  <FormField
                    control={ratingsForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ratingsForm.control}
                    name="totalRatings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número total de reseñas</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Ingresa el número total de reseñas que deseas generar.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={ratingsForm.control}
                      name="fourStarRatings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reseñas de 4 estrellas</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                const value = Number.parseInt(e.target.value) || 0
                                field.onChange(value)
                                // Ajustar automáticamente las reseñas de 5 estrellas
                                const total = Number(ratingsForm.getValues("totalRatings"))
                                ratingsForm.setValue("fiveStarRatings", Math.max(0, total - value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ratingsForm.control}
                      name="fiveStarRatings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reseñas de 5 estrellas</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {(() => {
                    const total = Number(ratingsForm.watch("totalRatings"))
                    const four = Number(ratingsForm.watch("fourStarRatings"))
                    const five = Number(ratingsForm.watch("fiveStarRatings"))
                    const sum = four + five
                    return sum !== total ? (
                      <div className="text-sm text-red-500">
                        La suma de reseñas de 4 estrellas ({four}) y 5 estrellas ({five}) debe ser igual al total de
                        reseñas ({total}). Actualmente: {four} + {five} = {sum}
                      </div>
                    ) : (
                      <div className="text-sm text-green-500">
                        La distribución es correcta: {four} + {five} = {total}
                      </div>
                    )
                  })()}

                  <Button
                    type="submit"
                    disabled={
                      generating ||
                      Number(ratingsForm.watch("fourStarRatings")) + Number(ratingsForm.watch("fiveStarRatings")) !==
                        Number(ratingsForm.watch("totalRatings"))
                    }
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Reseñas
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulario de Shares */}
        <TabsContent value="shares">
          <Card>
            <CardContent className="pt-6">
              <Form {...sharesForm}>
                <form onSubmit={sharesForm.handleSubmit(onSubmitShares)} className="space-y-6">
                  <FormField
                    control={sharesForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sharesForm.control}
                    name="totalShares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número total de shares</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ingresa el número total de veces compartidas que deseas generar.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sharesForm.control}
                    name="distributionMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de distribución</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="equal" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución equitativa</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="random" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución aleatoria</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="custom" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución personalizada</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {sharesForm.watch("distributionMethod") === "custom" && (
                    <div className="space-y-4">
                      <FormLabel>Distribución personalizada</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={sharesForm.control}
                          name="customDistribution.facebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sharesForm.control}
                          name="customDistribution.twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sharesForm.control}
                          name="customDistribution.linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sharesForm.control}
                          name="customDistribution.whatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>WhatsApp</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {sharesForm.watch("distributionMethod") === "custom" && (
                        <div className="text-sm">
                          Total:{" "}
                          {Object.values(sharesForm.watch("customDistribution") || {}).reduce(
                            (acc, val) => acc + (val || 0),
                            0,
                          )}{" "}
                          / {sharesForm.watch("totalShares")}
                          {Object.values(sharesForm.watch("customDistribution") || {}).reduce(
                            (acc, val) => acc + (val || 0),
                            0,
                          ) !== sharesForm.watch("totalShares") && (
                            <span className="text-red-500 ml-2">La suma debe ser igual al total de shares.</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      generating ||
                      (sharesForm.watch("distributionMethod") === "custom" &&
                        Object.values(sharesForm.watch("customDistribution") || {}).reduce(
                          (acc, val) => acc + (val || 0),
                          0,
                        ) !== sharesForm.watch("totalShares"))
                    }
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Shares
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Formulario de Reacciones al Post */}
        <TabsContent value="postReactions">
          <Card>
            <CardContent className="pt-6">
              <Form {...postReactionsForm}>
                <form onSubmit={postReactionsForm.handleSubmit(onSubmitPostReactions)} className="space-y-6">
                  <FormField
                    control={postReactionsForm.control}
                    name="postId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selecciona un post</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un post" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {posts.map((post) => (
                              <SelectItem key={post.id} value={post.id}>
                                {post.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={postReactionsForm.control}
                    name="totalReactions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número total de reacciones</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>Ingresa el número total de reacciones que deseas generar.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={postReactionsForm.control}
                    name="distributionMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de distribución</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="equal" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución equitativa</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="random" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución aleatoria</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="custom" />
                              </FormControl>
                              <FormLabel className="font-normal">Distribución personalizada</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {postReactionsForm.watch("distributionMethod") === "custom" && (
                    <div className="space-y-4">
                      <FormLabel>Distribución personalizada</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {REACTION_TYPES.map((type) => (
                          <FormField
                            key={type}
                            control={postReactionsForm.control}
                            name={`customDistribution.${type}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center space-x-2">
                                  <span>{REACTION_EMOJIS[type]}</span>
                                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                                    value={field.value || 0}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>

                      {postReactionsForm.watch("distributionMethod") === "custom" && (
                        <div className="text-sm">
                          Total:{" "}
                          {Object.values(postReactionsForm.watch("customDistribution") || {}).reduce(
                            (acc, val) => acc + (val || 0),
                            0,
                          )}{" "}
                          / {postReactionsForm.watch("totalReactions")}
                          {Object.values(postReactionsForm.watch("customDistribution") || {}).reduce(
                            (acc, val) => acc + (val || 0),
                            0,
                          ) !== postReactionsForm.watch("totalReactions") && (
                            <span className="text-red-500 ml-2">La suma debe ser igual al total de reacciones.</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={
                      generating ||
                      (postReactionsForm.watch("distributionMethod") === "custom" &&
                        Object.values(postReactionsForm.watch("customDistribution") || {}).reduce(
                          (acc, val) => acc + (val || 0),
                          0,
                        ) !== postReactionsForm.watch("totalReactions"))
                    }
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generar Reacciones
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Previsualización */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Previsualización de Reacciones</DialogTitle>
            <DialogDescription>
              Así es como se verán las reacciones generadas para el post seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Post: {previewData.postTitle}</h4>
              <p className="text-sm text-muted-foreground">Total de reacciones: {previewData.totalReactions}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {previewData.reactionTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{REACTION_EMOJIS[type]}</span>
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="font-medium">{previewData.reactionCounts[type] || 0}</span>
                </div>
              ))}
            </div>

            {previewData.totalReactions > 100 && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>
                  Estás generando un gran número de reacciones ({previewData.totalReactions}). Esto podría afectar el
                  rendimiento de la base de datos.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar generación de reacciones</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas generar estas reacciones para el post "{previewData.postTitle}"?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Se generarán un total de <strong>{previewData.totalReactions}</strong> reacciones:
            </p>
            <ul className="mt-2 space-y-1">
              {previewData.reactionTypes.map((type) => (
                <li key={type} className="text-sm flex items-center space-x-2">
                  <span>{REACTION_EMOJIS[type]}</span>
                  <span className="capitalize">{type}:</span>
                  <span className="font-medium">{previewData.reactionCounts[type] || 0}</span>
                </li>
              ))}
            </ul>

            {previewData.totalReactions > 100 && (
              <Alert className="mt-4" variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>
                  Estás generando un gran número de reacciones. Esta operación no se puede deshacer.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeReactionsGeneration} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Confirmar y Generar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
