import type React from "react"
import { memo } from "react" // Añadir import de memo

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string
    date: string
    location: string
    price: number
    currency: string
    imageUrl: string
  }
  currency: string
  exchangeRates: { [key: string]: number }
}

// Usar memo para evitar re-renderizados innecesarios
const EventCard: React.FC<EventCardProps> = memo(({ event, currency, exchangeRates }) => {
  const convertedPrice = event.price * (exchangeRates[event.currency] / exchangeRates[currency])

  return (
    <div className="event-card">
      <img
        src={event.imageUrl || "/placeholder.svg"}
        alt={event.title}
        loading="lazy" // Añadir lazy loading
        width="300" // Añadir dimensiones explícitas
        height="200"
      />
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
      {/* Eliminar el console.log para mejorar el rendimiento */}
      <p>
        Price: {convertedPrice.toFixed(2)} {currency}
      </p>
    </div>
  )
})

// Añadir displayName para depuración
EventCard.displayName = "EventCard"

export default EventCard
