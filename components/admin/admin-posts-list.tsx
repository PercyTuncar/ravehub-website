"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Search, Edit, Trash, Eye, AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAllCategories, deletePost } from "@/lib/firebase/blog"
import type { BlogPost, BlogCategory } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export function AdminPostsList() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch posts and categories
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Iniciando la carga de posts y categorías...")

      // Intentar obtener los posts directamente de Firestore para depurar
      try {
        const postsRef = collection(db, "blog")
        const q = query(postsRef)
        const querySnapshot = await getDocs(q)

        console.log(`Firestore query devolvió ${querySnapshot.size} documentos`)

        if (querySnapshot.size > 0) {
          // Mostrar el primer documento para depuración
          console.log("Ejemplo de documento:", querySnapshot.docs[0].data())
        }

        const postsData = []
        querySnapshot.forEach((doc) => {
          postsData.push({
            id: doc.id,
            ...doc.data(),
          })
        })

        console.log(`Procesados ${postsData.length} posts directamente de Firestore`)
        setPosts(postsData)
      } catch (firestoreError) {
        console.error("Error al consultar Firestore directamente:", firestoreError)
      }

      // Obtener categorías
      try {
        const categoriesData = await getAllCategories()
        console.log(`Obtenidas ${categoriesData.length} categorías`)
        setCategories(categoriesData)
      } catch (categoriesError) {
        console.error("Error al obtener categorías:", categoriesError)
      }
    } catch (err) {
      console.error("Error detallado al cargar los datos:", err)
      setError("Ocurrió un error al cargar los artículos. Revisa la consola para más detalles.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter posts based on search term, status, and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || post.status === statusFilter
    const matchesCategory = categoryFilter === "all" || post.categoryId === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Handle delete post
  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!postToDelete) return

    try {
      setIsDeleting(true)
      await deletePost(postToDelete.id)

      // Update posts list
      setPosts(posts.filter((p) => p.id !== postToDelete.id))

      toast({
        title: "Artículo eliminado",
        description: "El artículo ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el artículo",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="success">Publicado</Badge>
      case "draft":
        return <Badge variant="outline">Borrador</Badge>
      case "archived":
        return <Badge variant="secondary">Archivado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    // Si el post usa categories (array) en lugar de categoryId
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de artículos</CardTitle>
        <Button asChild>
          <Link href="/admin/blog/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo artículo</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artículos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vistas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Cargando artículos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-destructive">
                    <div className="flex justify-center items-center">
                      <AlertTriangle className="h-6 w-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{getCategoryName(post.categoryId)}</TableCell>
                    <TableCell>{formatDate(post.publishDate)}</TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>{post.viewCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/blog/${post.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteClick(post)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || categoryFilter !== "all" ? (
                      "No se encontraron artículos con los filtros aplicados"
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <p>No se están mostrando los artículos. Esto puede deberse a:</p>
                        <ul className="list-disc text-left mx-auto my-2">
                          <li>La función getPostsForAdmin() no está recuperando correctamente los datos</li>
                          <li>Los posts en Firestore no tienen la estructura esperada</li>
                          <li>Hay un problema con el campo "updatedAt" en la consulta</li>
                        </ul>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLoading(true)
                            fetchData().finally(() => setLoading(false))
                          }}
                          className="mt-2"
                        >
                          Reintentar carga directa
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el artículo "{postToDelete?.title}". Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
