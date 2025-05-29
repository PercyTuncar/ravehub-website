import type React from "react"
import type { Event } from "@/utils/types"
import Image from "next/image"
import { CalendarDays, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"

interface EventDetailProps {
  event: Event
}

const EventDetail: React.FC<EventDetailProps> = ({ event }) => {
  const { id, title, description, location, date, time, image } = event

  const formattedDate = new Date(date).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          width={1200}
          height={600}
          style={{ objectFit: "cover", width: "100%", height: "auto" }}
        />
      </div>

      {/* Event Title */}
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-4">{title}</h1>

      {/* Event Meta */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center text-gray-700 dark:text-gray-300 space-x-2 mb-2 md:mb-0">
          <CalendarDays className="w-5 h-5" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center text-gray-700 dark:text-gray-300 space-x-2 mb-2 md:mb-0">
          <Clock className="w-5 h-5" />
          <span>{time}</span>
        </div>
        <div className="flex items-center text-gray-700 dark:text-gray-300 space-x-2">
          <MapPin className="w-5 h-5" />
          <span>{location}</span>
        </div>
      </div>

      {/* Event Description */}
      <div className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 mb-8">
        <p>{description}</p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <Link
          href={`/events/${id}/register`}
          className="block w-full md:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-center transition duration-300 shadow-md"
        >
          Regístrate Ahora
        </Link>
        <button className="w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl text-center transition duration-300 shadow-md dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300">
          Añadir al Calendario
        </button>
      </div>

      {/* Mobile WhatsApp Group Link - Only visible on mobile */}
      <div className="md:hidden">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30 shadow-sm">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl"></div>
          </div>

          {/* Content */}
          <div className="relative p-5">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    className="text-white"
                  >
                    <path
                      fill="currentColor"
                      d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-yellow-900" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Comunidad RaveHub</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Únete a nuestro grupo oficial</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Noticias</span>
              </div>
              <div className="text-center p-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Comunidad</span>
              </div>
              <div className="text-center p-2">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Ofertas</span>
              </div>
            </div>

            {/* CTA Button */}
            <a
              href="https://chat.whatsapp.com/IUs37U1mJq8FZJSQbMUZpc"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5 group-hover:animate-bounce" />
              <span>Unirse al grupo</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail
