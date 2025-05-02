"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface EventMapProps {
  latitude: number
  longitude: number
  venueName: string
}

export default function EventMap({ latitude, longitude, venueName }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Fix Leaflet's default icon path issues
    // This needs to be done before creating any markers
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })

    // Initialize map only once
    if (!mapInstanceRef.current) {
      // Create map instance
      mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 15)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current)

      // Add marker
      L.marker([latitude, longitude]).addTo(mapInstanceRef.current).bindPopup(venueName).openPopup()
    } else {
      // Update view if coordinates change
      mapInstanceRef.current.setView([latitude, longitude], 15)

      // Update marker
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstanceRef.current?.removeLayer(layer)
        }
      })

      L.marker([latitude, longitude]).addTo(mapInstanceRef.current).bindPopup(venueName).openPopup()
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, venueName])

  return <div ref={mapRef} className="h-full w-full" />
}
