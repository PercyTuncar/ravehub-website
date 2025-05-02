"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminEventsList } from "@/components/admin/admin-events-list"
import { AdminTicketsList } from "@/components/admin/admin-tickets-list"
import { AdminProductsList } from "@/components/admin/admin-products-list"
import { AdminCategoriesList } from "@/components/admin/admin-categories-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { AdminOrdersList } from "@/components/admin/admin-orders-list"
import { PendingInstallmentsList } from "@/components/admin/pending-installments-list"
import { Settings, Megaphone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminDashboardTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") || "overview"
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="tickets">Entradas</TabsTrigger>
          <TabsTrigger value="installments">Cuotas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="gallery">Galería</TabsTrigger>
        </TabsList>

        <Link href="/admin/settings" passHref>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </Link>

        <Link href="/admin/ctas" passHref>
          <Button variant="outline" size="sm">
            <Megaphone className="h-4 w-4 mr-2" />
            CTAs
          </Button>
        </Link>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <h2 className="text-2xl font-semibold">Resumen General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overview cards would go here */}
          <div className="p-6 border rounded-lg">
            <h3 className="font-medium">Eventos Activos</h3>
            <p className="text-3xl font-bold mt-2">12</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-medium">Entradas Vendidas</h3>
            <p className="text-3xl font-bold mt-2">256</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-medium">Productos Activos</h3>
            <p className="text-3xl font-bold mt-2">45</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-medium">Usuarios Registrados</h3>
            <p className="text-3xl font-bold mt-2">1,245</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Cuotas Pendientes de Aprobación</h3>
          <PendingInstallmentsList limit={5} />
        </div>
      </TabsContent>

      <TabsContent value="events">
        <AdminEventsList />
      </TabsContent>

      <TabsContent value="tickets">
        <AdminTicketsList />
      </TabsContent>

      <TabsContent value="installments">
        <PendingInstallmentsList />
      </TabsContent>

      <TabsContent value="products">
        <AdminProductsList />
      </TabsContent>

      <TabsContent value="categories">
        <AdminCategoriesList />
      </TabsContent>

      <TabsContent value="orders">
        <AdminOrdersList />
      </TabsContent>

      <TabsContent value="users">
        <AdminUsersList />
      </TabsContent>

      <TabsContent value="gallery">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Administración de Galería</h2>
            <Button asChild>
              <a href="/admin/galeria">Ir a Galería</a>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra los álbumes y fotos de la galería. Crea nuevos álbumes, sube fotos y organiza tu contenido
            visual.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Álbumes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Gestiona los álbumes de fotos de eventos y experiencias.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/galeria">Ver Álbumes</a>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subir Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Añade nuevas fotos a los álbumes existentes.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/galeria">Subir Fotos</a>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nuevo Álbum</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Crea un nuevo álbum para organizar tus fotos.</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href="/admin/galeria/new">Crear Álbum</a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
