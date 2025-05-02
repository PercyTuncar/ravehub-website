"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, User, Mail, MessageSquare, Calendar, Eye, EyeOff, PartyPopper } from "lucide-react"
import confetti from "canvas-confetti"

interface WinnerDisplayProps {
  winner: {
    name: string
    email: string
    commentContent: string
    date: Date | null
    userId: string
    userImageUrl: string
  } | null
}

export default function WinnerDisplay({ winner }: WinnerDisplayProps) {
  const [visibleFields, setVisibleFields] = useState({
    name: false,
    email: false,
    comment: false,
    date: false,
  })

  const [showConfetti, setShowConfetti] = useState(true)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element for celebration sound
    audioRef.current = new Audio("/sounds/winner-celebration.mp3")

    // Play celebration sound
    try {
      audioRef.current.volume = 0.5
      audioRef.current.play().catch((err) => console.log("Autoplay prevented:", err))
    } catch (error) {
      console.error("Error playing sound:", error)
    }

    // Fire confetti effect
    const fireworks = () => {
      const duration = 5 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Use random colors
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ["#FFD700", "#FFA500", "#FF4500", "#9370DB", "#4169E1"],
          }),
        )
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ["#FFD700", "#FFA500", "#FF4500", "#9370DB", "#4169E1"],
          }),
        )
      }, 250)

      // Fire initial big confetti blast
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors: ["#FFD700", "#FFA500", "#FF4500", "#9370DB", "#4169E1"],
      })
    }

    fireworks()

    // Hide confetti after 10 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 10000)

    return () => {
      clearTimeout(timer)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Helper function for confetti
  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  if (!winner) return null

  const toggleField = (field: keyof typeof visibleFields) => {
    setVisibleFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-8 shadow-xl border-2 border-yellow-300 h-full relative overflow-hidden"
    >
      {/* Background celebration lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`light-${i}`}
            initial={{
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: 0.5,
              opacity: 0.3,
            }}
            animate={{
              scale: [0.5, 1.5, 0.5],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
            style={{
              position: "absolute",
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0) 70%)`,
              filter: "blur(8px)",
            }}
          />
        ))}
      </div>

      <div className="text-center mb-8 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: [0, 10, -10, 10, -10, 0],
            y: [0, -20, 0],
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.3,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          }}
          className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-300/50 border-4 border-white"
        >
          <div className="relative">
            <Trophy className="w-16 h-16 text-white" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -right-4 -top-4"
            >
              <PartyPopper className="w-8 h-8 text-amber-300" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 drop-shadow-sm"
        >
          ¡FELICIDADES!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 text-xl text-amber-800 font-medium"
        >
          Tenemos un ganador
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 inline-block bg-gradient-to-r from-amber-200 to-yellow-200 px-6 py-2 rounded-full text-sm text-amber-800 border border-amber-300 shadow-md"
        >
          Toca los íconos para revelar la información
        </motion.div>
      </div>

      <div className="space-y-5 relative z-10">
        <WinnerField
          icon={<User className="w-5 h-5" />}
          label="Nombre"
          value={winner.name}
          isVisible={visibleFields.name}
          onToggle={() => toggleField("name")}
          color="amber"
        />

        <WinnerField
          icon={<Mail className="w-5 h-5" />}
          label="Email"
          value={winner.email}
          isVisible={visibleFields.email}
          onToggle={() => toggleField("email")}
          color="yellow"
        />

        <WinnerField
          icon={<MessageSquare className="w-5 h-5" />}
          label="Comentario"
          value={winner.commentContent}
          isVisible={visibleFields.comment}
          onToggle={() => toggleField("comment")}
          color="orange"
        />

        <WinnerField
          icon={<Calendar className="w-5 h-5" />}
          label="Fecha"
          value={winner.date ? new Date(winner.date).toLocaleString() : "No disponible"}
          isVisible={visibleFields.date}
          onToggle={() => toggleField("date")}
          color="amber"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-10 text-center"
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600 font-bold text-xl px-6 py-3 border-2 border-yellow-300 rounded-full inline-block shadow-md">
          ¡GANADOR OFICIAL!
        </span>
      </motion.div>

      {/* Hidden audio element */}
      <div className="sr-only">
        <button onClick={() => audioRef.current?.play()} className="hidden" aria-hidden="true">
          Play sound
        </button>
      </div>
    </motion.div>
  )
}

interface WinnerFieldProps {
  icon: React.ReactNode
  label: string
  value: string
  isVisible: boolean
  onToggle: () => void
  color: "yellow" | "amber" | "orange"
}

function WinnerField({ icon, label, value, isVisible, onToggle, color }: WinnerFieldProps) {
  const getColorClasses = () => {
    switch (color) {
      case "yellow":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          hover: "hover:bg-yellow-100",
          text: "text-yellow-800",
        }
      case "orange":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          hover: "hover:bg-orange-100",
          text: "text-orange-800",
        }
      case "amber":
      default:
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          hover: "hover:bg-amber-100",
          text: "text-amber-800",
        }
    }
  }

  const colors = getColorClasses()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${colors.bg} rounded-lg p-5 border-2 ${colors.border} transition-colors shadow-md`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-gray-800">
          <span className={`p-2 rounded-full bg-white mr-3 ${colors.text} shadow-sm border border-amber-100`}>
            {icon}
          </span>
          <span className="font-semibold text-lg">{label}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: [0, 15, -15, 0] }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className={`text-gray-600 ${colors.hover} p-2 rounded-full transition-colors`}
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className={`text-gray-800 break-words text-lg ${colors.text} p-2 bg-white/50 rounded-md`}>{value}</p>
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-8 bg-gradient-to-r from-amber-200 to-yellow-200 rounded animate-pulse"
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
