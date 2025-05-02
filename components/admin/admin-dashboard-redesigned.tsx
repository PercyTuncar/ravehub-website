"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  ShoppingBag,
  Package,
  Users,
  FileText,
  MessageSquare,
  Star,
  Tag,
  Settings,
  Megaphone,
  Database,
  ImageIcon,
  DollarSign,
  TicketCheck,
  BarChart3,
  Home,
  ShieldAlert,
  Music,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminEventsList } from "@/components/admin/admin-events-list"
import { AdminTicketsList } from "@/components/admin/admin-tickets-list"
import { AdminProductsList } from "@/components/admin/admin-products-list"
import { AdminCategoriesList } from "@/components/admin/admin-categories-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { AdminOrdersList } from "@/components/admin/admin-orders-list"
import { AdminPostsList } from "@/components/admin/admin-posts-list"
import { AdminCommentsList } from "@/components/admin/admin-comments-list"
import { AdminReviewsList } from "@/components/admin/admin-reviews-list"
import { PendingInstallmentsList } from "@/components/admin/pending-installments-list"
import Link from "next/link"
import { getEventsForAdmin } from "@/lib/firebase/events"
import {
  getPendingTicketTransactions,
  getPendingInstallmentPayments,
  getPaidTicketTransactions,
} from "@/lib/firebase/tickets"
import { getProductsForAdmin } from "@/lib/firebase/products"
import { getAllUsers } from "@/lib/firebase/users"
import { getOrdersForAdmin, getPendingOrders } from "@/lib/firebase/orders"
import { getPostsForAdmin, getUnapprovedComments } from "@/lib/firebase/blog"

export function AdminDashboardRedesigned() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get("tab") || "overview"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    events: 0,
    tickets: 0,
    products: 0,
    users: 0,
    orders: 0,
    posts: 0,
    pendingInstallments: 0,
    pendingReviews: 0,
    pendingOrders: 0,
    pendingComments: 0,
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // Primero cargamos solo los datos esenciales para mostrar algo rápidamente
        const essentialDataPromises = [
          getEventsForAdmin().then((data) => {
            setStats((prev) => ({ ...prev, events: data.length }))
            return data
          }),
          getProductsForAdmin().then((data) => {
            setStats((prev) => ({ ...prev, products: data.length }))
            return data
          }),
        ]

        // Iniciamos la carga de datos esenciales
        essentialDataPromises.forEach((promise) =>
          promise.catch((err) => console.error("Error fetching essential data:", err)),
        )

        // Después cargamos el resto de los datos en segundo plano
        setTimeout(() => {
          Promise.all([
            getPendingTicketTransactions().then((data) => {
              let ticketCount = 0
              data.forEach((transaction) => {
                if (transaction.ticketItems && Array.isArray(transaction.ticketItems)) {
                  ticketCount += transaction.ticketItems.length
                }
              })
              setStats((prev) => ({ ...prev, tickets: prev.tickets + ticketCount }))
              return data
            }),
            getPaidTicketTransactions().then((data) => {
              let ticketCount = 0
              data.forEach((transaction) => {
                if (transaction.ticketItems && Array.isArray(transaction.ticketItems)) {
                  ticketCount += transaction.ticketItems.length
                }
              })
              setStats((prev) => ({ ...prev, tickets: prev.tickets + ticketCount }))
              return data
            }),
            getPendingInstallmentPayments().then((data) => {
              setStats((prev) => ({ ...prev, pendingInstallments: data.length }))
              return data
            }),
            getAllUsers().then((data) => {
              setStats((prev) => ({ ...prev, users: data.length }))
              return data
            }),
            getOrdersForAdmin().then((data) => {
              setStats((prev) => ({ ...prev, orders: data.length }))
              return data
            }),
            getPendingOrders().then((data) => {
              setStats((prev) => ({ ...prev, pendingOrders: data.length }))
              return data
            }),
            getPostsForAdmin().then((data) => {
              setStats((prev) => ({ ...prev, posts: data.length }))
              return data
            }),
            getUnapprovedComments().then((data) => {
              setStats((prev) => ({ ...prev, pendingComments: data.length }))
              return data
            }),
          ])
            .catch((error) => {
              console.error("Error fetching secondary dashboard data:", error)
            })
            .finally(() => {
              setLoading(false)
            })
        }, 100) // Pequeño retraso para permitir que los datos esenciales se procesen primero
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setLoading(false)
      }
    }

    if (activeTab === "overview") {
      // Inicializar stats con valores por defecto
      setStats({
        events: 0,
        tickets: 0,
        products: 0,
        users: 0,
        orders: 0,
        posts: 0,
        pendingInstallments: 0,
        pendingReviews: 0,
        pendingOrders: 0,
        pendingComments: 0,
      })

      fetchDashboardData()
    }
  }, [activeTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona todos los aspectos de tu plataforma desde un solo lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Ver sitio
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard de resumen - visible solo en la pestaña de resumen */}
      {activeTab === "overview" && (
        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Eventos Activos"
              value={stats.events}
              icon={<CalendarDays className="h-5 w-5 text-primary" />}
              href="/admin/events/new"
              loading={loading && stats.events === 0}
            />
            <StatsCard
              title="Entradas Vendidas"
              value={stats.tickets}
              icon={<TicketCheck className="h-5 w-5 text-primary" />}
              href="/admin?tab=tickets"
              loading={loading && stats.tickets === 0}
            />
            <StatsCard
              title="Productos Activos"
              value={stats.products}
              icon={<ShoppingBag className="h-5 w-5 text-primary" />}
              href="/admin/products/new"
              loading={loading && stats.products === 0}
            />
            <StatsCard
              title="Usuarios Registrados"
              value={stats.users}
              icon={<Users className="h-5 w-5 text-primary" />}
              href="/admin?tab=users"
              loading={loading && stats.users === 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cuotas pendientes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  Cuotas Pendientes de Aprobación
                </CardTitle>
                <CardDescription>{stats.pendingInstallments} cuotas requieren tu atención</CardDescription>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-auto">
                <PendingInstallmentsList limit={5} />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin?tab=installments">Ver todas las cuotas</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Accesos rápidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Accesos Rápidos</CardTitle>
                <CardDescription>Gestiona las principales áreas de tu plataforma</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <QuickAccessButton icon={<Megaphone className="h-4 w-4" />} label="CTAs" href="/admin/ctas" />
                <QuickAccessButton icon={<Star className="h-4 w-4" />} label="Reseñas" href="/admin/reviews" />
                <QuickAccessButton
                  icon={<Database className="h-4 w-4" />}
                  label="Datos Falsos"
                  href="/admin/fake-data"
                />
                <QuickAccessButton
                  icon={<ImageIcon className="h-4 w-4" />}
                  label="Banners"
                  href="/admin/store/banners"
                />
                <QuickAccessButton
                  icon={<Tag className="h-4 w-4" />}
                  label="Categorías Blog"
                  href="/admin/blog/categorias"
                />
                <QuickAccessButton
                  icon={<Tag className="h-4 w-4" />}
                  label="Categorías Tienda"
                  href="/admin/categories"
                />
                <QuickAccessButton
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Monedas"
                  href="/admin/settings/currency-settings"
                />
                <QuickAccessButton
                  icon={<ShieldAlert className="h-4 w-4" />}
                  label="Seguridad"
                  href="/admin/seguridad"
                />
                <QuickAccessButton icon={<Music className="h-4 w-4" />} label="DJs" href="/admin/djs" />
              </CardContent>
            </Card>
          </div>

          {/* Módulos de administración */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ModuleCard
              title="Gestión de Eventos"
              description={`${stats.events} eventos, ${stats.tickets} entradas`}
              icon={<CalendarDays className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "Eventos", href: "/admin?tab=events" },
                { label: "Entradas", href: "/admin?tab=tickets" },
                { label: "Cuotas", href: "/admin?tab=installments" },
              ]}
            />
            <ModuleCard
              title="Tienda Online"
              description={`${stats.products} productos, ${stats.pendingOrders} pedidos pendientes`}
              icon={<ShoppingBag className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "Productos", href: "/admin?tab=products" },
                { label: "Categorías", href: "/admin/categories" },
                { label: "Pedidos", href: "/admin?tab=orders" },
                { label: "Banners", href: "/admin/store/banners" },
              ]}
            />
            <ModuleCard
              title="Blog y Contenido"
              description={`${stats.posts} artículos, ${stats.pendingComments} comentarios pendientes`}
              icon={<FileText className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "Artículos", href: "/admin?tab=blog" },
                { label: "Comentarios", href: "/admin?tab=comments" },
                { label: "Categorías", href: "/admin/blog/categorias" },
                { label: "Etiquetas", href: "/admin/blog/etiquetas" },
              ]}
            />
            <ModuleCard
              title="Galería de Imágenes"
              description="Gestiona álbumes y fotos"
              icon={<ImageIcon className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "Álbumes", href: "/admin/galeria" },
                { label: "Nuevo Álbum", href: "/admin/galeria/new" },
              ]}
            />
            <ModuleCard
              title="Ranking de DJs"
              description="Administra votaciones y perfiles de DJs"
              icon={<Music className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "Perfiles", href: "/admin/djs/profiles" },
                { label: "Votaciones", href: "/admin/djs/voting" },
                { label: "Sugerencias", href: "/admin/djs" },
              ]}
            />
            <ModuleCard
              title="Configuración"
              description="Ajustes generales y de seguridad"
              icon={<Settings className="h-10 w-10 text-primary/80" />}
              links={[
                { label: "General", href: "/admin/settings/general" },
                { label: "Monedas", href: "/admin/settings/currency-settings" },
                { label: "API", href: "/admin/settings/api" },
                { label: "Seguridad", href: "/admin/seguridad" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Sistema de pestañas principal */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="bg-background sticky top-0 z-10 pb-4">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-11 gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-1">
              <TicketCheck className="h-4 w-4" />
              <span className="hidden md:inline">Entradas</span>
            </TabsTrigger>
            <TabsTrigger value="installments" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Cuotas</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">Comentarios</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span className="hidden md:inline">Reseñas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">{/* El contenido del resumen ya se muestra arriba */}</TabsContent>

        <TabsContent value="events">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Eventos</h2>
            <Button asChild>
              <Link href="/admin/events/new">Nuevo Evento</Link>
            </Button>
          </div>
          <AdminEventsList />
        </TabsContent>

        <TabsContent value="tickets">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Entradas</h2>
          </div>
          <AdminTicketsList />
        </TabsContent>

        <TabsContent value="installments">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Cuotas</h2>
          </div>
          <PendingInstallmentsList />
        </TabsContent>

        <TabsContent value="products">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Productos</h2>
            <Button asChild>
              <Link href="/admin/products/new">Nuevo Producto</Link>
            </Button>
          </div>
          <AdminProductsList />
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
            <Button asChild>
              <Link href="/admin/categories/new">Nueva Categoría</Link>
            </Button>
          </div>
          <AdminCategoriesList />
        </TabsContent>

        <TabsContent value="orders">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
          </div>
          <AdminOrdersList />
        </TabsContent>

        <TabsContent value="users">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          </div>
          <AdminUsersList />
        </TabsContent>

        <TabsContent value="blog">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión del Blog</h2>
            <Button asChild>
              <Link href="/admin/blog/new">Nuevo Artículo</Link>
            </Button>
          </div>
          <AdminPostsList />
        </TabsContent>

        <TabsContent value="comments">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Comentarios</h2>
          </div>
          <AdminCommentsList />
        </TabsContent>

        <TabsContent value="reviews">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gestión de Reseñas</h2>
          </div>
          <AdminReviewsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para tarjetas de estadísticas
function StatsCard({
  title,
  value,
  icon,
  href,
  loading = false,
}: {
  title: string
  value: number
  icon: React.ReactNode
  href: string
  loading?: boolean
}) {
  return (
    <Card className="relative group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            {title === "Entradas Vendidas" && (
              <p className="text-xs text-muted-foreground mt-1">Incluye todas las entradas asignadas y cortesías</p>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href={href}>
            {title === "Eventos Activos" && "Gestionar eventos"}
            {title === "Entradas Vendidas" && "Administrar entradas"}
            {title === "Productos Activos" && "Gestionar productos"}
            {title === "Usuarios Registrados" && "Ver usuarios"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Componente para botones de acceso rápido
function QuickAccessButton({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Button variant="outline" size="sm" className="h-auto py-4 justify-start" asChild>
      <Link href={href}>
        <div className="flex flex-col items-center w-full gap-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
      </Link>
    </Button>
  )
}

// Componente para tarjetas de módulos
function ModuleCard({
  title,
  description,
  icon,
  links,
}: {
  title: string
  description: string
  icon: React.ReactNode
  links: { label: string; href: string }[]
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {links.map((link, index) => (
          <Button key={index} variant="ghost" className="justify-start h-9" asChild>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
