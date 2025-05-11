"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserById } from "@/lib/firebase/users"
import { Ticket, ShoppingBag, CreditCard, User, Settings } from "lucide-react"

interface ProfileLayoutProps {
  children: React.ReactNode
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const data = await getUserById(user.uid)
          console.log("User data loaded:", data)
          if (data?.photoURL) {
            console.log("Photo URL found:", data.photoURL)
          } else {
            console.log("No photo URL found in user data")
          }
          setUserData(data)
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserData()
  }, [user])

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!userData) return "U"
    const firstName = userData.firstName || ""
    const lastName = userData.lastName || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U"
  }

  const navItems = [
    { href: "/perfil", label: "Perfil", icon: <User className="h-4 w-4 mr-2" /> },
    { href: "/perfil/entradas", label: "Entradas", icon: <Ticket className="h-4 w-4 mr-2" /> },
    { href: "/perfil/compras", label: "Compras", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { href: "/perfil/pagos", label: "Pagos", icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { href: "/perfil/ajustes", label: "Ajustes", icon: <Settings className="h-4 w-4 mr-2" /> },
  ]

  const activeTab = navItems.find((item) => pathname === item.href)?.href || "/perfil"

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar for desktop */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <Card className="overflow-hidden sticky top-24">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-24 relative">
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                <Avatar className="h-20 w-20 border-4 border-white">
                  <AvatarImage
                    src={userData?.photoURL || "/placeholder.svg"}
                    alt={userData?.firstName || "User"}
                    className="object-cover"
                    onError={(e) => {
                      console.error("Error loading profile image:", e)
                      // Don't hide the image, let the fallback show instead
                    }}
                  />
                  <AvatarFallback className="text-lg bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-12 pb-4">
              <div className="text-center mb-6">
                <h2 className="font-bold text-xl">
                  {userData?.firstName} {userData?.lastName}
                </h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      pathname === item.href
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Mobile navigation */}
        <div className="lg:hidden w-full mb-6">
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} passHref legacyBehavior>
                  <TabsTrigger value={item.href} className="flex flex-col items-center text-xs py-2 h-auto">
                    {item.icon}
                    <span className="mt-1">{item.label}</span>
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Main content */}
        <div className="lg:col-span-9">
          <Card>
            <CardContent className="p-6">{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
