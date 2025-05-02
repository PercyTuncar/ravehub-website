"use client"

import { motion } from "framer-motion"
import { X, ArrowRight } from "lucide-react"

interface NonWinnerDisplayProps {
  nonWinner: {
    name: string
    email: string
    commentContent: string
  } | null
  position: number
  onNext: () => void
}

export default function NonWinnerDisplay({ nonWinner, position, onNext }: NonWinnerDisplayProps) {
  if (!nonWinner) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 h-full relative overflow-hidden"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-200"
        >
          <X className="w-10 h-10 text-gray-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-700 mb-2"
        >
          Intento #{position}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-6"
        >
          Este participante no es el ganador
        </motion.p>

        <div className="flex flex-col space-y-4 max-w-md mx-auto">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 mb-1">Nombre</p>
            <p className="text-gray-700 font-medium">{nonWinner.name}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
            <p className="text-gray-700">{nonWinner.email.substring(0, 3)}***{nonWinner.email.substring(nonWinner.email.lastIndexOf('@'))}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold flex items-center space-x-2 mx-auto hover:shadow-lg transition-all duration-300"
        >
          <span>Siguiente intento</span>
          <ArrowRight\
</motion.button>
      </div>
    </motion.div>
  )
}
