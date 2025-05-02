"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Aquí iría la lógica para guardar el email en la base de datos
      // Por ahora solo simulamos un delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "¡Suscripción exitosa!",
        description: "Gracias por suscribirte a nuestro newsletter.",
      })

      setEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: "No pudimos procesar tu suscripción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Suscribiendo...
          </>
        ) : (
          "Suscribirse"
        )}
      </Button>
    </form>
  )
}
