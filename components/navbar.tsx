"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Globe,
  LogIn,
  User,
  ShoppingBag,
  Ticket,
  CreditCard,
  Settings,
  LayoutDashboard,
  LogOut,
  MapPin,
  Calendar,
  BookOpen,
  MoreHorizontal,
  Package,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { useGeolocation } from "@/context/geolocation-context"
import { currencies } from "@/lib/constants"
import { CartDrawer } from "@/components/cart-drawer"

// Importar framer-motion para las animaciones suaves
import { motion, AnimatePresence } from "framer-motion"

// Mapeo de códigos de moneda a URLs de banderas SVG
const currencyFlagUrls: Record<string, string> = {
  PEN: "https://upload.wikimedia.org/wikipedia/commons/d/df/Flag_of_Peru_%28state%29.svg",
  CLP: "https://upload.wikimedia.org/wikipedia/commons/7/78/Flag_of_Chile.svg",
  USD: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Flag_of_the_United_States.svg",
  MXN: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg",
  ARS: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg",
  BRL: "https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg",
  COP: "https://upload.wikimedia.org/wikipedia/commons/2/21/Flag_of_Colombia.svg",
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const { currency, setCurrency, exchangeRates } = useCurrency()
  const { country, city, loading: geoLoading } = useGeolocation()
  // Actualizar el estado de isScrolled para detectar el scroll
  const [isScrolled, setIsScrolled] = useState(false)
  // Añadir lazy loading para el menú desplegable
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Encontrar el símbolo de la moneda actual
  const currentCurrencySymbol = currencies.find((c) => c.code === currency)?.symbol || "$"

  // Manejar el cambio de moneda
  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode)

    // Guardar la preferencia en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredCurrency", currencyCode)
    }

    console.log(`Moneda cambiada a: ${currencyCode}`)
  }

  // Añadir un listener para responder a solicitudes de moneda
  useEffect(() => {
    // Escuchar solicitudes de moneda desde otros componentes
    const handleCurrencyRequest = () => {
      console.log("Navbar: Recibida solicitud de moneda actual")
      // Responder con la moneda actual
      window.dispatchEvent(
        new CustomEvent("currency-response", {
          detail: currency,
        }),
      )
    }

    window.addEventListener("request-currency", handleCurrencyRequest)

    // Emitir la moneda actual al montar el componente
    window.dispatchEvent(
      new CustomEvent("currency-response", {
        detail: currency,
      }),
    )

    return () => {
      window.removeEventListener("request-currency", handleCurrencyRequest)
    }
  }, [currency])

  // Modificar la sección de navLinks para reorganizar los enlaces principales
  // y crear un nuevo array para los enlaces del menú "Más"

  // Reemplazar la definición de navLinks con:
  const navLinks = [
    { name: "Eventos", href: "/eventos" },
    { name: "Tienda", href: "/tienda" },
    { name: "Blog", href: "/blog" },
    { name: "Contacto", href: "/contacto" },
  ]

  // Añadir después de navLinks:
  const moreMenuLinks = [
    { name: "Galería", href: "/galeria" },
    { name: "Votar", href: "/votar" },
    { name: "DJ Ranking", href: "/dj-ranking" },
    { name: "Sugerir DJ", href: "/sugerir-dj" },
    { name: "Equipo", href: "/team" },
  ]

  const userMenuLinks = [
    { name: "Perfil", href: "/perfil", icon: <User className="mr-2 h-4 w-4" /> },
    { name: "Mis entradas", href: "/perfil/entradas", icon: <Ticket className="mr-2 h-4 w-4" /> },
    { name: "Mis pagos", href: "/perfil/pagos", icon: <CreditCard className="mr-2 h-4 w-4" /> },
    { name: "Mis compras", href: "/perfil/compras", icon: <ShoppingBag className="mr-2 h-4 w-4" /> },
    { name: "Ajustes", href: "/perfil/ajustes", icon: <Settings className="mr-2 h-4 w-4" /> },
  ]

  const adminMenuLinks = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { name: "Perfil", href: "/perfil", icon: <User className="mr-2 h-4 w-4" /> },
    { name: "Ajustes", href: "/perfil/ajustes", icon: <Settings className="mr-2 h-4 w-4" /> },
  ]

  const MobileNavBar = () => {
    const { user } = useAuth()
    const [showMoreMenu, setShowMoreMenu] = useState(false)
    const pathname = usePathname()

    if (!user) return null

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 w-full h-16">
          <Link
            href="/eventos"
            className={`flex flex-col items-center justify-center ${pathname.startsWith("/eventos") ? "text-primary" : "text-gray-700"}`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Eventos</span>
          </Link>

          <Link
            href="/tienda"
            className={`flex flex-col items-center justify-center ${pathname.startsWith("/tienda") ? "text-primary" : "text-gray-700"}`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs mt-1">Tienda</span>
          </Link>

          <div className="flex justify-center items-start">
            <Link href="/perfil" className="relative -mt-6 flex flex-col items-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Avatar className="h-12 w-12 border-2 border-background overflow-hidden">
                  <AvatarImage
                    src={user.photoURL || ""}
                    alt={user.firstName}
                    className="object-cover"
                    style={{ width: "100%", height: "100%", objectPosition: "center" }}
                  />
                  <AvatarFallback>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-1 max-w-[70px] text-center">
                {(() => {
                  const fullName = `${user.firstName} ${user.lastName}`
                  if (fullName.length <= 10) {
                    return <span className="text-xs">{fullName}</span>
                  } else if (fullName.length <= 15) {
                    return <span className="text-[10px]">{fullName}</span>
                  } else {
                    return <span className="text-[10px] truncate">{fullName.substring(0, 12)}...</span>
                  }
                })()}
              </div>
            </Link>
          </div>

          <Link
            href="/blog"
            className={`flex flex-col items-center justify-center ${pathname.startsWith("/blog") ? "text-primary" : "text-gray-700"}`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs mt-1">Blog</span>
          </Link>

          <DropdownMenu open={showMoreMenu} onOpenChange={setShowMoreMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center h-auto w-full p-2 text-gray-700"
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs mt-1">Más</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {moreMenuLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} className="flex items-center">
                    <span>{link.name}</span>
                    {pathname === link.href && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil/entradas" className="flex items-center">
                  <Ticket className="mr-2 h-4 w-4" />
                  <span>Mis entradas</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/perfil/pagos" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Mis pagos</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/perfil/compras" className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  <span>Mis compras</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/perfil/ajustes" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ajustes</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // Reemplazar el header existente con este nuevo diseño
  return (
    <>
      <AnimatePresence>
        <motion.header
          className={`sticky top-0 z-50 w-full transition-all`}
          initial={{ y: 0 }}
          animate={{
            y: isScrolled ? 8 : 0,
            boxShadow: isScrolled ? "0 10px 30px -10px rgba(0,0,0,0.1)" : "none",
          }}
          transition={{
            type: "tween",
            duration: 0.1, // Reducir de 0.15 a 0.1
            ease: "easeOut",
          }}
        >
          <motion.div
            className={`${isScrolled ? "w-[98%] mx-auto" : "w-full"} rounded-xl ${
              isScrolled
                ? "bg-white/70 backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:bg-gray-900/50 dark:border-gray-800/30"
                : "bg-white dark:bg-gray-900"
            }`}
            style={{
              boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.05)" : "none",
            }}
            initial={{ borderRadius: 0 }}
            animate={{
              borderRadius: isScrolled ? 16 : 0,
              padding: isScrolled ? "0.25rem 0" : "0",
              width: isScrolled ? "98%" : "100%",
            }}
            transition={{
              type: "tween",
              duration: 0.15,
              ease: "easeOut",
            }}
          >
            <div className="container mx-auto px-4 flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="mr-4 md:mr-8 flex items-center">
                  <div className="p-1 rounded-md flex items-center justify-center bg-gray-900">
                    <img
                      src="/images/logo-full.png"
                      alt="RaveHub Logo"
                      className="h-6 md:h-8 w-auto object-contain max-w-[120px] md:max-w-none"
                    />
                  </div>
                </Link>

                {/* Navigation links */}
                <nav className="hidden md:flex items-center space-x-6" aria-label="Navegación principal">
                  {navLinks.map((link) => (
                    <motion.div
                      key={link.href}
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link
                        href={link.href}
                        className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href ? "text-primary" : "text-gray-700"}`}
                        aria-current={pathname === link.href ? "page" : undefined}
                      >
                        {link.name}
                      </Link>
                      {pathname === link.href && (
                        <motion.div
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                          layoutId="navbar-underline"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.div>
                  ))}

                  {/* Menú desplegable "Más" */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-sm font-medium transition-colors hover:text-primary text-gray-700 p-0"
                      >
                        Más <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border border-gray-200">
                      {moreMenuLinks.map((link) => (
                        <motion.div key={link.href} whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link
                              href={link.href}
                              className={`flex items-center text-gray-700 ${pathname === link.href ? "text-primary" : ""}`}
                            >
                              <span>{link.name}</span>
                              {pathname === link.href && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </Link>
                          </DropdownMenuItem>
                        </motion.div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </nav>
              </div>

              <div className="flex items-center space-x-4">
                {/* Currency selector - modernized */}
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      {currencyFlagUrls[currency] ? (
                        <img
                          src={currencyFlagUrls[currency] || "/placeholder.svg"}
                          alt={`Bandera de ${currencies.find((c) => c.code === currency)?.name}`}
                          className="h-4 w-6 mr-1 object-cover rounded-sm"
                          loading="lazy"
                          width="24"
                          height="16"
                        />
                      ) : (
                        <Globe className="h-4 w-4 mr-1" />
                      )}
                      <span className="md:inline hidden">
                        {currentCurrencySymbol} {currency}
                      </span>
                      <span className="md:hidden inline">{currency}</span>
                      {!geoLoading && country && (
                        <span className="ml-1 text-xs text-gray-500 hidden sm:inline-flex items-center">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {country}
                        </span>
                      )}
                      <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                      <span className="sr-only">Seleccionar moneda</span>
                    </Button>
                  </DropdownMenuTrigger>
                  {isMenuOpen && (
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-xl p-1 shadow-lg border border-gray-200"
                      forceMount
                    >
                      <DropdownMenuLabel>Seleccionar moneda</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {currencies.map((curr) => (
                        <motion.div key={curr.code} whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                          <DropdownMenuItem
                            className={`rounded-lg transition-all duration-200 ${currency === curr.code ? "bg-gray-100" : ""}`}
                            onClick={() => handleCurrencyChange(curr.code)}
                            onMouseEnter={() => {
                              window.dispatchEvent(
                                new CustomEvent("currency-hover", {
                                  detail: curr.code,
                                }),
                              )
                            }}
                            onMouseLeave={() => {
                              window.dispatchEvent(new CustomEvent("currency-hover-end"))
                            }}
                          >
                            {currencyFlagUrls[curr.code] ? (
                              <img
                                src={currencyFlagUrls[curr.code] || "/placeholder.svg"}
                                alt={`Bandera de ${curr.name}`}
                                className="h-4 w-6 mr-2 object-cover rounded-sm"
                              />
                            ) : (
                              <span className="mr-2">{curr.flag}</span>
                            )}
                            {curr.name} ({curr.symbol})
                          </DropdownMenuItem>
                        </motion.div>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>

                {/* User menu for desktop */}
                {user ? (
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative h-8 w-8 rounded-full overflow-hidden border border-gray-200 hover:border-gray-300"
                        >
                          <Avatar className="h-8 w-8 overflow-hidden">
                            <AvatarImage
                              src={user.photoURL || ""}
                              alt={user.firstName}
                              className="object-cover"
                              style={{ width: "100%", height: "100%", objectPosition: "center" }}
                            />
                            <AvatarFallback>
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 rounded-xl p-1 shadow-lg border border-gray-200"
                        align="end"
                        forceMount
                      >
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs leading-none text-gray-500">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isAdmin
                          ? adminMenuLinks.map((link) => (
                              <motion.div key={link.href} whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link href={link.href} className="flex items-center text-gray-700">
                                    {link.icon}
                                    <span>{link.name}</span>
                                  </Link>
                                </DropdownMenuItem>
                              </motion.div>
                            ))
                          : userMenuLinks.map((link) => (
                              <motion.div key={link.href} whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
                                <DropdownMenuItem asChild className="rounded-lg">
                                  <Link href={link.href} className="flex items-center text-gray-700">
                                    {link.icon}
                                    <span>{link.name}</span>
                                  </Link>
                                </DropdownMenuItem>
                              </motion.div>
                            ))}
                        <DropdownMenuSeparator />
                        <motion.div whileHover={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                          <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500 rounded-lg">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar sesión</span>
                          </DropdownMenuItem>
                        </motion.div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button asChild variant="default" size="sm" className="shadow-sm">
                      <Link href="/login" className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Iniciar sesión</span>
                        <span className="md:hidden">Login</span>
                      </Link>
                    </Button>
                  </motion.div>
                )}

                {/* Mobile menu button - only show if not logged in on mobile */}
                {(!user || window.innerWidth >= 768) && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden border-gray-200">
                        <Menu className="h-5 w-5 text-gray-700" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="border-l border-gray-200">
                      <div className="grid gap-6 py-6">
                        <div className="grid gap-3">
                          {navLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`text-sm font-medium transition-colors hover:text-primary flex items-center p-2 rounded-lg ${
                                pathname === link.href ? "text-primary bg-gray-50" : "text-gray-700"
                              }`}
                            >
                              {link.name}
                              {pathname === link.href && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </Link>
                          ))}

                          <div className="pt-2 pb-1">
                            <p className="text-xs font-medium text-gray-500 px-2">Más opciones</p>
                          </div>

                          {moreMenuLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={`text-sm font-medium transition-colors hover:text-primary flex items-center p-2 rounded-lg ${
                                pathname === link.href ? "text-primary bg-gray-50" : "text-gray-700"
                              }`}
                            >
                              {link.name}
                              {pathname === link.href && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </Link>
                          ))}
                        </div>
                        {!user && (
                          <div className="grid gap-2">
                            <Button asChild size="sm" className="shadow-sm">
                              <Link href="/login">Iniciar sesión</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="border-gray-200">
                              <Link href="/registro">Crear cuenta</Link>
                            </Button>
                          </div>
                        )}
                        {/* Cart drawer for mobile when not logged in */}
                        {!user && (
                          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Carrito de compras</span>
                              <CartDrawer />
                            </div>
                          </div>
                        )}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

                {/* Cart drawer - only visible on desktop or when logged in */}
                <div className={user ? "" : "hidden md:block"}>
                  <CartDrawer />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.header>
      </AnimatePresence>

      {/* Mobile bottom navigation bar */}
      <MobileNavBar />

      {/* Structured data for navigation */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            name: navLinks.map((link) => link.name),
            url: navLinks.map((link) => `https://www.weareravehub.com${link.href}`),
          }),
        }}
      />
    </>
  )
}
