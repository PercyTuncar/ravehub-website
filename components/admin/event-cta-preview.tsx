"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { EventCTA } from "@/types"
import { Smartphone, ExternalLink } from "lucide-react"

interface EventCTAPreviewProps {
  cta: EventCTA
  isPreview?: boolean
}

export function EventCTAPreview({ cta, isPreview = false }: EventCTAPreviewProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(
    null,
  )
  const [showCountdown, setShowCountdown] = useState(cta.hasCountdown)

  // Calcular tiempo restante
  useEffect(() => {
    if (!cta.hasCountdown || !cta.countdownEndDate) {
      setShowCountdown(false)
      return
    }

    const calculateTimeLeft = () => {
      const difference = new Date(cta.countdownEndDate!).getTime() - new Date().getTime()

      if (difference <= 0) {
        setShowCountdown(false)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      setShowCountdown(true)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [cta.hasCountdown, cta.countdownEndDate])

  // Generar URL de contacto
  const getContactUrl = () => {
    if (cta.contactType === "whatsapp") {
      const phoneNumber = cta.contactValue.replace(/\D/g, "")
      return `https://wa.me/${phoneNumber}`
    }
    return cta.contactValue
  }

  // Estilos personalizados
  const containerStyle = {
    background: cta.styles.backgroundGradient || cta.styles.backgroundColor,
  }

  const titleStyle = {
    color: cta.styles.titleColor,
  }

  const descriptionStyle = {
    color: cta.styles.descriptionColor,
  }

  const buttonStyle = {
    backgroundColor: cta.styles.buttonColor,
    color: cta.styles.buttonTextColor,
  }

  const countdownStyle = {
    color: cta.styles.countdownColor || "#ffffff",
  }

  const countdownNumbersStyle = {
    color: cta.styles.countdownNumbersColor || "#ffffff",
  }

  const countdownLabelsStyle = {
    color: cta.styles.countdownLabelsColor || "#cccccc",
  }

  return (
    <div className="p-4 md:p-6 rounded-lg" style={containerStyle}>
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-bold mb-2" style={titleStyle}>
            {cta.title}
          </h3>
          <p className="text-sm md:text-base" style={descriptionStyle}>
            {cta.description}
          </p>

          {showCountdown && timeLeft && (
            <div className="mt-2" style={countdownStyle}>
              <p className="text-xs mb-1">Faltan:</p>
              <div className="flex justify-center md:justify-start gap-2 md:gap-4">
                <div className="text-center">
                  <span className="text-lg md:text-2xl font-bold" style={countdownNumbersStyle}>
                    {timeLeft.days.toString().padStart(2, "0")}
                  </span>
                  <p className="text-xs" style={countdownLabelsStyle}>
                    días
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg md:text-2xl font-bold" style={countdownNumbersStyle}>
                    {timeLeft.hours.toString().padStart(2, "0")}
                  </span>
                  <p className="text-xs" style={countdownLabelsStyle}>
                    horas
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg md:text-2xl font-bold" style={countdownNumbersStyle}>
                    {timeLeft.minutes.toString().padStart(2, "0")}
                  </span>
                  <p className="text-xs" style={countdownLabelsStyle}>
                    minutos
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-lg md:text-2xl font-bold" style={countdownNumbersStyle}>
                    {timeLeft.seconds.toString().padStart(2, "0")}
                  </span>
                  <p className="text-xs" style={countdownLabelsStyle}>
                    segundos
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          asChild
          className="w-full md:w-auto px-6 py-2 rounded-lg transition-all hover:opacity-90"
          style={buttonStyle}
        >
          <Link href={isPreview ? "#" : getContactUrl()} target="_blank" rel="noopener noreferrer">
            {cta.contactType === "whatsapp" ? (
              <>
                <Smartphone className="h-4 w-4 mr-2" />
                <span>WhatsApp</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>Ir al enlace</span>
              </>
            )}
          </Link>
        </Button>
      </div>
    </div>
  )
}
