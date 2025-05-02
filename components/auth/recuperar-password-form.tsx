"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function RecuperarPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Por favor, ingresa tu correo electrónico")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await sendPasswordResetEmail(auth, email)

      setSuccess(true)
      toast({
        title: "Correo enviado",
        description: "Se ha enviado un enlace para restablecer tu contraseña",
      })
    } catch (err: any) {
      // Error manejado en UI

      if (err.code === "auth/user-not-found") {
        setError("No existe una cuenta con este correo electrónico")
      } else if (err.code === "auth/invalid-email") {
        setError("El formato del correo electrónico es inválido")
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos. Intenta más tarde")
      } else {
        setError("Ocurrió un error al enviar el correo. Intenta de nuevo")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Hemos enviado un enlace a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada y sigue las
              instrucciones.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-center text-sm text-muted-foreground mt-2">
          <Link href="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
