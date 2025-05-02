"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { latinAmericanCountries, documentTypesByCountry, countryToCurrency } from "@/lib/constants"
import { auth } from "@/lib/firebase/config"

export default function CompletarRegistroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const { completeGoogleRegistration, user } = useAuth()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    country: "",
    phonePrefix: "",
    phone: "",
    documentType: "",
    documentNumber: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      // Si no hay usuario autenticado, redirigir al login
      if (!auth.currentUser) {
        router.push("/login")
      } else {
        // Pre-llenar el formulario con datos del usuario de Google
        const currentUser = auth.currentUser
        if (currentUser.displayName) {
          const nameParts = currentUser.displayName.split(" ")
          setFormData((prev) => ({
            ...prev,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
          }))
        }
      }
    }

    checkAuth()
  }, [router])

  // Si el usuario ya tiene todos los datos completos, redirigir a la página principal
  useEffect(() => {
    if (
      user &&
      user.firstName &&
      user.lastName &&
      user.country &&
      user.phone &&
      user.documentType &&
      user.documentNumber
    ) {
      router.push("/")
    }
  }, [user, router])

  // Get document types based on selected country
  const getDocumentTypes = () => {
    if (!formData.country) return []
    return documentTypesByCountry[formData.country] || documentTypesByCountry.DEFAULT
  }

  // Get phone prefix based on selected country
  const getPhonePrefix = (countryCode: string) => {
    const prefixes: Record<string, string> = {
      PE: "+51",
      CL: "+56",
      MX: "+52",
      AR: "+54",
      CO: "+57",
      BR: "+55",
      WORLD: "+1",
    }
    return prefixes[countryCode] || ""
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle country selection
  const handleCountryChange = (value: string) => {
    const phonePrefix = getPhonePrefix(value)
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
      !formData.country ||
      !formData.phone ||
      !formData.documentType ||
      !formData.documentNumber
    ) {
      setError("Por favor, completa todos los campos")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Complete registration
      await completeGoogleRegistration({
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
        title: "Registro completado",
        description: "Tu cuenta ha sido creada correctamente",
      })

      router.push("/")
    } catch (err: any) {
      setError("Ocurrió un error al completar tu registro. Intenta de nuevo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Completar registro</CardTitle>
        <CardDescription>Completa tu información para finalizar el registro con Google</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
          </div>

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
            {isLoading ? "Completando registro..." : "Completar registro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
