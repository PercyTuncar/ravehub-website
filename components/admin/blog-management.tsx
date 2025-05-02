"use client"

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminPostsList } from "@/components/admin/admin-posts-list"
import { AdminCategoriesList } from "@/components/admin/admin-categories-list"
import { AdminTagsList } from "@/components/admin/admin-tags-list"
import { AdminCommentsList } from "@/components/admin/admin-comments-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function BlogManagement() {
  const [activeTab, setActiveTab] = useState("posts")

  return (
    <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-6">
        <TabsList>
          <TabsTrigger value="posts">Artículos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="tags">Etiquetas</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
        </TabsList>

        {activeTab === "posts" && (
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Artículo
            </Button>
          </Link>
        )}

        {activeTab === "categories" && (
          <Link href="/admin/blog/categorias/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </Link>
        )}

        {activeTab === "tags" && (
          <Link href="/admin/blog/etiquetas/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etiqueta
            </Button>
          </Link>
        )}
      </div>

      <TabsContent value="posts">
        <AdminPostsList />
      </TabsContent>

      <TabsContent value="categories">
        <AdminCategoriesList />
      </TabsContent>

      <TabsContent value="tags">
        <AdminTagsList />
      </TabsContent>

      <TabsContent value="comments">
        <AdminCommentsList />
      </TabsContent>
    </Tabs>
  )
}
