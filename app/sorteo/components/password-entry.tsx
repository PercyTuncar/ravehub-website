"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Unlock, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PasswordEntryProps {
  onAuthenticate: () => void
}

export default function PasswordEntry({ onAuthenticate }: PasswordEntryProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Simple password check - in a real app, use a more secure method
    if (password === "ravehub2025") {
      setTimeout(() => {
        onAuthenticate()
      }, 1000)
    } else {
      setError("Contraseña incorrecta")
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-indigo-100"
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: isSubmitting ? [0, 360] : 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: isSubmitting ? 1.5 : 0.5,
            repeat: isSubmitting ? Number.POSITIVE_INFINITY : 0,
          }}
          className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200"
        >
          {isSubmitting ? <Unlock className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
        </motion.div>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Acceso Restringido
        </h2>
        <p className="text-gray-500 mt-2">Ingresa la contraseña para acceder al sistema de sorteo</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 bg-indigo-50/50"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 border border-red-100"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
          disabled={isSubmitting || !password}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.span>
              Verificando...
            </span>
          ) : (
            "Acceder"
          )}
        </Button>
      </form>
    </motion.div>
  )
}
