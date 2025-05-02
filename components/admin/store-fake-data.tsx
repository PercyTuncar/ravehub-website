"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from "lucide-react"
import { getProductsForAdmin } from "@/lib/firebase/products"
import { generateFakeProductReviews } from "@/lib/firebase/fake-data"
import { PRODUCT_TYPES } from "@/lib/fake-data/constants"
import type { Product } from "@/types"

// Esquema de validación para el formulario de reseñas de productos
const productReviewsFormSchema = z.object({
  productId: z.string().min(1, "Debes seleccionar un producto"),
  productType: z.string().min(1, "Debes seleccionar un tipo de producto"),
  totalReviews: z.coerce.number().int().positive("El número debe ser positivo"),
  fourStarReviews: z.coerce.number().int().min(0, "El número debe ser positivo o cero"),
  fiveStarReviews: z.coerce.number().int().min(0, "El número debe ser positivo o cero"),
})

export function StoreFakeData() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Formulario
  const form = useForm<z.infer<typeof productReviewsFormSchema>>({
    resolver: zodResolver(productReviewsFormSchema),
    defaultValues: {
      productId: "",
      productType: "",
      totalReviews: 10,
      fourStarReviews: 3,
      fiveStarReviews: 7,
    },
  })

  // Cargar productos al montar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const productsData = await getProductsForAdmin()
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Manejar envío del formulario
  const onSubmit = async (data: z.infer<typeof productReviewsFormSchema>) => {
    try {
      // Validar que la suma de reseñas de 4 y 5 estrellas sea igual al total
      if (data.fourStarReviews + data.fiveStarReviews !== data.totalReviews) {
        toast({
          title: "Error de validación",
          description: "La suma de reseñas de 4 y 5 estrellas debe ser igual al total de reseñas.",
          variant: "destructive",
        })
        return
      }

      setGenerating(true)
      await generateFakeProductReviews(
        data.productId,
        data.productType,
        data.totalReviews,
        data.fourStarReviews,
        data.fiveStarReviews,
      )

      toast({
        title: "Reseñas generadas",
        description: `Se han generado ${data.totalReviews} reseñas para el producto seleccionado.`,
      })

      form.reset({ ...data })
    } catch (error) {
      console.error("Error generating product reviews:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar las reseñas",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  // Validar que la suma de reseñas de 4 y 5 estrellas sea igual al total
  useEffect(() => {
    const totalReviews = form.watch("totalReviews")
    const fourStarReviews = form.watch("fourStarReviews")
    const fiveStarReviews = form.watch("fiveStarReviews")

    if (fourStarReviews + fiveStarReviews > totalReviews) {
      if (fourStarReviews > totalReviews) {
        form.setValue("fourStarReviews", totalReviews)
        form.setValue("fiveStarReviews", 0)
      } else {
        form.setValue("fiveStarReviews", totalReviews - fourStarReviews)
      }
    }
  }, [form.watch("totalReviews"), form.watch("fourStarReviews"), form.watch("fiveStarReviews"), form])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecciona un producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo de producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona el tipo de producto para generar reseñas más específicas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalReviews"
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
                  control={form.control}
                  name="fourStarReviews"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reseñas de 4 estrellas</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fiveStarReviews"
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

              {form.watch("fourStarReviews") + form.watch("fiveStarReviews") !== form.watch("totalReviews") && (
                <div className="text-sm text-red-500">
                  La suma de reseñas de 4 y 5 estrellas debe ser igual al total de reseñas ({form.watch("totalReviews")}
                  ).
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  generating ||
                  form.watch("fourStarReviews") + form.watch("fiveStarReviews") !== form.watch("totalReviews")
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
    </div>
  )
}
