"use client"

import { cn } from "@/lib/utils"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createEvent, updateEvent, getEventById } from "@/lib/firebase/events"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash, Upload, MapPin, CalendarIcon, AlertCircle, Pencil } from "lucide-react"
import type { Event, Artist, Zone, SalesPhase, EventDJ } from "@/types"
import { ArtistAutocomplete } from "@/components/admin/artist-autocomplete"
import { ArtistListDraggable } from "@/components/admin/artist-list-draggable"
import { EventTemplates } from "@/components/admin/event-templates"

interface EventTemplate {
  id: string
  name: string
  description: string
  eventType: "dj_set" | "festival" | "concert" | "other"
  defaultValues: Partial<Event>
  icon: React.ReactNode
  color: string
}
import { v4 as uuidv4 } from "uuid"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase/config"
import Image from "next/image"
import { Editor } from "@/components/admin/editor"
import { generateSlug } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { EventSchemaPreview } from "@/components/admin/event-schema-preview"
import { GoogleSearchPreview } from "@/components/admin/google-search-preview"

interface EventFormProps {
  eventId?: string
}

export function EventForm({ eventId }: EventFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(!!eventId)
  const [activeTab, setActiveTab] = useState("basic")
  const [showSchemaPreview, setShowSchemaPreview] = useState(false)
  const [schemaPreviewData, setSchemaPreviewData] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    name: "",
    description: "",
    descriptionText: "", // Plain text for SEO/schema
    shortDescription: "",
    slug: "",
    startDate: new Date(),
    startTime: "20:00",
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    endTime: "23:00",
    isMultiDay: false,
    categories: [],
    tags: [],
    country: "",
    currency: "USD",
    status: "draft",
    sellTicketsOnPlatform: true,
    allowOfflinePayments: true,
    allowInstallmentPayments: true,
    isHighlighted: false,
    artistLineup: [],
    salesPhases: [],
    zones: [],
    location: {
      venueName: "",
      address: "",
      streetAddress: "",
      city: "",
      region: "",
      country: "",
      postalCode: "",
      latitude: 0,
      longitude: 0,
      additionalInfo: "",
    },
    inLanguage: "es",
    eventAttendanceMode: "http://schema.org/OfflineEventAttendanceMode",
    organizer: {
      name: "Ravehub",
      url: "https://ravehub.com",
    },
    faqSection: [],
    subEvents: [],
    specifications: [],
    reviews: [],
    eventType: "other", // Default event type
  })
  // Add after the existing state declarations (around line 80)
  const currencyOptions = [
    { value: "USD", label: "USD - Dólar Estadounidense", symbol: "$" },
    { value: "PEN", label: "PEN - Sol Peruano", symbol: "S/" },
    { value: "ARS", label: "ARS - Peso Argentino", symbol: "$" },
    { value: "CLP", label: "CLP - Peso Chileno", symbol: "$" },
    { value: "COP", label: "COP - Peso Colombiano", symbol: "$" },
    { value: "BRL", label: "BRL - Real Brasileño", symbol: "R$" },
    { value: "MXN", label: "MXN - Peso Mexicano", symbol: "$" },
    { value: "UYU", label: "UYU - Peso Uruguayo", symbol: "$" },
    { value: "PYG", label: "PYG - Guaraní Paraguayo", symbol: "₲" },
    { value: "BOB", label: "BOB - Boliviano", symbol: "Bs" },
    { value: "VES", label: "VES - Bolívar Venezolano", symbol: "Bs.S" },
    { value: "EUR", label: "EUR - Euro", symbol: "€" },
  ]
  const [mainImage, setMainImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string>("")
  const [bannerImagePreview, setBannerImagePreview] = useState<string>("")
  const [newCategory, setNewCategory] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newArtist, setNewArtist] = useState<Partial<Artist & {
    performerType?: string;
    members?: any[];
    alternateName?: string;
    birthDate?: string;
    jobTitle?: string[];
    foundingDate?: string;
    famousTracks?: Array<{ name: string }>;
    famousAlbums?: Array<{ name: string }>;
    wikipediaUrl?: string;
    officialWebsite?: string;
    facebookUrl?: string;
    twitterUrl?: string;
  }>>({
    name: "",
    imageUrl: "",
    description: "",
    instagramHandle: "",
    spotifyUrl: "",
    soundcloudUrl: "",
    order: 0,
    isFeatured: false, // Default to not featured
    performerType: "Person",
    members: [],
    alternateName: "",
    birthDate: "",
    jobTitle: [],
    foundingDate: "",
    famousTracks: [],
    famousAlbums: [],
    wikipediaUrl: "",
    officialWebsite: "",
    facebookUrl: "",
    twitterUrl: "",
  })

  // New state for EventDJ autocompletion
  const [selectedEventDJ, setSelectedEventDJ] = useState<EventDJ | null>(null)
  const [artistSearchValue, setArtistSearchValue] = useState("")
  const [artistImage, setArtistImage] = useState<File | null>(null)
  const [artistImagePreview, setArtistImagePreview] = useState<string>("")
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null)
  const [useImageLink, setUseImageLink] = useState<boolean>(false)
  const [artistImageUrlValue, setArtistImageUrlValue] = useState<string>("")

  // New state variables for FAQ and SubEvents
  const [newFaqQuestion, setNewFaqQuestion] = useState("")
  const [newFaqAnswer, setNewFaqAnswer] = useState("")
  const [newSubEvent, setNewSubEvent] = useState({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
  })

  // New state for Schema.org fields
  const [doorTime, setDoorTime] = useState("")
  const [audienceType, setAudienceType] = useState("public")
  const [isAccessibleForFree, setIsAccessibleForFree] = useState(false)

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        try {
          setLoadingEvent(true)
          const event = await getEventById(eventId)
          if (event) {
            setFormData(event)
            // Set schema-specific fields from loaded event
            setDoorTime((event as any).doorTime || "")
            setAudienceType((event as any).audienceType || "public")
            setIsAccessibleForFree((event as any).isAccessibleForFree || false)
            if (event.mainImageUrl) {
              setMainImagePreview(event.mainImageUrl)
            }
            if (event.bannerImageUrl) {
              setBannerImagePreview(event.bannerImageUrl)
            }
            // Update schema preview when loading existing event
            updateSchemaPreview(event)
          } else {
            toast({
              title: "Error",
              description: "No se pudo encontrar el evento",
              variant: "destructive",
            })
            router.push("/admin")
          }
        } catch (error) {
          console.error("Error fetching event:", error)
          toast({
            title: "Error",
            description: "Ocurrió un error al cargar el evento",
            variant: "destructive",
          })
        } finally {
          setLoadingEvent(false)
        }
      }

      fetchEvent()
    }
  }, [eventId, router, toast])

  const handleChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value }
    setFormData(newData)
    // Clear validation errors when user makes changes
    setValidationErrors([])
    // Update schema preview when form data changes - only if preview is visible
    if (showSchemaPreview) {
      updateSchemaPreview(newData)
    }
  }

  const handleCountryChange = (countryName: string) => {
    // Find the country code from the selected country name
    const countryCodes: Record<string, string> = {
      "Argentina": "AR",
      "Bolivia": "BO",
      "Brasil": "BR",
      "Chile": "CL",
      "Colombia": "CO",
      "Costa Rica": "CR",
      "Cuba": "CU",
      "Ecuador": "EC",
      "El Salvador": "SV",
      "Guatemala": "GT",
      "Honduras": "HN",
      "México": "MX",
      "Nicaragua": "NI",
      "Panamá": "PA",
      "Paraguay": "PY",
      "Perú": "PE",
      "Puerto Rico": "PR",
      "República Dominicana": "DO",
      "Uruguay": "UY",
      "Venezuela": "VE"
    }

    const countryCode = countryCodes[countryName] || countryName

    // Update both country name and country code
    const newData = {
      ...formData,
      country: countryName,
      location: {
        ...formData.location,
        country: countryName,
        countryCode: countryCode
      } as any // Type assertion to handle the location type
    }

    setFormData(newData as any)
    // Clear validation errors when user makes changes
    setValidationErrors([])
    // Update schema preview with new timezone only if preview is visible
    if (showSchemaPreview) {
      updateSchemaPreview(newData)
    }
  }

  const handleDoorTimeChange = (value: string) => {
    setDoorTime(value)
    if (showSchemaPreview) {
      updateSchemaPreview({ ...formData, doorTime: value })
    }
  }

  const handleAudienceTypeChange = (value: string) => {
    setAudienceType(value)
    if (showSchemaPreview) {
      updateSchemaPreview({ ...formData, audienceType: value })
    }
  }

  const handleIsAccessibleForFreeChange = (checked: boolean) => {
    setIsAccessibleForFree(checked)
    if (showSchemaPreview) {
      updateSchemaPreview({ ...formData, isAccessibleForFree: checked })
    }
  }

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFileState: (file: File | null) => void,
    setPreviewState: (preview: string) => void,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileState(file)
      setPreviewState(URL.createObjectURL(file))
    }
  }

  const addCategory = () => {
    if (newCategory && !formData.categories?.includes(newCategory)) {
      setFormData((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), newCategory],
      }))
      setNewCategory("")
    }
  }

  const removeCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories?.filter((c) => c !== category) || [],
    }))
  }

  const addTag = () => {
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }))
  }

  const handleArtistChange = (name: string, value: any) => {
    setNewArtist((prev) => ({ ...prev, [name]: value }))
  }

  const handleEventDJSelect = (eventDJ: EventDJ) => {
    setSelectedEventDJ(eventDJ)
    // Auto-fill artist form with EventDJ data including Schema.org fields
    setNewArtist({
      name: eventDJ.name,
      imageUrl: eventDJ.imageUrl,
      description: eventDJ.description || eventDJ.bio || "",
      instagramHandle: eventDJ.instagramHandle,
      spotifyUrl: eventDJ.spotifyUrl,
      soundcloudUrl: eventDJ.soundcloudUrl,
      order: formData.artistLineup?.length || 0,
      isFeatured: false,
      performerType: (eventDJ as any).performerType || "Person",
      alternateName: (eventDJ as any).alternateName || "",
      birthDate: (eventDJ as any).birthDate || "",
      jobTitle: (eventDJ as any).jobTitle || [],
      foundingDate: (eventDJ as any).foundingDate || "",
      members: (eventDJ as any).members || [],
      famousTracks: (eventDJ as any).famousTracks || [],
      famousAlbums: (eventDJ as any).famousAlbums || [],
      wikipediaUrl: (eventDJ as any).socialLinks?.wikipedia || "",
      officialWebsite: (eventDJ as any).socialLinks?.website || "",
      facebookUrl: (eventDJ as any).socialLinks?.facebook || "",
      twitterUrl: (eventDJ as any).socialLinks?.twitter || "",
    })

    // Auto-enable image link switch if DJ has an image URL
    if (eventDJ.imageUrl && eventDJ.imageUrl.trim() !== "") {
      setUseImageLink(true)
      setArtistImageUrlValue(eventDJ.imageUrl)
    } else {
      setUseImageLink(false)
      setArtistImageUrlValue("")
    }

    // Auto-set performer type from DJ data
    if ((eventDJ as any).performerType) {
      handleArtistChange("performerType", (eventDJ as any).performerType)
    }

    // Update schema preview if visible
    if (showSchemaPreview) {
      updateSchemaPreview(formData)
    }
  }

  const addArtist = async () => {
    if (!newArtist.name) return

    let imageUrl = newArtist.imageUrl || ""

    if (!useImageLink && artistImage) {
      try {
        const storageRef = ref(storage, `events/artists/${uuidv4()}`)
        await uploadBytes(storageRef, artistImage)
        imageUrl = await getDownloadURL(storageRef)
      } catch (error) {
        console.error("Error uploading artist image:", error)
        toast({
          title: "Error",
          description: "No se pudo subir la imagen del artista",
          variant: "destructive",
        })
      }
    }

    // If using image link and we have a URL, use it directly
    if (useImageLink && newArtist.imageUrl) {
      imageUrl = newArtist.imageUrl
    }

    if (editingArtistId) {
      // Update existing artist with Schema.org fields
      const updatedArtist: Artist = {
        id: editingArtistId,
        name: newArtist.name || "",
        imageUrl: useImageLink ? (newArtist.imageUrl || "") : artistImage ? imageUrl : (newArtist.imageUrl || ""),
        description: newArtist.description || "",
        instagramHandle: newArtist.instagramHandle || "",
        spotifyUrl: newArtist.spotifyUrl || "",
        soundcloudUrl: newArtist.soundcloudUrl || "",
        order: newArtist.order || 0,
        isFeatured: newArtist.isFeatured || false,
        // Schema.org fields
        performerType: newArtist.performerType,
        alternateName: newArtist.alternateName,
        birthDate: newArtist.birthDate,
        jobTitle: newArtist.jobTitle,
        foundingDate: newArtist.foundingDate,
        members: newArtist.members,
        famousTracks: newArtist.famousTracks,
        famousAlbums: newArtist.famousAlbums,
        socialLinks: {
          wikipedia: newArtist.wikipediaUrl,
          website: newArtist.officialWebsite,
          facebook: newArtist.facebookUrl,
          twitter: newArtist.twitterUrl,
        },
      }

      setFormData((prev) => ({
        ...prev,
        artistLineup:
          prev.artistLineup?.map((artist) => (artist.id === editingArtistId ? updatedArtist : artist)) || [],
      }))

      // Reset editing state
      setEditingArtistId(null)
    } else {
      // Add new artist with Schema.org fields
      const artist: Artist = {
        id: uuidv4(),
        name: newArtist.name || "",
        imageUrl,
        description: newArtist.description || "",
        instagramHandle: newArtist.instagramHandle || "",
        spotifyUrl: newArtist.spotifyUrl || "",
        soundcloudUrl: newArtist.soundcloudUrl || "",
        order: formData.artistLineup?.length || 0,
        isFeatured: newArtist.isFeatured || false,
        // Schema.org fields
        performerType: newArtist.performerType,
        alternateName: newArtist.alternateName,
        birthDate: newArtist.birthDate,
        jobTitle: newArtist.jobTitle,
        foundingDate: newArtist.foundingDate,
        members: newArtist.members,
        famousTracks: newArtist.famousTracks,
        famousAlbums: newArtist.famousAlbums,
        socialLinks: {
          wikipedia: newArtist.wikipediaUrl,
          website: newArtist.officialWebsite,
          facebook: newArtist.facebookUrl,
          twitter: newArtist.twitterUrl,
        },
      }

      setFormData((prev) => ({
        ...prev,
        artistLineup: [...(prev.artistLineup || []), artist],
      }))
    }

    setNewArtist({
      name: "",
      imageUrl: "",
      description: "",
      instagramHandle: "",
      spotifyUrl: "",
      soundcloudUrl: "",
      order: 0,
      performerType: "Person",
      members: [],
      alternateName: "",
      birthDate: "",
      jobTitle: [],
      foundingDate: "",
      famousTracks: [],
      famousAlbums: [],
      wikipediaUrl: "",
      officialWebsite: "",
      facebookUrl: "",
      twitterUrl: "",
    })

    // Clear EventDJ selection
    setSelectedEventDJ(null)
    setArtistSearchValue("")

    // Clear artist image preview and file
    setArtistImage(null)
    setArtistImagePreview("")
    setUseImageLink(false)
    setArtistImageUrlValue("")

    // Update schema preview if visible
    if (showSchemaPreview) {
      updateSchemaPreview(formData)
    }
  }

  const removeArtist = (artistId: string) => {
    setFormData((prev) => ({
      ...prev,
      artistLineup: prev.artistLineup?.filter((a) => a.id !== artistId) || [],
    }))
  }

  const reorderArtists = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const newLineup = [...(prev.artistLineup || [])]
      const [moved] = newLineup.splice(fromIndex, 1)
      newLineup.splice(toIndex, 0, moved)

      // Update order property for all artists
      const updatedLineup = newLineup.map((artist, index) => ({
        ...artist,
        order: index,
      }))

      return {
        ...prev,
        artistLineup: updatedLineup,
      }
    })
  }

  const toggleArtistFeatured = (artistId: string) => {
    setFormData((prev) => ({
      ...prev,
      artistLineup: prev.artistLineup?.map((artist) =>
        artist.id === artistId
          ? { ...artist, isFeatured: !artist.isFeatured }
          : artist
      ) || [],
    }))
  }

  const addZone = () => {
    const newZone: Zone = {
      id: uuidv4(),
      eventId: eventId || "",
      name: `Zona ${(formData.zones?.length || 0) + 1}`,
      capacity: 100,
      isActive: true,
    }

    setFormData((prev) => ({
      ...prev,
      zones: [...(prev.zones || []), newZone],
    }))
  }

  const updateZone = (zoneId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones?.map((zone) => (zone.id === zoneId ? { ...zone, [field]: value } : zone)) || [],
    }))
  }

  const removeZone = (zoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      zones: prev.zones?.filter((z) => z.id !== zoneId) || [],
      salesPhases:
        prev.salesPhases?.map((phase) => ({
          ...phase,
          zonesPricing: phase.zonesPricing.filter((pricing) => pricing.zoneId !== zoneId),
        })) || [],
    }))
  }

  const addSalesPhase = () => {
    const newPhase: SalesPhase = {
      id: uuidv4(),
      eventId: eventId || "",
      name: `Fase ${(formData.salesPhases?.length || 0) + 1}`,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      zonesPricing:
        formData.zones?.map((zone) => ({
          zoneId: zone.id,
          phaseId: "",
          price: 0,
          available: zone.capacity,
          sold: 0,
        })) || [],
    }

    setFormData((prev) => ({
      ...prev,
      salesPhases: [...(prev.salesPhases || []), newPhase],
    }))
  }

  const updatePhase = (phaseId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      salesPhases:
        prev.salesPhases?.map((phase) => (phase.id === phaseId ? { ...phase, [field]: value } : phase)) || [],
    }))
  }

  const updatePricing = (phaseId: string, zoneId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      salesPhases:
        prev.salesPhases?.map((phase) => {
          if (phase.id === phaseId) {
            return {
              ...phase,
              zonesPricing: phase.zonesPricing.map((pricing) => {
                if (pricing.zoneId === zoneId) {
                  return { ...pricing, [field]: value }
                }
                return pricing
              }),
            }
          }
          return phase
        }) || [],
    }))
  }

  const removePhase = (phaseId: string) => {
    setFormData((prev) => ({
      ...prev,
      salesPhases: prev.salesPhases?.filter((p) => p.id !== phaseId) || [],
    }))
  }

  const generateSlugFromName = () => {
    if (formData.name) {
      const slug = generateSlug(formData.name)
      handleChange("slug", slug)
    } else {
      toast({
        title: "Error",
        description: "Primero debes ingresar un nombre para el evento",
        variant: "destructive",
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    // Basic required fields
    if (!formData.name) errors.push("El nombre del evento es obligatorio")
    if (!formData.descriptionText) errors.push("La descripción SEO (Schema.org) es obligatoria")
    if (!formData.slug) errors.push("El slug (URL amigable) es obligatorio")

    // SEO character limits validation
    if (formData.name && formData.name.length > 60) {
      errors.push("El nombre del evento no debe exceder 60 caracteres para SEO óptimo")
    }

    // Location fields
    if (!formData.location?.venueName) errors.push("El nombre del lugar es obligatorio")
    if (!formData.location?.address) errors.push("La dirección es obligatoria")
    if (!formData.location?.city) errors.push("La ciudad es obligatoria")
    if (!formData.location?.country) errors.push("El país es obligatorio")

    // Coordinates validation for better SEO
    if (!formData.location?.latitude || !formData.location?.longitude) {
      errors.push("Las coordenadas (latitud y longitud) son obligatorias para mejor posicionamiento SEO")
    }

    // Images
    if (!mainImage && !mainImagePreview) errors.push("La imagen principal es obligatoria")

    // Zones and Sales Phases
    if (!formData.zones || formData.zones.length === 0) errors.push("Debes agregar al menos una zona")
    if (!formData.salesPhases || formData.salesPhases.length === 0)
      errors.push("Debes agregar al menos una fase de venta")

    // Character limits validation
    if (formData.descriptionText && formData.descriptionText.length > 160) {
      errors.push("La descripción SEO no debe exceder 160 caracteres (recomendación de Google)")
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+/i
    if (formData.externalTicketUrl && !urlRegex.test(formData.externalTicketUrl)) {
      errors.push("La URL externa debe ser una URL válida (comenzar con http:// o https://)")
    }

    // Set the errors and return validation result
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Function to strip HTML tags and create plain text
  const stripHtmlTags = (html: string): string => {
    if (!html || typeof html !== 'string') return ''

    try {
      // First, remove script and style tags completely (including multiline content)
      let text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags and content
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments

      // Remove all remaining HTML tags
      text = text.replace(/<[^>]*>/g, '')

      // Replace common HTML entities
      text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")

      // Clean up extra whitespace and line breaks
      text = text
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
        .trim()

      // Extract meaningful content - look for headings and paragraphs
      const lines = text.split('\n').filter(line => line.trim().length > 0)

      // Try to find the main event description content
      let meaningfulText = ''
      for (const line of lines) {
        const trimmed = line.trim()
        // Skip CSS-like content, URLs, and very short lines
        if (trimmed.length > 10 &&
            !trimmed.includes('@import') &&
            !trimmed.includes('url(') &&
            !trimmed.includes('var(--') &&
            !trimmed.startsWith('//') &&
            !trimmed.includes('document.addEventListener')) {
          meaningfulText += trimmed + ' '
        }
      }

      // If we found meaningful text, use it; otherwise use the cleaned text
      text = meaningfulText.trim() || text

      // Limit to reasonable length for schema (Google recommends ~160 characters)
      if (text.length > 160) {
        // Try to cut at a word boundary
        let cutIndex = 157
        while (cutIndex > 140 && text[cutIndex] !== ' ') {
          cutIndex--
        }
        text = text.substring(0, cutIndex) + '...'
      }

      return text
    } catch (error) {
      console.error('Error stripping HTML tags:', error)
      // Fallback: return a basic description
      return 'Evento musical con artistas destacados. Información completa disponible en la página del evento.'
    }
  }

  const updateSchemaPreview = (data: Partial<Event>) => {
    if (!showSchemaPreview) return

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ravehublatam.com"

    // Función para asegurarse de que la URL tiene el protocolo 'https://'
    const ensureHttpsProtocol = (url: string) => {
      if (!url) return undefined
      if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`
      }
      return url
    }

    // Función para combinar fecha y hora con zona horaria correcta
    const combineDateTime = (date: Date | string, time: string, country?: string): string => {
      const d = new Date(date)
      const [hours, minutes] = time.split(':').map(Number)

      // Mapa de zonas horarias por país (desfase desde UTC en horas)
      const timezones: Record<string, number> = {
        "Argentina": -3,
        "Bolivia": -4,
        "Brasil": -3, // São Paulo
        "Chile": -4, // Santiago
        "Colombia": -5,
        "Costa Rica": -6,
        "Cuba": -5,
        "Ecuador": -5,
        "El Salvador": -6,
        "Guatemala": -6,
        "Honduras": -6,
        "México": -6, // Ciudad de México
        "Nicaragua": -6,
        "Panamá": -5,
        "Paraguay": -4,
        "Perú": -5,
        "Puerto Rico": -4,
        "República Dominicana": -4,
        "Uruguay": -3,
        "Venezuela": -4
      }

      const offsetHours = timezones[country || ""] || -5 // Default Lima

      // Establecer la hora UTC directamente (los inputs dan la hora deseada en zona local del evento)
      d.setUTCHours(hours, minutes || 0, 0, 0)

      // Formatear el offset como string
      const offsetString = `${offsetHours >= 0 ? '+' : ''}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`

      // Obtener ISO string sin milisegundos y reemplazar Z con el offset
      const isoString = d.toISOString()
      const dateTimeWithoutMs = isoString.replace(/\.\d{3}Z$/, 'Z')

      return dateTimeWithoutMs.replace('Z', offsetString)
    }

    // Formatear fechas para el esquema con zona horaria correcta
    const startDateISO = data.startDate ? combineDateTime(data.startDate, data.startTime || '00:00', data.country) : undefined
    const endDateISO = data.endDate ? combineDateTime(data.endDate, data.endTime || '23:59', data.country) : undefined
    const doorTimeISO = doorTime && data.startDate ? combineDateTime(data.startDate, doorTime, data.country) : undefined

    // Helper function to safely get price
    const getPrice = () => {
      try {
        if (
          data.salesPhases &&
          data.salesPhases.length > 0 &&
          data.salesPhases[0].zonesPricing &&
          data.salesPhases[0].zonesPricing.length > 0
        ) {
          return data.salesPhases[0].zonesPricing[0].price
        }
        return undefined
      } catch (error) {
        return undefined
      }
    }
    const price = getPrice()

    // Determinar el tipo de evento para Schema.org
    const getEventType = () => {
      if (data.eventType === "festival") {
        return ["Festival", "MusicEvent"]
      }
      return "MusicEvent"
    }

    // Crear el objeto JSON-LD completo según ejemplos
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}#webpage`),
          url: ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}/`),
          inLanguage: data.inLanguage || "es",
          name: `Entradas para ${data.name} - RAVEHUB`,
          datePublished: startDateISO,
          dateModified: startDateISO,
          description: data.descriptionText,
          isPartOf: {
            "@type": "WebSite",
            "@id": ensureHttpsProtocol(`${baseUrl}/#website`),
            url: ensureHttpsProtocol(baseUrl),
            name: "RAVEHUB",
            publisher: {
              "@type": "Organization",
              "@id": ensureHttpsProtocol(`${baseUrl}/#organization`),
              name: "RAVEHUB",
              url: ensureHttpsProtocol(baseUrl),
              logo: {
                "@type": "ImageObject",
                "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
                url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
                width: 261,
                height: 60,
                caption: "RAVEHUB",
              },
              image: {
                "@type": "ImageObject",
                "@id": ensureHttpsProtocol(`${baseUrl}/#logo`),
                url: ensureHttpsProtocol(`${baseUrl}/logo.png`),
                width: 261,
                height: 60,
                caption: "RAVEHUB",
              },
            },
          },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: ensureHttpsProtocol(`${baseUrl}/?s={search_term_string}`),
            },
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@type": getEventType(),
          "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}#event`),
          name: (() => {
            // Generar nombre descriptivo como el title meta
            const locationPart = data.eventType === "festival" ? "" : ` en ${data.location?.city || 'Latinoamérica'}`
            const datePart = data.startDate ? new Date(data.startDate).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) : ''
            return `${data.name}${locationPart} ${datePart} | Ravehub`
          })(),
          description: data.descriptionText,
          url: ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}/`),
          ...(doorTimeISO && { doorTime: doorTimeISO }),
          startDate: startDateISO,
          endDate: endDateISO || startDateISO,
          eventStatus: data.eventStatus || "https://schema.org/EventScheduled",
          eventAttendanceMode: data.eventAttendanceMode || "https://schema.org/OfflineEventAttendanceMode",
          isAccessibleForFree: isAccessibleForFree,
          typicalAgeRange: data.typicalAgeRange || "18+",
          organizer: {
            "@type": "Organization",
            name: data.organizer?.name || "RAVEHUB",
            url: ensureHttpsProtocol(data.organizer?.url || baseUrl),
          },
          location: data.location
            ? {
                "@type": "Place",
                name: data.location.venueName,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: data.location.streetAddress || data.location.address,
                  addressLocality: data.location.city,
                  addressRegion: data.location.region || data.location.city,
                  postalCode: data.location.postalCode,
                  addressCountry: (data.location as any).countryCode || data.location.country,
                },
                geo:
                  data.location.latitude && data.location.longitude
                    ? {
                        "@type": "GeoCoordinates",
                        latitude: data.location.latitude,
                        longitude: data.location.longitude,
                      }
                    : undefined,
              }
            : undefined,
          performer:
            Array.isArray(data.artistLineup) && data.artistLineup.length > 0
              ? data.artistLineup.map((artist) => {
                  // Determinar el tipo correcto basado en los datos del artista
                  const performerType = (artist as any).performerType === "MusicGroup" ? "MusicGroup" : "Person";

                  return {
                    "@type": performerType,
                    "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}#performer-${artist.id}`),
                    name: artist.name,
                    image: artist.imageUrl ? {
                      "@type": "ImageObject",
                      url: artist.imageUrl,
                      width: 400,
                      height: 400,
                    } : undefined,
                    ...(artist.description && { description: artist.description }),
                    sameAs: [
                      ...(artist.instagramHandle ? [`https://instagram.com/${artist.instagramHandle.replace("@", "")}`] : []),
                      ...(artist.spotifyUrl ? [artist.spotifyUrl] : []),
                      ...(artist.soundcloudUrl ? [artist.soundcloudUrl] : []),
                      ...(((artist as any).socialLinks?.website) ? [(artist as any).socialLinks.website] : []),
                      ...(((artist as any).socialLinks?.facebook) ? [(artist as any).socialLinks.facebook] : []),
                      ...(((artist as any).socialLinks?.twitter) ? [(artist as any).socialLinks.twitter] : []),
                      ...(((artist as any).socialLinks?.wikipedia) ? [(artist as any).socialLinks.wikipedia] : []),
                    ].filter(Boolean),
                    // Add members for MusicGroup
                    ...(performerType === "MusicGroup" && (artist as any).members && (artist as any).members.length > 0 && {
                      member: (artist as any).members.map((member: any) => ({
                        "@type": "Person",
                        name: member.name
                      }))
                    }),
                  };
                })
              : undefined,
          offers:
            Array.isArray(data.salesPhases) && data.salesPhases.length > 0
              ? data.salesPhases.map((phase) => ({
                  "@type": "Offer",
                  name: phase.name,
                  availability: "https://schema.org/LimitedAvailability",
                  url: ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}`),
                  price: phase.zonesPricing && phase.zonesPricing.length > 0 ? phase.zonesPricing[0].price : undefined,
                  priceCurrency: data.currency || "USD",
                  validFrom: phase.startDate ? new Date(phase.startDate).toISOString() : startDateISO,
                  validThrough: phase.endDate ? new Date(phase.endDate).toISOString() : endDateISO,
                }))
              : price
                ? [
                    {
                      "@type": "Offer",
                      availability: "https://schema.org/LimitedAvailability",
                      url: ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}`),
                      price: price,
                      priceCurrency: data.currency || "USD",
                      validFrom: startDateISO,
                      validThrough: endDateISO,
                    },
                  ]
                : undefined,
          ...(data.eventType === "festival" && data.subEvents &&
            data.subEvents.length > 0 && {
              subEvent: data.subEvents.map((subEvent) => ({
                "@type": "MusicEvent",
                name: subEvent.name,
                description: subEvent.description,
                startDate: subEvent.startDate ? new Date(subEvent.startDate).toISOString() : undefined,
                endDate: subEvent.endDate ? new Date(subEvent.endDate).toISOString() : undefined,
                location: {
                  "@type": "Place",
                  name: data.location?.venueName,
                },
                performer: data.artistLineup?.slice(0, 2).map(artist => ({ "@type": "Person", name: artist.name })),
                offers: !isAccessibleForFree && data.salesPhases && data.salesPhases.length > 0 ? {
                  "@type": "Offer",
                  name: `Entrada ${subEvent.name}`,
                  price: data.salesPhases[0].zonesPricing[0]?.price || "0",
                  priceCurrency: data.currency || "USD",
                  availability: "https://schema.org/InStock",
                  url: ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}`),
                  validFrom: data.salesPhases[0]?.startDate ? new Date(data.salesPhases[0].startDate).toISOString() : startDateISO,
                  validThrough: data.salesPhases[0]?.endDate ? new Date(data.salesPhases[0].endDate).toISOString() : endDateISO,
                } : undefined,
              })),
            }),
          ...(data.mainImageUrl && {
            image: [
              {
                "@type": "ImageObject",
                url: data.mainImageUrl,
                width: 1200,
                height: 630,
                caption: data.name,
              },
              ...(data.bannerImageUrl ? [{
                "@type": "ImageObject",
                url: data.bannerImageUrl,
                width: 1200,
                height: 400,
                caption: `${data.name} - Banner`,
              }] : []),
            ],
          }),
          audience: {
            "@type": "Audience",
            audienceType: audienceType,
            name: audienceType === "public" ? "Público General" : audienceType,
          },
          aggregateRating:
            data.reviews && data.reviews.length > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length,
                  reviewCount: data.reviews.length,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
          keywords: data.tags?.join(", "),
          genre: data.categories?.join(", "),
          ...(data.isHighlighted && {
            superEvent: {
              "@type": "Festival",
              name: "RAVEHUB Music Festival Series",
            },
          }),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              item: {
                "@type": "Thing",
                "@id": ensureHttpsProtocol(baseUrl),
                name: "Home",
              },
            },
            {
              "@type": "ListItem",
              position: 2,
              item: {
                "@type": "Thing",
                "@id": ensureHttpsProtocol(`${baseUrl}/eventos/`),
                name: "Eventos",
              },
            },
            {
              "@type": "ListItem",
              position: 3,
              item: {
                "@type": "Thing",
                "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}/`),
                name: data.name,
              },
            },
          ],
        },
        // Add FAQ only if it exists
        ...(Array.isArray(data.faqSection) && data.faqSection.length > 0
          ? [
              {
                "@type": "FAQPage",
                "@id": ensureHttpsProtocol(`${baseUrl}/eventos/${data.slug}#faq`),
                mainEntity: data.faqSection.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                  },
                })),
              },
            ]
          : []),
      ],
    }

    setSchemaPreviewData(schemaData)
  }

  const handleSelectTemplate = (template: EventTemplate) => {
    const newData = {
      ...formData,
      ...template.defaultValues,
      // Keep existing values that shouldn't be overwritten
      name: formData.name || "",
      slug: formData.slug || "",
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
    }
    setFormData(newData)

    // Set template-specific values
    if (template.id === "festival") {
      setAudienceType("public")
      setIsAccessibleForFree(false)
    } else if (template.id === "music-event") {
      setAudienceType("public")
      setIsAccessibleForFree(false)
    }

    updateSchemaPreview(newData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear un evento",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo(0, 0)
      return
    }

    try {
      setLoading(true)
      toast({
        title: "Procesando",
        description: "Guardando la información del evento...",
      })

      let mainImageUrl = formData.mainImageUrl || ""
      let bannerImageUrl = formData.bannerImageUrl || ""

      // Upload main image if provided
      if (mainImage) {
        try {
          const mainImageRef = ref(storage, `events/main/${uuidv4()}`)
          await uploadBytes(mainImageRef, mainImage)
          mainImageUrl = await getDownloadURL(mainImageRef)
        } catch (imgError) {
          console.error("Error uploading main image:", imgError)
          toast({
            title: "Error",
            description: "No se pudo subir la imagen principal. Inténtalo de nuevo.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // Upload banner image if provided
      if (bannerImage) {
        try {
          const bannerImageRef = ref(storage, `events/banner/${uuidv4()}`)
          await uploadBytes(bannerImageRef, bannerImage)
          bannerImageUrl = await getDownloadURL(bannerImageRef)
        } catch (imgError) {
          console.error("Error uploading banner image:", imgError)
          toast({
            title: "Error",
            description: "No se pudo subir la imagen de banner. Inténtalo de nuevo.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const slug = formData.slug || generateSlug(formData.name || "")

      // Use the user-provided descriptionText for schema
      const descriptionText = formData.descriptionText

      // Prepare event data with additional schema fields
      const eventData = {
        ...(formData as Event),
        slug,
        mainImageUrl,
        bannerImageUrl,
        descriptionText, // Use user-provided plain text for schema
        doorTime: doorTime ? doorTime : undefined,
        audienceType: audienceType,
        isAccessibleForFree: isAccessibleForFree,
        typicalAgeRange: formData.typicalAgeRange || "18+",
        createdAt: eventId ? formData.createdAt! : new Date(),
        updatedAt: new Date(),
        createdBy: eventId ? formData.createdBy! : user.id,
        endDate: formData.isMultiDay ? formData.endDate : formData.startDate,
        endTime: formData.endTime || "23:00",
        isMultiDay: formData.isMultiDay || false,
      }

      // Save to database
      if (eventId) {
        await updateEvent(eventId, eventData)
        toast({
          title: "¡Éxito!",
          description: "El evento ha sido actualizado exitosamente",
        })
      } else {
        const newEventId = await createEvent(eventData as Event)
        toast({
          title: "¡Éxito!",
          description: `El evento "${formData.name}" ha sido creado exitosamente`,
        })
        console.log("Evento creado con ID:", newEventId)
      }

      router.push("/admin?tab=events")
    } catch (error) {
      console.error("Error saving event:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el evento. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArtistImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArtistImage(file)
      setArtistImagePreview(URL.createObjectURL(file))
    }
  }

  const addFaqItem = () => {
    if (!newFaqQuestion || !newFaqAnswer) {
      toast({
        title: "Error",
        description: "Debes completar tanto la pregunta como la respuesta",
        variant: "destructive",
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      faqSection: [...(prev.faqSection || []), { question: newFaqQuestion, answer: newFaqAnswer }],
    }))
    setNewFaqQuestion("")
    setNewFaqAnswer("")
  }

  const removeFaqItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faqSection: prev.faqSection?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubEventChange = (field: string, value: any) => {
    setNewSubEvent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addSubEvent = () => {
    if (!newSubEvent.name || !newSubEvent.description) {
      toast({
        title: "Error",
        description: "Debes completar el nombre y la descripción del sub-evento",
        variant: "destructive",
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      subEvents: [
        ...(prev.subEvents || []),
        {
          name: newSubEvent.name,
          description: newSubEvent.description,
          startDate: newSubEvent.startDate,
          endDate: newSubEvent.endDate,
        },
      ],
    }))
    setNewSubEvent({ name: "", description: "", startDate: new Date(), endDate: new Date() })
  }

  const removeSubEvent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subEvents: prev.subEvents?.filter((_, i) => i !== index) || [],
    }))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{eventId ? "Editar Evento" : "Crear Nuevo Evento"}</h1>
        <div className="flex gap-2">
          {!eventId && <EventTemplates onSelectTemplate={handleSelectTemplate} />}
          <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=events")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : eventId ? "Actualizar Evento" : "Crear Evento"}
          </Button>
        </div>
      </div>

      {/* Validation errors section */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al guardar</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="location">Ubicación</TabsTrigger>
          <TabsTrigger value="artists">Artistas</TabsTrigger>
          <TabsTrigger value="zones">Zonas</TabsTrigger>
          <TabsTrigger value="sales">Fases de Venta</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Evento *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                  <div className="flex justify-end">
                    <span className={`text-xs font-medium ${(formData.name?.length || 0) > 60 ? 'text-red-600' : (formData.name?.length || 0) > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {(formData.name?.length || 0)}/60 caracteres (título)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="slug">URL amigable (slug) *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSlugFromName}
                      className="text-xs"
                    >
                      Generar desde nombre
                    </Button>
                  </div>
                  <Input
                    id="slug"
                    value={formData.slug || ""}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="mi-evento-increible"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL única para el evento. Solo letras, números y guiones.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Update the currency field in the basic information tab to use a Select component instead of Input. Replace the existing currency input (around line 450) with: */}
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda *</Label>
                  <Select value={formData.currency || "USD"} onValueChange={(value) => handleChange("currency", value)}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Select
                    value={formData.country || ""}
                    onValueChange={handleCountryChange}
                    required
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Argentina">🇦🇷 Argentina</SelectItem>
                      <SelectItem value="Bolivia">🇧🇴 Bolivia</SelectItem>
                      <SelectItem value="Brasil">🇧🇷 Brasil</SelectItem>
                      <SelectItem value="Chile">🇨🇱 Chile</SelectItem>
                      <SelectItem value="Colombia">🇨🇴 Colombia</SelectItem>
                      <SelectItem value="Costa Rica">🇨🇷 Costa Rica</SelectItem>
                      <SelectItem value="Cuba">🇨🇺 Cuba</SelectItem>
                      <SelectItem value="Ecuador">🇪🇨 Ecuador</SelectItem>
                      <SelectItem value="El Salvador">🇸🇻 El Salvador</SelectItem>
                      <SelectItem value="Guatemala">🇬🇹 Guatemala</SelectItem>
                      <SelectItem value="Honduras">🇭🇳 Honduras</SelectItem>
                      <SelectItem value="México">🇲🇽 México</SelectItem>
                      <SelectItem value="Nicaragua">🇳🇮 Nicaragua</SelectItem>
                      <SelectItem value="Panamá">🇵🇦 Panamá</SelectItem>
                      <SelectItem value="Paraguay">🇵🇾 Paraguay</SelectItem>
                      <SelectItem value="Perú">🇵🇪 Perú</SelectItem>
                      <SelectItem value="Puerto Rico">🇵🇷 Puerto Rico</SelectItem>
                      <SelectItem value="República Dominicana">🇩🇴 República Dominicana</SelectItem>
                      <SelectItem value="Uruguay">🇺🇾 Uruguay</SelectItem>
                      <SelectItem value="Venezuela">🇻🇪 Venezuela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionText">Descripción SEO (Schema.org) *</Label>
                <Textarea
                  id="descriptionText"
                  value={formData.descriptionText || ""}
                  onChange={(e) => handleChange("descriptionText", e.target.value)}
                  rows={4}
                  placeholder="Descripción completa y persuasiva del evento para motores de búsqueda. Esta descripción aparecerá en los resultados de Google y es crucial para el SEO."
                  required
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Esta descripción se usa en el schema JSON-LD para Google. Debe ser atractiva y persuasiva.
                    <strong> No incluya código HTML, CSS o JavaScript aquí.</strong>
                  </p>
                  <span className={`text-xs font-medium ${(formData.descriptionText?.length || 0) > 160 ? 'text-red-600' : (formData.descriptionText?.length || 0) > 140 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {(formData.descriptionText?.length || 0)}/160 caracteres
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description">Descripción Completa</Label>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded-md">
                    Formato: HTML
                  </span>
                </div>
                <p className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-md border border-yellow-200 dark:border-yellow-800/30">
                  <strong>Nota:</strong> Puedes usar HTML para dar formato al contenido, incluyendo CSS y JavaScript. El
                  contenido se renderizará con formato en la página del evento.
                </p>
                <Tabs defaultValue="editor" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor" className="space-y-2">
                    <Editor
                      initialContent={formData.description || ""}
                      onChange={(content) => handleChange("description", content)}
                      mode="html"
                      onImageUpload={async (file) => {
                        try {
                          const storageRef = ref(storage, `events/content/${uuidv4()}`)
                          await uploadBytes(storageRef, file)
                          return await getDownloadURL(storageRef)
                        } catch (error) {
                          console.error("Error uploading image:", error)
                          toast({
                            title: "Error",
                            description: "No se pudo subir la imagen",
                            variant: "destructive",
                          })
                          return ""
                        }
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="preview">
                    <div className="border rounded-md p-4 min-h-[300px] prose max-w-none">
                      {formData.description ? (
                        <div dangerouslySetInnerHTML={{ __html: formData.description }} className="html-content" />
                      ) : (
                        <p className="text-muted-foreground">No hay contenido para previsualizar.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Imágenes del Evento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mainImage">Imagen Principal *</Label>
                    <Input
                      id="mainImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setMainImage, setMainImagePreview)}
                    />
                    {mainImagePreview && (
                      <div className="relative h-40 mt-2 rounded-md overflow-hidden">
                        <Image
                          src={mainImagePreview || "/placeholder.svg"}
                          alt="Vista previa de la imagen principal"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Imagen principal que se mostrará en las tarjetas y listados.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bannerImage">Imagen de Banner</Label>
                    <Input
                      id="bannerImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, setBannerImage, setBannerImagePreview)}
                    />
                    {bannerImagePreview && (
                      <div className="relative h-40 mt-2 rounded-md overflow-hidden">
                        <Image
                          src={bannerImagePreview || "/placeholder.svg"}
                          alt="Vista previa de la imagen de banner"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Banner de cabecera para la página detallada del evento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="isMultiDay"
                  checked={formData.isMultiDay}
                  onCheckedChange={(checked) => handleChange("isMultiDay", checked)}
                />
                <Label htmlFor="isMultiDay">Evento de múltiples días</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Tipo de Evento</Label>
                <Select value={formData.eventType || "dj_set"} onValueChange={(value) => handleChange("eventType", value)}>
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Selecciona tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dj_set">Concierto/DJ Set (MusicEvent)</SelectItem>
                    <SelectItem value="festival">Festival ([Festival, MusicEvent])</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona el tipo de evento para definir el Schema.org correspondiente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(
                              new Date(formData.startDate instanceof Date ? formData.startDate : Date.now()),
                              "PPP",
                              { locale: es },
                            )
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => {
                          handleChange("startDate", date)
                          if (!formData.isMultiDay) {
                            handleChange("endDate", date)
                          }
                        }}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Hora de Inicio</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime || ""}
                    onChange={(e) => handleChange("startTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doorTime">Hora de Apertura de Puertas (Schema.org)</Label>
                  <Input
                    id="doorTime"
                    type="time"
                    value={doorTime}
                    onChange={(e) => handleDoorTimeChange(e.target.value)}
                    placeholder="19:00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Hora exacta en que se abren las puertas del evento (mejora SEO).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audienceType">Tipo de Público (Schema.org)</Label>
                  <Select value={audienceType} onValueChange={handleAudienceTypeChange}>
                    <SelectTrigger id="audienceType">
                      <SelectValue placeholder="Selecciona tipo de público" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público General</SelectItem>
                      <SelectItem value="business">Empresarial</SelectItem>
                      <SelectItem value="students">Estudiantes</SelectItem>
                      <SelectItem value="senior">Adultos Mayores</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define el tipo de público objetivo para el schema.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAccessibleForFree"
                      checked={isAccessibleForFree}
                      onCheckedChange={handleIsAccessibleForFreeChange}
                    />
                    <Label htmlFor="isAccessibleForFree">Evento gratuito (sin costo de entrada)</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marca si el evento es gratuito. Esto afecta el Schema.org y las opciones de venta.
                  </p>
                </div>
              </div>

              {formData.isMultiDay ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate
                            ? format(
                                new Date(formData.endDate instanceof Date ? formData.endDate : Date.now()),
                                "PPP",
                                {
                                  locale: es,
                                },
                              )
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => handleChange("endDate", date)}
                          initialFocus
                          locale={es}
                          disabled={(date) => date < (formData.startDate as Date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Fin *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime || ""}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin</Label>
                    <Input
                      id="endDate"
                      type="text"
                      value={formData.startDate ? format(
                        new Date(formData.startDate instanceof Date ? formData.startDate : Date.now()),
                        "PPP",
                        { locale: es }
                      ) : ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Los conciertos duran un día. La fecha de fin es la misma que la de inicio.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime || ""}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                    />
                  </div>
                </div>
              )}
              {!formData.isMultiDay && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime || ""}
                      onChange={(e) => handleChange("endTime", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Categories and Tags Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Categorías</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Añadir categoría"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                    />
                    <Button type="button" onClick={addCategory} size="sm">
                      Añadir
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.categories && formData.categories.length > 0 ? (
                      formData.categories.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                        >
                          <span>{category}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1"
                            onClick={() => removeCategory(category)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay categorías</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Etiquetas</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Añadir etiqueta"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Añadir
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags && formData.tags.length > 0 ? (
                      formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center bg-primary/10 px-3 py-1 rounded-full">
                          <span>{tag}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 ml-1"
                            onClick={() => removeTag(tag)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay etiquetas</p>
                    )}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ubicación del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location.venueName">Nombre del Lugar *</Label>
                  <Input
                    id="location.venueName"
                    name="location.venueName"
                    value={formData.location?.venueName || ""}
                    onChange={(e) => handleChange("location", { ...formData.location, venueName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.location?.city || ""}
                    onChange={(e) => handleChange("location", { ...formData.location, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={formData.location?.address || ""}
                  onChange={(e) => handleChange("location", { ...formData.location, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Dirección Exacta (para SEO)</Label>
                <Input
                  id="streetAddress"
                  value={formData.location?.streetAddress || ""}
                  onChange={(e) => handleChange("location", { ...formData.location, streetAddress: e.target.value })}
                  placeholder="Av. Costanera 1545"
                />
                <p className="text-xs text-muted-foreground">
                  Dirección completa con número para mejorar la visibilidad en buscadores
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Región/Provincia</Label>
                  <Input
                    id="region"
                    value={formData.location?.region || ""}
                    onChange={(e) => handleChange("location", { ...formData.location, region: e.target.value })}
                    placeholder="Lima"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.location?.postalCode || ""}
                    onChange={(e) => handleChange("location", { ...formData.location, postalCode: e.target.value })}
                    placeholder="15086"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location.country">País *</Label>
                <Select
                  value={formData.location?.country || ""}
                  onValueChange={(value) => {
                    // Map country names to ISO codes for Schema.org
                    const countryCodes: Record<string, string> = {
                      "Argentina": "AR",
                      "Bolivia": "BO",
                      "Brasil": "BR",
                      "Chile": "CL",
                      "Colombia": "CO",
                      "Costa Rica": "CR",
                      "Cuba": "CU",
                      "Ecuador": "EC",
                      "El Salvador": "SV",
                      "Guatemala": "GT",
                      "Honduras": "HN",
                      "México": "MX",
                      "Nicaragua": "NI",
                      "Panamá": "PA",
                      "Paraguay": "PY",
                      "Perú": "PE",
                      "Puerto Rico": "PR",
                      "República Dominicana": "DO",
                      "Uruguay": "UY",
                      "Venezuela": "VE"
                    }
                    handleChange("location", {
                      ...formData.location,
                      country: value,
                      countryCode: countryCodes[value] || value
                    })
                    // Also update the main country field for timezone calculation
                    handleCountryChange(value)
                  }}
                  required
                >
                  <SelectTrigger id="location.country">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Argentina">🇦🇷 Argentina</SelectItem>
                    <SelectItem value="Bolivia">🇧🇴 Bolivia</SelectItem>
                    <SelectItem value="Brasil">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="Chile">🇨🇱 Chile</SelectItem>
                    <SelectItem value="Colombia">🇨🇴 Colombia</SelectItem>
                    <SelectItem value="Costa Rica">🇨🇷 Costa Rica</SelectItem>
                    <SelectItem value="Cuba">🇨🇺 Cuba</SelectItem>
                    <SelectItem value="Ecuador">🇪🇨 Ecuador</SelectItem>
                    <SelectItem value="El Salvador">🇸🇻 El Salvador</SelectItem>
                    <SelectItem value="Guatemala">🇬🇹 Guatemala</SelectItem>
                    <SelectItem value="Honduras">🇭🇳 Honduras</SelectItem>
                    <SelectItem value="México">🇲🇽 México</SelectItem>
                    <SelectItem value="Nicaragua">🇳🇮 Nicaragua</SelectItem>
                    <SelectItem value="Panamá">🇵🇦 Panamá</SelectItem>
                    <SelectItem value="Paraguay">🇵🇾 Paraguay</SelectItem>
                    <SelectItem value="Perú">🇵🇪 Perú</SelectItem>
                    <SelectItem value="Puerto Rico">🇵🇷 Puerto Rico</SelectItem>
                    <SelectItem value="República Dominicana">🇩🇴 República Dominicana</SelectItem>
                    <SelectItem value="Uruguay">🇺🇾 Uruguay</SelectItem>
                    <SelectItem value="Venezuela">🇻🇪 Venezuela</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.location?.latitude || 0}
                    onChange={(e) =>
                      handleChange("location", { ...formData.location, latitude: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.location?.longitude || 0}
                    onChange={(e) =>
                      handleChange("location", { ...formData.location, longitude: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Información Adicional</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.location?.additionalInfo || ""}
                  onChange={(e) => handleChange("location", { ...formData.location, additionalInfo: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Instrucciones para llegar, referencias, etc.</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Puedes obtener las coordenadas desde Google Maps</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lineup de Artistas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="text-lg font-medium">{editingArtistId ? "Editar Artista" : "Agregar Nuevo Artista"}</h3>

                {/* EventDJ Autocomplete */}
                {!editingArtistId && (
                  <div className="space-y-2">
                    <Label htmlFor="artistSearch">Buscar DJ existente</Label>
                    <ArtistAutocomplete
                      value={artistSearchValue}
                      onChange={setArtistSearchValue}
                      onArtistSelect={handleEventDJSelect}
                      placeholder="Escribe el nombre del DJ..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Busca DJs existentes o crea uno nuevo. Si no encuentras al DJ, escribe su nombre y presiona "Agregar Artista".
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistName">Nombre del Artista *</Label>
                    <Input
                      id="artistName"
                      value={newArtist.name || ""}
                      onChange={(e) => handleArtistChange("name", e.target.value)}
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="performerType">Tipo de Artista</Label>
                    <Select
                      value={(newArtist as any).performerType || "Person"}
                      onValueChange={(value) => handleArtistChange("performerType", value)}
                    >
                      <SelectTrigger id="performerType">
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Person">Artista Individual (Person)</SelectItem>
                        <SelectItem value="MusicGroup">Grupo Musical (MusicGroup)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecciona si es un artista solista o un grupo musical.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artistInstagram">Instagram</Label>
                    <Input
                      id="artistInstagram"
                      value={newArtist.instagramHandle || ""}
                      onChange={(e) => handleArtistChange("instagramHandle", e.target.value)}
                      placeholder="@artistaoficial"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistSpotify">URL de Spotify</Label>
                    <Input
                      id="artistSpotify"
                      value={newArtist.spotifyUrl || ""}
                      onChange={(e) => handleArtistChange("spotifyUrl", e.target.value)}
                      placeholder="https://open.spotify.com/artist/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artistSoundcloud">URL de SoundCloud</Label>
                    <Input
                      id="artistSoundcloud"
                      value={newArtist.soundcloudUrl || ""}
                      onChange={(e) => handleArtistChange("soundcloudUrl", e.target.value)}
                      placeholder="https://soundcloud.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artistDescription">Descripción</Label>
                  <Textarea
                    id="artistDescription"
                    value={newArtist.description || ""}
                    onChange={(e) => handleArtistChange("description", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={newArtist.isFeatured || false}
                    onCheckedChange={(checked) => handleArtistChange("isFeatured", checked)}
                  />
                  <Label htmlFor="isFeatured">Artista destacado</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Marca este artista como destacado para que aparezca primero en las descripciones SEO.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="artistImage">Imagen del Artista</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="useImageLink" className="text-sm">
                        Usar URL
                      </Label>
                      <Switch
                        id="useImageLink"
                        checked={useImageLink}
                        onCheckedChange={(checked) => setUseImageLink(checked)}
                      />
                    </div>
                  </div>

                  {useImageLink ? (
                    <div className="space-y-2">
                      <Input
                        id="artistImageUrl"
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={artistImageUrlValue}
                        onChange={(e) => {
                          setArtistImageUrlValue(e.target.value)
                          handleArtistChange("imageUrl", e.target.value)
                        }}
                      />
                      {artistImageUrlValue && (
                        <div className="relative h-40 mt-2 rounded-md overflow-hidden">
                          <Image
                            src={artistImageUrlValue || "/placeholder.svg"}
                            alt="Vista previa de imagen del artista"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="artistImage"
                        type="file"
                        accept="image/*"
                        onChange={handleArtistImageChange}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {!useImageLink && artistImagePreview && (
                    <div className="relative h-40 mt-2 rounded-md overflow-hidden">
                      <Image
                        src={artistImagePreview || "/placeholder.svg"}
                        alt="Vista previa de imagen del artista"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {editingArtistId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingArtistId(null)
                          setNewArtist({
                            name: "",
                            imageUrl: "",
                            description: "",
                            instagramHandle: "",
                            spotifyUrl: "",
                            soundcloudUrl: "",
                            order: 0,
                            isFeatured: false,
                          })
                          setArtistImage(null)
                          setArtistImagePreview("")
                          setUseImageLink(false)
                        }}
                      >
                        Cancelar Edición
                      </Button>
                    )}
                    <Button type="button" onClick={addArtist}>
                      {editingArtistId ? "Actualizar Artista" : "Agregar Artista"}
                    </Button>
                </div>

                {/* SEO Preview Section */}
                <div className="mt-6 space-y-4">
                  <GoogleSearchPreview
                    title={formData.name ? (() => {
                      const locationPart = formData.eventType === "festival" ? "" : ` en ${formData.location?.city || 'Latinoamérica'}`;
                      const year = formData.startDate ? new Date(formData.startDate).getFullYear() : '';
                      const yearPart = year ? ` ${year}` : '';
                      return `${formData.name}${locationPart}${yearPart}: Entradas y Fecha | Ravehub`;
                    })() : ''}
                    description={(() => {
                      const featuredArtist = formData.artistLineup?.find(artist => artist.isFeatured);
                      const featuredName = featuredArtist?.name || "Artistas destacados";
                      const formattedDate = formData.startDate ? new Date(formData.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                      const location = formData.location?.venueName || formData.location?.city || 'Latinoamérica';

                      let description: string;
                      if (formData.eventType === "festival") {
                        // Mantener la lógica actual para festivales
                        if (!formData.artistLineup || formData.artistLineup.length === 0) {
                          description = `¡No te pierdas ${formData.name || '[Nombre del evento]'}! Con un increíble lineup por anunciarse. Compra tus entradas para este ${formattedDate} en ${location}.`;
                        } else {
                          const secondArtist = formData.artistLineup.find(artist => !artist.isFeatured && artist.name !== featuredName)?.name;
                          const lineupText = secondArtist ? `${featuredName}, ${secondArtist} y muchos más` : `${featuredName} y muchos más`;
                          description = `¡Vive ${formData.name || '[Nombre del evento]'} con ${lineupText}! Compra tus entradas para este ${formattedDate} en ${location}.`;
                        }
                      } else {
                        // Nueva lógica para eventos que NO son festivales (dj_set, concert, other)
                        const venueName = formData.location?.venueName || formData.location?.city || 'el lugar';
                        const cityName = formData.location?.city || 'la ciudad';
                        const otherArtists = formData.artistLineup?.filter(artist => !artist.isFeatured) || [];

                        if (!formData.artistLineup || formData.artistLineup.length === 0) {
                          description = `${formData.name || '[Nombre del evento]'} llega a ${cityName} este ${formattedDate} en ${venueName}. ¡Compra tus entradas ahora!`;
                        } else if (formData.artistLineup.length === 1) {
                          description = `${featuredName} llega a ${cityName} este ${formattedDate} en ${venueName}. ¡Compra tus entradas ahora!`;
                        } else {
                          // Para múltiples artistas, incluir hasta 2 adicionales
                          const additionalArtists = otherArtists.slice(0, 2).map(a => a.name);
                          const artistsText = additionalArtists.length > 0 ? ` junto a ${additionalArtists.join(' y ')}` : '';
                          description = `${featuredName} llega a ${cityName} este ${formattedDate} en ${venueName}${artistsText}. ¡Compra tus entradas ahora!`;
                        }
                      }
                      return description;
                    })()}
                    url={`https://www.ravehublatam.com/eventos/${formData.slug || 'ejemplo'}`}
                    date={formData.startDate ? new Date(formData.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
                    location={formData.location?.city ? `${formData.location.city}${formData.location.venueName ? ` - ${formData.location.venueName}` : ''}` : undefined}
                    artists={formData.artistLineup?.map(artist => artist.name) || []}
                    eventType={formData.eventType}
                  />
                </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Lineup de Artistas</h3>
                  <p className="text-sm text-muted-foreground">
                    Arrastra y suelta para reordenar los artistas. El orden afecta el SEO y la presentación.
                  </p>
                  <ArtistListDraggable
                    artists={formData.artistLineup || []}
                    onReorder={reorderArtists}
                    onEdit={(artistId) => {
                      const currentArtist = formData.artistLineup?.find((a) => a.id === artistId)
                      if (currentArtist) {
                        // First determine if this was a link image
                        const isImageLink =
                          !!currentArtist.imageUrl && !currentArtist.imageUrl.includes("firebase")

                        // Set these states in this order
                        setUseImageLink(isImageLink)

                        // Then update the artist details
                        setNewArtist({
                          name: currentArtist.name,
                          imageUrl: currentArtist.imageUrl || "",
                          description: currentArtist.description || "",
                          instagramHandle: currentArtist.instagramHandle || "",
                          spotifyUrl: currentArtist.spotifyUrl || "",
                          soundcloudUrl: currentArtist.soundcloudUrl || "",
                          order: currentArtist.order,
                          isFeatured: currentArtist.isFeatured || false,
                          performerType: (currentArtist as any).performerType || "Person",
                          members: (currentArtist as any).members || [],
                          alternateName: (currentArtist as any).alternateName || "",
                          birthDate: (currentArtist as any).birthDate || "",
                          jobTitle: (currentArtist as any).jobTitle || [],
                          foundingDate: (currentArtist as any).foundingDate || "",
                          famousTracks: (currentArtist as any).famousTracks || [],
                          famousAlbums: (currentArtist as any).famousAlbums || [],
                          wikipediaUrl: (currentArtist as any).socialLinks?.wikipedia || "",
                          officialWebsite: (currentArtist as any).socialLinks?.website || "",
                          facebookUrl: (currentArtist as any).socialLinks?.facebook || "",
                          twitterUrl: (currentArtist as any).socialLinks?.twitter || "",
                        })

                        // Set preview if it's a firebase image
                        if (!isImageLink && currentArtist.imageUrl) {
                          setArtistImagePreview(currentArtist.imageUrl)
                        } else {
                          setArtistImagePreview("")
                        }

                        // Set URL value for link input
                        if (isImageLink && currentArtist.imageUrl) {
                          setArtistImageUrlValue(currentArtist.imageUrl)
                        } else {
                          setArtistImageUrlValue("")
                        }

                        // Set editing ID last
                        setEditingArtistId(currentArtist.id)
                      }
                    }}
                    onRemove={removeArtist}
                    onToggleFeatured={toggleArtistFeatured}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Zonas del Evento</CardTitle>
              <Button type="button" onClick={addZone} size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span>Agregar Zona</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.zones && formData.zones.length > 0 ? (
                <div className="space-y-4">
                  {formData.zones.map((zone) => (
                    <Card key={zone.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h3 className="font-bold">{zone.name}</h3>
                            <p className="text-sm text-muted-foreground">Capacidad: {zone.capacity}</p>
                          </div>
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeZone(zone.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`zone-name-${zone.id}`}>Nombre de la Zona</Label>
                            <Input
                              id={`zone-name-${zone.id}`}
                              value={zone.name}
                              onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`zone-capacity-${zone.id}`}>Capacidad</Label>
                            <Input
                              id={`zone-capacity-${zone.id}`}
                              type="number"
                              min="1"
                              value={zone.capacity}
                              onChange={(e) => updateZone(zone.id, "capacity", Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mt-4">
                          <Label htmlFor={`zone-description-${zone.id}`}>Descripción</Label>
                          <Textarea
                            id={`zone-description-${zone.id}`}
                            value={zone.description || ""}
                            onChange={(e) => updateZone(zone.id, "description", e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <Switch
                            id={`zone-active-${zone.id}`}
                            checked={zone.isActive}
                            onChange={(checked) => updateZone(zone.id, "isActive", checked)}
                          />
                          <Label htmlFor={`zone-active-${zone.id}`}>Zona activa</Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay zonas agregadas</p>
                  <Button type="button" onClick={addZone} className="mt-4">
                    Agregar Zona
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Phases Tab */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fases de Venta</CardTitle>
              <Button
                type="button"
                onClick={addSalesPhase}
                size="sm"
                className="flex items-center gap-1"
                disabled={formData.zones?.length === 0}
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Fase</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ticket Settings */}
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="text-lg font-medium">Configuración de Entradas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sellTicketsOnPlatform"
                      checked={formData.sellTicketsOnPlatform}
                      onCheckedChange={(checked) => handleChange("sellTicketsOnPlatform", checked)}
                    />
                    <Label htmlFor="sellTicketsOnPlatform">Vender entradas en la plataforma</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isHighlighted"
                      checked={formData.isHighlighted}
                      onCheckedChange={(checked) => handleChange("isHighlighted", checked)}
                    />
                    <Label htmlFor="isHighlighted">Destacar en la página principal</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowOfflinePayments"
                      checked={formData.allowOfflinePayments}
                      onCheckedChange={(checked) => handleChange("allowOfflinePayments", checked)}
                    />
                    <Label htmlFor="allowOfflinePayments">Permitir pagos offline</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowInstallmentPayments"
                      checked={formData.allowInstallmentPayments}
                      onCheckedChange={(checked) => handleChange("allowInstallmentPayments", checked)}
                    />
                    <Label htmlFor="allowInstallmentPayments">Permitir pagos en cuotas</Label>
                  </div>
                </div>

                {!formData.sellTicketsOnPlatform && (
                  <div className="space-y-2">
                    <Label htmlFor="externalTicketUrl">URL externa para la venta de entradas</Label>
                    <Input
                      id="externalTicketUrl"
                      type="url"
                      value={formData.externalTicketUrl || ""}
                      onChange={(e) => handleChange("externalTicketUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
              {formData.zones?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Primero debes agregar zonas al evento</p>
                  <Button type="button" onClick={() => setActiveTab("zones")} className="mt-4">
                    Ir a Zonas
                  </Button>
                </div>
              ) : formData.salesPhases && formData.salesPhases.length > 0 ? (
                <div className="space-y-6">
                  {formData.salesPhases.map((phase) => (
                    <Card key={phase.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h3 className="font-bold">{phase.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(
                                phase.startDate instanceof Date ? phase.startDate : Date.now(),
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                phase.endDate instanceof Date ? phase.endDate : Date.now(),
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Button type="button" variant="destructive" size="icon" onClick={() => removePhase(phase.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`phase-name-${phase.id}`}>Nombre de la Fase</Label>
                            <Input
                              id={`phase-name-${phase.id}`}
                              value={phase.name}
                              onChange={(e) => updatePhase(phase.id, "name", e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`phase-active-${phase.id}`}>Estado</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`phase-active-${phase.id}`}
                                checked={phase.isActive}
                                onChange={(checked) => updatePhase(phase.id, "isActive", checked)}
                              />
                              <Label htmlFor={`phase-active-${phase.id}`}>Fase activa</Label>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label htmlFor={`phase-start-${phase.id}`}>Fecha de Inicio</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id={`phase-start-${phase.id}`}
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(
                                    new Date(phase.startDate instanceof Date ? phase.startDate : Date.now()),
                                    "PPP",
                                    { locale: es },
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(phase.startDate)}
                                  onSelect={(date) => updatePhase(phase.id, "startDate", date)}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`phase-end-${phase.id}`}>Fecha de Fin</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id={`phase-end-${phase.id}`}
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(new Date(phase.endDate instanceof Date ? phase.endDate : Date.now()), "PPP", {
                                    locale: es,
                                  })}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={new Date(phase.endDate)}
                                  onSelect={(date) => updatePhase(phase.id, "endDate", date)}
                                  initialFocus
                                  locale={es}
                                  disabled={(date) => {
                                    // Get the event end date (either the end date for multi-day events or the start date for single-day events)
                                    const eventEndDate = formData.isMultiDay
                                      ? new Date(formData.endDate instanceof Date ? formData.endDate : Date.now())
                                      : new Date(formData.startDate instanceof Date ? formData.startDate : Date.now())

                                    // The end date of a sales phase can't be after the event's end date
                                    return date > eventEndDate
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-medium mb-4">Precios por Zona</h4>
                          <div className="space-y-4">
                            {phase.zonesPricing.map((pricing) => {
                              const zone = formData.zones?.find((z) => z.id === pricing.zoneId)
                              return (
                                <div
                                  key={`${phase.id}-${pricing.zoneId}`}
                                  className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-md"
                                >
                                  <div>
                                    <Label className="text-muted-foreground">Zona</Label>
                                    <p className="font-medium">{zone?.name}</p>
                                  </div>
                                  {/* In the pricing section for zones, update the price input to show the currency symbol. Replace the existing price input div (around line 1050) with: */}
                                  <div className="space-y-2">
                                    <Label htmlFor={`pricing-price-${phase.id}-${pricing.zoneId}`}>
                                      Precio (
                                      {currencyOptions.find((c) => c.value === (formData.currency || "USD"))?.symbol ||
                                        "$"}
                                      )
                                    </Label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                        {currencyOptions.find((c) => c.value === (formData.currency || "USD"))
                                          ?.symbol || "$"}
                                      </span>
                                      <Input
                                        id={`pricing-price-${phase.id}-${pricing.zoneId}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={pricing.price}
                                        onChange={(e) =>
                                          updatePricing(phase.id, pricing.zoneId, "price", Number(e.target.value))
                                        }
                                        className="pl-8"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`pricing-available-${phase.id}-${pricing.zoneId}`}>
                                      Disponibles
                                    </Label>
                                    <Input
                                      id={`pricing-available-${phase.id}-${pricing.zoneId}`}
                                      type="number"
                                      min="0"
                                      max={zone?.capacity || 100}
                                      value={pricing.available}
                                      onChange={(e) =>
                                        updatePricing(phase.id, pricing.zoneId, "available", Number(e.target.value))
                                      }
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay fases de venta agregadas</p>
                  <Button type="button" onClick={addSalesPhase} className="mt-4">
                    Agregar Fase de Venta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inLanguage">Idioma del contenido</Label>
                  <Select
                    value={formData.inLanguage || "es"}
                    onValueChange={(value) => handleChange("inLanguage", value)}
                  >
                    <SelectTrigger id="inLanguage">
                      <SelectValue placeholder="Selecciona idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                      {/* Add more languages as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventStatus">Estado del evento (Schema.org)</Label>
                  <Select
                    value={formData.eventStatus || "http://schema.org/EventScheduled"}
                    onValueChange={(value) => handleChange("eventStatus", value)}
                  >
                    <SelectTrigger id="eventStatus">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http://schema.org/EventScheduled">Programado</SelectItem>
                      <SelectItem value="http://schema.org/EventCancelled">Cancelado</SelectItem>
                      <SelectItem value="http://schema.org/EventPostponed">Pospuesto</SelectItem>
                      <SelectItem value="http://schema.org/EventMovedOnline">Movido a Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventAttendanceMode">Modo de asistencia (Schema.org)</Label>
                <Select
                  value={formData.eventAttendanceMode || "http://schema.org/OfflineEventAttendanceMode"}
                  onValueChange={(value) => handleChange("eventAttendanceMode", value)}
                >
                  <SelectTrigger id="eventAttendanceMode">
                    <SelectValue placeholder="Selecciona modo de asistencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http://schema.org/OfflineEventAttendanceMode">Presencial</SelectItem>
                    <SelectItem value="http://schema.org/OnlineEventAttendanceMode">Online</SelectItem>
                    <SelectItem value="http://schema.org/MixedEventAttendanceMode">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizerName">Nombre del Organizador</Label>
                  <Input
                    id="organizerName"
                    value={formData.organizer?.name || ""}
                    onChange={(e) => handleChange("organizer", { ...formData.organizer, name: e.target.value })}
                    placeholder="Nombre del organizador"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizerUrl">URL del Organizador</Label>
                  <Input
                    id="organizerUrl"
                    type="url"
                    value={formData.organizer?.url || ""}
                    onChange={(e) => handleChange("organizer", { ...formData.organizer, url: e.target.value })}
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-medium">Preguntas Frecuentes (FAQ)</h3>

                <div className="space-y-4 border rounded-md p-4">
                  <div className="space-y-2">
                    <Label htmlFor="faqQuestion">Pregunta</Label>
                    <Input
                      id="faqQuestion"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      placeholder="¿Cuál es la edad mínima para asistir?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faqAnswer">Respuesta</Label>
                    <Textarea
                      id="faqAnswer"
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      rows={3}
                      placeholder="La edad mínima para asistir es 18 años."
                    />
                  </div>

                  <Button type="button" onClick={addFaqItem} disabled={!newFaqQuestion || !newFaqAnswer}>
                    Añadir FAQ
                  </Button>
                </div>

                {formData.faqSection && formData.faqSection.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    {formData.faqSection.map((faq, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{faq.question}</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFaqItem(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay preguntas frecuentes agregadas</p>
                )}
              </div>

              {/* Sub-events Section - Only show for festivals */}
              {formData.eventType === "festival" && (
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-medium">Sub-eventos (Días del Festival)</h3>

                <div className="space-y-4 border rounded-md p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subEventName">Nombre del Sub-evento</Label>
                      <Input
                        id="subEventName"
                        value={newSubEvent.name}
                        onChange={(e) => handleSubEventChange("name", e.target.value)}
                        placeholder="Afterparty"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subEventDescription">Descripción</Label>
                      <Input
                        id="subEventDescription"
                        value={newSubEvent.description}
                        onChange={(e) => handleSubEventChange("description", e.target.value)}
                        placeholder="Fiesta después del evento principal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="subEventStartDate">Fecha de inicio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="subEventStartDate"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newSubEvent.startDate, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newSubEvent.startDate}
                            onSelect={(date) => handleSubEventChange("startDate", date)}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subEventEndDate">Fecha de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="subEventEndDate"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newSubEvent.endDate, "PPP", { locale: es })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newSubEvent.endDate}
                            onSelect={(date) => handleSubEventChange("endDate", date)}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={addSubEvent}
                    disabled={!newSubEvent.name || !newSubEvent.description}
                    className="mt-2"
                  >
                    Añadir Sub-evento
                  </Button>
                </div>

                {formData.subEvents && formData.subEvents.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    {formData.subEvents.map((subEvent, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{subEvent.name}</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSubEvent(index)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{subEvent.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(subEvent.startDate), "PPP", { locale: es })} -
                            {format(new Date(subEvent.endDate), "PPP", { locale: es })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay sub-eventos agregados</p>
                )}
                </div>
              )}

              {/* Schema Preview Button */}
              <div className="mt-6">
                <Button type="button" variant="outline" onClick={() => setShowSchemaPreview(!showSchemaPreview)}>
                  {showSchemaPreview ? "Ocultar" : "Mostrar"} Vista Previa de Schema.org
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update the EventSchemaPreview component import and usage. Add the currency prop when calling EventSchemaPreview (around line 1200): */}
      {showSchemaPreview && (
        <EventSchemaPreview
          event={formData as Event}
          currency={formData.currency || "USD"}
          schemaData={schemaPreviewData}
        />
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin?tab=events")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : eventId ? "Actualizar Evento" : "Crear Evento"}
        </Button>
      </div>
    </form>
  )
}
