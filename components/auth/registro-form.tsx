"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { latinAmericanCountries, documentTypesByCountry, countryToCurrency } from "@/lib/constants"
// Añadir estas importaciones al inicio del archivo
import { FcGoogle } from "react-icons/fc"

export default function RegistroForm() {
  const router = useRouter()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    phonePrefix: "",
    phone: "",
    documentType: "",
    documentNumber: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get phone prefix based on selected country
  const getPhonePrefix = (countryCode: string) => {
    const prefixes: Record<string, string> = {
      AR: "+54", // Argentina
      BO: "+591", // Bolivia
      BR: "+55", // Brasil
      CL: "+56", // Chile
      CO: "+57", // Colombia
      CR: "+506", // Costa Rica
      CU: "+53", // Cuba
      DO: "+1", // República Dominicana
      EC: "+593", // Ecuador
      SV: "+503", // El Salvador
      GT: "+502", // Guatemala
      HN: "+504", // Honduras
      MX: "+52", // México
      NI: "+505", // Nicaragua
      PA: "+507", // Panamá
      PY: "+595", // Paraguay
      PE: "+51", // Perú
      PR: "+1", // Puerto Rico
      UY: "+598", // Uruguay
      VE: "+58", // Venezuela
      WORLD: "+1", // Default for non-Latin American countries
    }
    return prefixes[countryCode] || "+1" // Default to +1 if country code not found
  }

  // Ensure all document types include passport option
  const getDocumentTypes = () => {
    if (!formData.country) return []

    // Get the document types for the selected country
    const countryDocTypes = documentTypesByCountry[formData.country] || documentTypesByCountry.DEFAULT

    // Check if passport is already included
    const hasPassport = countryDocTypes.some((doc) => doc.code === "PASSPORT")

    // If passport is not included, add it
    if (!hasPassport) {
      return [...countryDocTypes, { code: "PASSPORT", name: "Pasaporte" }]
    }

    return countryDocTypes
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle country selection
  const handleCountryChange = (value: string) => {
    const phonePrefix = getPhonePrefix(value)
    const preferredCurrency = countryToCurrency[value] || "USD"

    setFormData((prev) => ({
      ...prev,
      country: value,
      phonePrefix,
      documentType: "", // Reset document type when country changes
    }))
  }

  // Handle document type selection
  const handleDocumentTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, documentType: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.country ||
      !formData.phone ||
      !formData.documentType ||
      !formData.documentNumber
    ) {
      setError("Por favor, completa todos los campos")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validar fortaleza de la contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/

    if (!passwordRegex.test(formData.password)) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, incluyendo al menos una letra minúscula, una letra mayúscula, un número y un símbolo.",
      )
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Register user
      await register(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        phonePrefix: formData.phonePrefix,
        country: formData.country,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        preferredCurrency: countryToCurrency[formData.country] || "USD",
      })

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      })

      router.push("/")
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está en uso")
      } else {
        setError("Ocurrió un error al crear tu cuenta. Intenta de nuevo")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Añadir esta función dentro del componente RegistroForm
  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await register.signInWithGoogle()

      if (result.isNewUser) {
        // Redirigir a la página de completar registro
        router.push(`/completar-registro?email=${encodeURIComponent(result.user.email)}`)
      } else {
        // El usuario ya existe
        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión correctamente con Google",
        })

        router.push("/")
      }
    } catch (err: any) {
      console.error("Error al registrarse con Google:", err)
      setError("Error al registrarse con Google. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>Completa el formulario para registrarte en RaveHub</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Tu nombre"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Tu apellido"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País de residencia</Label>
            <Select value={formData.country} onValueChange={handleCountryChange}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent>
                {latinAmericanCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phonePrefix">Prefijo</Label>
              <Input id="phonePrefix" name="phonePrefix" value={formData.phonePrefix} readOnly disabled />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="987654321"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de documento</Label>
              <Select
                value={formData.documentType}
                onValueChange={handleDocumentTypeChange}
                disabled={!formData.country}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {getDocumentTypes().map((docType) => (
                    <SelectItem key={docType.code} value={docType.code}>
                      {docType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de documento</Label>
              <Input
                id="documentNumber"
                name="documentNumber"
                placeholder="12345678"
                value={formData.documentNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
          {/* Dentro del formulario, después del botón "Crear cuenta" */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O regístrate con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <FcGoogle className="h-5 w-5" />
            Registrarse con Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
