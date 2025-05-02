"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function RestablecerPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oobCode = searchParams.get("oobCode")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError("Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.")
        setIsVerifying(false)
        return
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode)
        setEmail(email)
        setIsVerifying(false)
      } catch (err) {
        // Error manejado en UI
        setError("El enlace es inválido o ha expirado. Por favor, solicita un nuevo enlace de recuperación.")
        setIsVerifying(false)
      }
    }

    verifyCode()
  }, [oobCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      setError("Por favor, completa todos los campos")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (!oobCode) {
      setError("Código de verificación no válido")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await confirmPasswordReset(auth, oobCode, password)

      setSuccess(true)
      toast({
        title: "Contraseña restablecida",
        description: "Tu contraseña ha sido restablecida exitosamente",
      })
    } catch (err: any) {
      // Error manejado en UI

      if (err.code === "auth/expired-action-code") {
        setError("El enlace ha expirado. Solicita un nuevo enlace de recuperación.")
      } else if (err.code === "auth/invalid-action-code") {
        setError("El enlace es inválido. Solicita un nuevo enlace de recuperación.")
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es demasiado débil. Usa una contraseña más segura.")
      } else {
        setError("Ocurrió un error al restablecer la contraseña. Intenta de nuevo.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verificando enlace</CardTitle>
          <CardDescription>Estamos verificando tu enlace de recuperación...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
        <CardDescription>
          {email ? `Crea una nueva contraseña para ${email}` : "Crea una nueva contraseña para tu cuenta"}
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
          <>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Tu contraseña ha sido restablecida exitosamente.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              Ir a iniciar sesión
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
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
