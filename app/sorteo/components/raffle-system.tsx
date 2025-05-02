"use client"

import { motion } from "framer-motion"
import { Dices, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface RaffleSystemProps {
  commentCount: number
  attemptOption: "first" | "second" | "third"
  onAttemptChange: (option: "first" | "second" | "third") => void
  onStartRaffle: () => void
  isRaffling: boolean
}

export default function RaffleSystem({
  commentCount,
  attemptOption,
  onAttemptChange,
  onStartRaffle,
  isRaffling,
}: RaffleSystemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100"
    >
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
        Configuración del Sorteo
      </h2>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-700 mb-2">
          <div className="bg-indigo-100 p-2 rounded-full">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <span className="font-medium">Participantes:</span>
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-0.5 rounded-full text-sm font-medium shadow-sm">
            {commentCount}
          </span>
        </div>

        <p className="text-gray-600 text-sm">
          Hay {commentCount} comentarios en esta publicación que participarán en el sorteo.
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <div className="bg-indigo-100 p-1.5 rounded-full">
            <Dices className="h-4 w-4 text-indigo-600" />
          </div>
          Seleccionar ganador:
        </h3>
        <RadioGroup
          value={attemptOption}
          onValueChange={(value) => onAttemptChange(value as "first" | "second" | "third")}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
            <RadioGroupItem value="first" id="first" className="text-indigo-600 border-indigo-400" />
            <Label htmlFor="first" className="text-gray-700 cursor-pointer">
              Primer intento
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
            <RadioGroupItem value="second" id="second" className="text-indigo-600 border-indigo-400" />
            <Label htmlFor="second" className="text-gray-700 cursor-pointer">
              Segundo intento
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
            <RadioGroupItem value="third" id="third" className="text-indigo-600 border-indigo-400" />
            <Label htmlFor="third" className="text-gray-700 cursor-pointer">
              Tercer intento
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button
        onClick={onStartRaffle}
        disabled={isRaffling}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
      >
        {isRaffling ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader2 className="h-5 w-5" />
            </motion.span>
            Sorteando...
          </>
        ) : (
          <>
            <motion.span whileHover={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5 }}>
              <Dices className="h-5 w-5" />
            </motion.span>
            Iniciar Sorteo
          </>
        )}
      </Button>
    </motion.div>
  )
}
