"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  BarChart3,
  CalendarDays,
  TicketCheck,
  DollarSign,
  ShoppingBag,
  Tag,
  Package,
  Users,
  FileText,
  MessageSquare,
  Star,
  ImageIcon,
  Megaphone,
  Settings,
  ShieldAlert,
  Music,
  ChevronDown,
  ChevronRight,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Eventos",
    icon: CalendarDays,
    children: [
      { title: "Gestión de Eventos", href: "/admin?section=events", icon: CalendarDays },
      { title: "Entradas", href: "/admin?section=tickets", icon: TicketCheck },
      { title: "Cuotas", href: "/admin?section=installments", icon: DollarSign },
    ],
  },
  {
    title: "Tienda",
    icon: ShoppingBag,
    children: [
      { title: "Productos", href: "/admin?section=products", icon: ShoppingBag },
      { title: "Categorías", href: "/admin?section=categories", icon: Tag },
      { title: "Pedidos", href: "/admin?section=orders", icon: Package },
      { title: "Banners", href: "/admin/store/banners", icon: Megaphone },
    ],
  },
  {
    title: "Contenido",
    icon: FileText,
    children: [
      { title: "Blog", href: "/admin?section=blog", icon: FileText },
      { title: "Comentarios", href: "/admin?section=comments", icon: MessageSquare },
      { title: "Reseñas", href: "/admin?section=reviews", icon: Star },
    ],
  },
  {
    title: "Usuarios",
    href: "/admin?section=users",
    icon: Users,
  },
  {
    title: "Multimedia",
    icon: ImageIcon,
    children: [
      { title: "Galería", href: "/admin/galeria", icon: ImageIcon },
      { title: "DJs", href: "/admin/djs", icon: Music },
    ],
  },
  {
    title: "Herramientas",
    icon: Settings,
    children: [
      { title: "Actualizar Schema Eventos", href: "/admin/tools/update-events", icon: Settings },
      { title: "Datos Falsos", href: "/admin/fake-data", icon: BarChart3 },
      { title: "CTAs", href: "/admin/ctas", icon: Megaphone },
      { title: "Configuración", href: "/admin/settings", icon: Settings },
      { title: "Seguridad", href: "/admin/seguridad", icon: ShieldAlert },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSection = searchParams.get('section') || 'dashboard'
  const [openSections, setOpenSections] = useState<string[]>(["Eventos", "Tienda", "Contenido"])

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === "/admin") return currentSection === "dashboard"
    const section = href.match(/\?section=([^&]*)/)?.[1]
    return section === currentSection
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Home className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <Collapsible
                open={openSections.includes(item.title)}
                onOpenChange={() => toggleSection(item.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 py-2 h-auto font-normal"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {openSections.includes(item.title) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-6">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href || "#"}>
                      <Button
                        variant={isActive(child.href) ? "secondary" : "ghost"}
                        className="w-full justify-start px-3 py-2 h-auto font-normal"
                      >
                        <child.icon className="h-4 w-4 mr-3" />
                        {child.title}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link href={item.href || "#"}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start px-3 py-2 h-auto font-normal"
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.title}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Ver sitio
          </Link>
        </Button>
      </div>
    </div>
  )
}