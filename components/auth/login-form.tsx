"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Añadir estas importaciones al inicio del archivo
import { FcGoogle } from "react-icons/fc"
import { signInWithEmailAndPassword, linkWithCredential } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/"
  const { login, refreshUserData, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Añadir este estado para manejar la vinculación de cuentas
  const [pendingCredential, setPendingCredential] = useState<any>(null)
  const [pendingEmail, setPendingEmail] = useState<string>("")
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  // Generar token CSRF
  useEffect(() => {
    // Generar un token CSRF único para esta sesión
    const generateCSRFToken = () => {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem("csrfToken", token)
      return token
    }

    if (!sessionStorage.getItem("csrfToken")) {
      generateCSRFToken()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Verificar que existe un token CSRF
    const csrfToken = sessionStorage.getItem("csrfToken")
    if (!csrfToken) {
      setError("Error de seguridad. Por favor, recarga la página")
      return
    }

    if (!email || !password) {
      setError("Por favor, completa todos los campos")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await login(email, password)

      // Regenerar token CSRF después de login exitoso
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem("csrfToken", newToken)

      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente",
      })

      router.push(redirectUrl)
    } catch (err: any) {
      // Mensajes de error genéricos para no revelar información sensible
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Credenciales incorrectas")
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde")
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar el inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signInWithGoogle()

      if (result.needsLinking && result.methods.includes("password")) {
        // El usuario existe con email/password pero no con Google
        // Guardamos la credencial para vincularla después
        setPendingCredential(result.credential)
        setPendingEmail(result.user.email)
        setShowPasswordPrompt(true)
        return
      }

      if (result.isNewUser) {
        // El usuario necesita completar el registro
        router.push(`/completar-registro?email=${encodeURIComponent(result.user.email)}`)
        return
      }

      // Login exitoso
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente con Google",
      })

      router.push(redirectUrl)
    } catch (err: any) {
      console.error("Error al iniciar sesión con Google:", err)
      setError("Error al iniciar sesión con Google. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para vincular cuenta existente con Google
  const handleLinkAccounts = async (password: string) => {
    try {
      setIsLoading(true)

      // Iniciar sesión con email/password
      const userCredential = await signInWithEmailAndPassword(auth, pendingEmail, password)

      // Vincular con la credencial de Google
      if (pendingCredential) {
        await linkWithCredential(userCredential.user, pendingCredential)
      }

      // Actualizar datos del usuario
      await refreshUserData()

      toast({
        title: "Cuentas vinculadas",
        description: "Tu cuenta de email y Google han sido vinculadas correctamente",
      })

      router.push(redirectUrl)
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        setError("Contraseña incorrecta")
      } else {
        setError("Error al vincular cuentas. Intenta de nuevo.")
      }
    } finally {
      setIsLoading(false)
      setShowPasswordPrompt(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/recuperar-password" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <input type="hidden" name="csrfToken" value={sessionStorage.getItem("csrfToken") || ""} />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>

          {/* Dentro del formulario, después del botón "Iniciar sesión" */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FcGoogle className="h-5 w-5" />
            Iniciar sesión con Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-center text-sm text-muted-foreground mt-2">
          ¿No tienes una cuenta?{" "}
          <Link href="/registro" className="text-primary hover:underline">
            Regístrate
          </Link>
        </div>
      </CardFooter>

      {/* Modal para vincular cuentas */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Vincular cuentas</h3>
            <p className="mb-4">
              Ya existe una cuenta con el email {pendingEmail}. Ingresa tu contraseña para vincular tu cuenta de Google.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-password">Contraseña</Label>
                <Input
                  id="link-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleLinkAccounts(password)}
                  disabled={!password || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Procesando..." : "Vincular cuentas"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordPrompt(false)
                    setPendingCredential(null)
                    setPendingEmail("")
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
