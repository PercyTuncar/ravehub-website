"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminEventsList } from "@/components/admin/admin-events-list"
import { AdminProductsList } from "@/components/admin/admin-products-list"
import { AdminOrdersList } from "@/components/admin/admin-orders-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { AdminPostsList } from "@/components/admin/admin-posts-list"
import { AdminCommentsList } from "@/components/admin/admin-comments-list"
// Añadir el import para el ícono de reseñas
import {
  CalendarDays,
  ShoppingBag,
  Package,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Tag,
  Star,
  Megaphone,
  Database,
  ImageIcon,
  DollarSign,
  TicketCheck,
} from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { BlogCategory } from "@/types"
import { AdminReviewsList } from "@/components/admin/admin-reviews-list"
import { AdminCategoriesList } from "@/components/admin/admin-categories-list"
import { AdminTicketsList } from "@/components/admin/admin-tickets-list"

export function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("eventos")
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      if (activeTab === "categorias") {
        setLoadingCategories(true)
        try {
          // Verificar que estamos accediendo a la colección correcta
          const categoriesRef = collection(db, "blogCategories")

          // Simplificar la consulta para evitar problemas con campos inexistentes
          const querySnapshot = await getDocs(categoriesRef)

          // Verificar si hay documentos
          console.log("Número de documentos encontrados:", querySnapshot.size)

          if (querySnapshot.empty) {
            console.log("La colección blogCategories está vacía")
            setCategories([])
          } else {
            // Mapear los documentos a objetos de categoría
            const blogCategories = querySnapshot.docs.map((doc) => {
              const data = doc.data()
              console.log("Datos de categoría:", doc.id, data)
              return {
                id: doc.id,
                name: data.name || "Sin nombre",
                slug: data.slug || "",
                order: data.order || 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
                ...data,
              }
            })

            console.log("Categorías procesadas:", blogCategories)
            setCategories(blogCategories)
          }
        } catch (error) {
          console.error("Error al cargar categorías:", error)
          // Mostrar el error específico para depuración
          if (error instanceof Error) {
            console.error("Mensaje de error:", error.message)
            console.error("Stack trace:", error.stack)
          }
          setCategories([])
        } finally {
          setLoadingCategories(false)
        }
      }
    }

    fetchCategories()
  }, [activeTab])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            Ver sitio
          </Button>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/ctas">
            <Megaphone className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Gestionar CTAs</div>
              <div className="text-xs text-muted-foreground">Llamadas a la acción</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/reviews">
            <Star className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Gestionar Reseñas</div>
              <div className="text-xs text-muted-foreground">Opiniones de usuarios</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/fake-data">
            <Database className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Datos Falsos</div>
              <div className="text-xs text-muted-foreground">Generar datos de prueba</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/store/banners">
            <ImageIcon className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Banners</div>
              <div className="text-xs text-muted-foreground">Banners de tienda</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/settings/currency-settings">
            <DollarSign className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Monedas</div>
              <div className="text-xs text-muted-foreground">Configuración de divisas</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/blog/categorias">
            <Tag className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Categorías Blog</div>
              <div className="text-xs text-muted-foreground">Gestionar categorías</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin/categories">
            <Tag className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Categorías Tienda</div>
              <div className="text-xs text-muted-foreground">Gestionar categorías</div>
            </div>
          </Link>
        </Button>

        <Button variant="outline" asChild className="h-auto py-4 justify-start">
          <Link href="/admin">
            <TicketCheck className="h-5 w-5 mr-2" />
            <div className="text-left">
              <div className="font-medium">Entradas</div>
              <div className="text-xs text-muted-foreground">Gestionar tickets</div>
            </div>
          </Link>
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Galería</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión de Galería</div>
            <p className="text-xs text-muted-foreground">Administra álbumes y fotos</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="/admin/galeria">Ir a Galería</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Modificar la TabsList para incluir la pestaña de reseñas */}
        <TabsList className="grid grid-cols-4 md:grid-cols-9 gap-2">
          <TabsTrigger value="eventos" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="productos" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Productos</span>
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <Package className="h-4 w-4" />
            <span>Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <Users className="h-4 w-4" />
            <span>Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="blog" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <FileText className="h-4 w-4" />
            <span>Blog</span>
          </TabsTrigger>
          <TabsTrigger value="comentarios" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Comentarios</span>
          </TabsTrigger>
          <TabsTrigger value="reseñas" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <Star className="h-4 w-4" />
            <span>Reseñas</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <TicketCheck className="h-4 w-4" />
            <span>Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <Tag className="h-4 w-4" />
            <span>Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="ajustes" className="flex flex-col md:flex-row items-center gap-1 md:gap-2">
            <Settings className="h-4 w-4" />
            <span>Ajustes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="space-y-4">
          <AdminEventsList />
        </TabsContent>

        <TabsContent value="productos" className="space-y-4">
          <AdminProductsList />
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <AdminOrdersList />
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-4">
          <AdminUsersList />
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <AdminPostsList />
        </TabsContent>

        <TabsContent value="comentarios" className="space-y-4">
          <AdminCommentsList />
        </TabsContent>

        {/* Añadir el TabsContent para la pestaña de reseñas después del TabsContent de comentarios */}
        <TabsContent value="reseñas" className="space-y-4">
          <AdminReviewsList />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <AdminTicketsList />
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <AdminCategoriesList />
        </TabsContent>

        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorías del Blog</CardTitle>
              <CardDescription>Gestiona las categorías para los artículos del blog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button asChild>
                  <Link href="/admin/blog/categorias/new">Nueva Categoría</Link>
                </Button>
              </div>

              {loadingCategories ? (
                <div className="text-center py-8 text-muted-foreground">Cargando categorías...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay categorías disponibles. Verifica la consola para más detalles.
                </div>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-medium">Nombre</th>
                        <th className="p-3 text-left font-medium">Slug</th>
                        <th className="p-3 text-left font-medium">Orden</th>
                        <th className="p-3 text-left font-medium">Estado</th>
                        <th className="p-3 text-right font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{category.name}</td>
                          <td className="p-3">{category.slug}</td>
                          <td className="p-3">{category.order || 0}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${category.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                            >
                              {category.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/blog/categorias/${category.id}/edit`}>Editar</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ajustes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajustes</CardTitle>
              <CardDescription>Configura los ajustes generales de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" asChild className="h-auto py-4 justify-start">
                  <Link href="/admin/settings/currency-settings">
                    <DollarSign className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Configuración de Monedas</div>
                      <div className="text-xs text-muted-foreground">Gestionar divisas y tipos de cambio</div>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" asChild className="h-auto py-4 justify-start">
                  <Link href="/admin/settings/general">
                    <Settings className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Configuración General</div>
                      <div className="text-xs text-muted-foreground">Ajustes generales del sitio</div>
                    </div>
                  </Link>
                </Button>

                <Button variant="outline" asChild className="h-auto py-4 justify-start">
                  <Link href="/admin/settings/api">
                    <FileText className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Configuración de API</div>
                      <div className="text-xs text-muted-foreground">Gestionar claves de API</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
