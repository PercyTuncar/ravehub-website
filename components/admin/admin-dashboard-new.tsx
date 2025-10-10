"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  Plus,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
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

export function AdminDashboardNew() {
  const searchParams = useSearchParams()
  const initialSection = searchParams.get("section") || "dashboard"
  const [activeSection, setActiveSection] = useState(initialSection)
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

  // Update activeSection when searchParams change
  useEffect(() => {
    const section = searchParams.get("section") || "dashboard"
    setActiveSection(section)
  }, [searchParams])

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
        }, 100)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setLoading(false)
      }
    }

    if (activeSection === "dashboard") {
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
  }, [activeSection])


  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview stats={stats} loading={loading} />
      case "events":
        return <EventsSection />
      case "tickets":
        return <TicketsSection />
      case "installments":
        return <InstallmentsSection />
      case "products":
        return <ProductsSection />
      case "categories":
        return <CategoriesSection />
      case "orders":
        return <OrdersSection />
      case "users":
        return <UsersSection />
      case "blog":
        return <BlogSection />
      case "comments":
        return <CommentsSection />
      case "reviews":
        return <ReviewsSection />
      default:
        return <DashboardOverview stats={stats} loading={loading} />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

// Dashboard Overview Component
function DashboardOverview({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona todos los aspectos de tu plataforma desde un solo lugar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Ver sitio
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Métricas Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Eventos Activos"
            value={stats.events}
            icon={<CalendarDays className="h-6 w-6" />}
            href="/admin?section=events"
            loading={loading && stats.events === 0}
            gradient="from-blue-500 to-blue-600"
            description="Eventos publicados"
          />
          <MetricCard
            title="Entradas Vendidas"
            value={stats.tickets}
            icon={<TicketCheck className="h-6 w-6" />}
            href="/admin?section=tickets"
            loading={loading && stats.tickets === 0}
            gradient="from-green-500 to-green-600"
            description="Total de tickets"
          />
          <MetricCard
            title="Productos Activos"
            value={stats.products}
            icon={<ShoppingBag className="h-6 w-6" />}
            href="/admin/products/new"
            loading={loading && stats.products === 0}
            gradient="from-purple-500 to-purple-600"
            description="En catálogo"
          />
          <MetricCard
            title="Usuarios Registrados"
            value={stats.users}
            icon={<Users className="h-6 w-6" />}
            href="/admin?section=users"
            loading={loading && stats.users === 0}
            gradient="from-orange-500 to-orange-600"
            description="Miembros activos"
          />
        </div>
      </div>

      {/* Activity & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Acciones Pendientes</h2>

          {/* Pending Installments */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center text-red-600 dark:text-red-400">
                <DollarSign className="h-5 w-5 mr-3" />
                Cuotas Pendientes de Aprobación
              </CardTitle>
              <CardDescription className="text-base">
                {stats.pendingInstallments} cuotas requieren tu atención inmediata
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-auto">
              <PendingInstallmentsList />
            </CardContent>
            <CardFooter className="pt-4">
              <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-shadow" asChild>
                <Link href="/admin?section=installments">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver todas las cuotas
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Accesos Rápidos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <ActionCard
                icon={<Megaphone className="h-5 w-5" />}
                label="CTAs"
                href="/admin/ctas"
                description="Gestionar llamadas a la acción"
              />
              <ActionCard
                icon={<Star className="h-5 w-5" />}
                label="Reseñas"
                href="/admin?section=reviews"
                description="Administrar reseñas"
              />
              <ActionCard
                icon={<Database className="h-5 w-5" />}
                label="Datos Falsos"
                href="/admin/fake-data"
                description="Generar datos de prueba"
              />
              <ActionCard
                icon={<ImageIcon className="h-5 w-5" />}
                label="Banners"
                href="/admin/store/banners"
                description="Gestionar banners"
              />
              <ActionCard
                icon={<Tag className="h-5 w-5" />}
                label="Categorías"
                href="/admin/blog/categorias"
                description="Categorías del blog"
              />
              <ActionCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Monedas"
                href="/admin/settings/currency-settings"
                description="Configurar monedas"
              />
              <ActionCard
                icon={<ShieldAlert className="h-5 w-5" />}
                label="Seguridad"
                href="/admin/seguridad"
                description="Configuración de seguridad"
              />
              <ActionCard
                icon={<Music className="h-5 w-5" />}
                label="DJs"
                href="/admin/djs"
                description="Gestionar DJs"
              />
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Resumen del Sistema</h2>

          <div className="space-y-4">
            <SystemCard
              title="Eventos"
              value={stats.events}
              subtitle={`${stats.tickets} entradas vendidas`}
              icon={<CalendarDays className="h-5 w-5" />}
              href="/admin?section=events"
              color="blue"
            />
            <SystemCard
              title="Tienda"
              value={stats.products}
              subtitle={`${stats.pendingOrders} pedidos pendientes`}
              icon={<ShoppingBag className="h-5 w-5" />}
              href="/admin?section=products"
              color="purple"
            />
            <SystemCard
              title="Blog"
              value={stats.posts}
              subtitle={`${stats.pendingComments} comentarios pendientes`}
              icon={<FileText className="h-5 w-5" />}
              href="/admin?section=blog"
              color="green"
            />
            <SystemCard
              title="Pedidos"
              value={stats.orders}
              subtitle="Total procesados"
              icon={<Package className="h-5 w-5" />}
              href="/admin?section=orders"
              color="orange"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Components
function EventsSection() {
  return <AdminEventsList />
}

function TicketsSection() {
  return <AdminTicketsList />
}

function InstallmentsSection() {
  return <PendingInstallmentsList />
}

function ProductsSection() {
  return <AdminProductsList />
}

function CategoriesSection() {
  return <AdminCategoriesList />
}

function OrdersSection() {
  return <AdminOrdersList />
}

function UsersSection() {
  return <AdminUsersList />
}

function BlogSection() {
  return <AdminPostsList />
}

function CommentsSection() {
  return <AdminCommentsList />
}

function ReviewsSection() {
  return <AdminReviewsList />
}

// Reusable Components
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

// New Modern Components
function MetricCard({
  title,
  value,
  icon,
  href,
  loading = false,
  gradient,
  description,
}: {
  title: string
  value: number
  icon: React.ReactNode
  href: string
  loading?: boolean
  gradient: string
  description: string
}) {
  return (
    <Card className="relative group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full bg-gradient-to-br ${gradient} text-white shadow-md`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando...</span>
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-2 relative">
        <Button variant="ghost" size="sm" className="w-full hover:bg-white/10" asChild>
          <Link href={href}>
            Gestionar →
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function ActionCard({
  icon,
  label,
  href,
  description,
}: {
  icon: React.ReactNode
  label: string
  href: string
  description: string
}) {
  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
      <CardContent className="p-4">
        <Button variant="ghost" className="w-full h-auto p-0 hover:bg-transparent" asChild>
          <Link href={href} className="flex flex-col items-center gap-3 py-2">
            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              {icon}
            </div>
            <div className="text-center">
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            </div>
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function SystemCard({
  title,
  value,
  subtitle,
  icon,
  href,
  color,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  href: string
  color: string
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
    purple: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300",
    green: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
    orange: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
  }

  return (
    <Card className={`border-2 ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        <p className="text-sm opacity-80">{subtitle}</p>
        <Button variant="ghost" size="sm" className="w-full mt-3 hover:bg-white/10" asChild>
          <Link href={href}>
            Ver detalles →
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}