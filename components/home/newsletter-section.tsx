"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, CheckCircle, AlertCircle } from "lucide-react"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore"

// Lazy load FingerprintJS only when needed
const loadFingerprint = async () => {
  const FingerprintJS = await import("@fingerprintjs/fingerprintjs")
  const fp = await FingerprintJS.default.load()
  return (await fp.get()).visitorId
}

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSubmissionLimit = async (visitorId: string): Promise<boolean> => {
    try {
      const fingerprintRef = doc(db, "newsletter_fingerprints", visitorId)
      const fingerprintDoc = await getDoc(fingerprintRef)

      if (fingerprintDoc.exists()) {
        const data = fingerprintDoc.data()
        if (data.count >= 3) {
          setError("Has alcanzado el límite máximo de suscripciones desde este dispositivo.")
          return false
        }

        // Actualizar contador
        await setDoc(
          fingerprintRef,
          {
            count: data.count + 1,
            lastSubmission: serverTimestamp(),
          },
          { merge: true },
        )
      } else {
        // Crear nuevo registro de huella digital
        await setDoc(fingerprintRef, {
          count: 1,
          firstSubmission: serverTimestamp(),
          lastSubmission: serverTimestamp(),
        })
      }
      return true
    } catch (err) {
      console.error("Error verificando límite de envíos:", err)
      return false
    }
  }

  const checkDuplicateEmail = async (email: string): Promise<boolean> => {
    try {
      const subscribersRef = collection(db, "newsletter_subscribers")
      const q = query(subscribersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setError("Este correo electrónico ya está registrado en nuestra base de datos.")
        return true
      }
      return false
    } catch (err) {
      console.error("Error verificando correo duplicado:", err)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Cargar la huella digital solo cuando sea necesario
      const fingerprint = await loadFingerprint()

      // Verificar límite de envíos por huella digital
      const canSubmit = await checkSubmissionLimit(fingerprint)
      if (!canSubmit) {
        setIsLoading(false)
        return
      }

      // Verificar si el correo ya existe
      const isDuplicate = await checkDuplicateEmail(email)
      if (isDuplicate) {
        setIsLoading(false)
        return
      }

      // Guardar email en Firebase
      await addDoc(collection(db, "newsletter_subscribers"), {
        email,
        fingerprint,
        createdAt: serverTimestamp(),
      })

      setIsSubmitted(true)
      setEmail("")
    } catch (err) {
      console.error("Error guardando correo en la base de datos:", err)
      setError("Hubo un problema al registrar tu correo. Por favor intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }

    // Resetear el estado de envío después de 5 segundos
    setTimeout(() => {
      setIsSubmitted(false)
    }, 5000)
  }

  return (
    <section className="py-16 px-4 md:px-8">
      <div className="fade-in-up max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-4">Mantente informado</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Suscríbete a nuestro newsletter y sé el primero en enterarte de nuevos eventos, lanzamientos de entradas y
          ofertas exclusivas.
        </p>

        {isSubmitted ? (
          <div className="fade-in flex items-center justify-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>¡Gracias por suscribirte! Tu correo ha sido registrado correctamente.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Suscribirse"}
            </Button>
          </form>
        )}

        {error && (
          <div className="fade-in mt-3 flex items-center justify-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </section>
  )
}
