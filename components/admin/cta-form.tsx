"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Search, Smartphone, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCTA, updateCTA } from "@/lib/firebase/ctas"
import { getEventsForAdmin } from "@/lib/firebase/events"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { EventCTA, Event } from "@/types"
import { EventCTAPreview } from "@/components/admin/event-cta-preview"

// Esquema de validación para el formulario
const ctaFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  eventId: z.string().min(1, "Debes seleccionar un evento"),
  contactType: z.enum(["whatsapp", "link"]),
  contactValue: z.string().min(1, "El valor de contacto es obligatorio"),
  hasCountdown: z.boolean().default(false),
  countdownEndDate: z.date().optional(),
  isActive: z.boolean().default(true),
  styles: z.object({
    backgroundColor: z.string().default("#000000"),
    backgroundGradient: z.string().optional(),
    titleColor: z.string().default("#ffffff"),
    descriptionColor: z.string().default("#cccccc"),
    buttonColor: z.string().default("#ff0000"),
    buttonTextColor: z.string().default("#ffffff"),
    countdownColor: z.string().optional(),
    countdownNumbersColor: z.string().optional(),
    countdownLabelsColor: z.string().optional(),
  }),
})

type CTAFormValues = z.infer<typeof ctaFormSchema>

interface CTAFormProps {
  cta?: EventCTA
}

export function CTAForm({ cta }: CTAFormProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Valores por defecto para el formulario
  const defaultValues: Partial<CTAFormValues> = {
    title: cta?.title || "",
    description: cta?.description || "",
    eventId: cta?.eventId || "",
    contactType: cta?.contactType || "whatsapp",
    contactValue: cta?.contactValue || "",
    hasCountdown: cta?.hasCountdown || false,
    countdownEndDate: cta?.countdownEndDate ? new Date(cta.countdownEndDate) : undefined,
    isActive: cta?.isActive ?? true,
    styles: {
      backgroundColor: cta?.styles?.backgroundColor || "#000000",
      backgroundGradient: cta?.styles?.backgroundGradient || "",
      titleColor: cta?.styles?.titleColor || "#ffffff",
      descriptionColor: cta?.styles?.descriptionColor || "#cccccc",
      buttonColor: cta?.styles?.buttonColor || "#ff0000",
      buttonTextColor: cta?.styles?.buttonTextColor || "#ffffff",
      countdownColor: cta?.styles?.countdownColor || "#ffffff",
      countdownNumbersColor: cta?.styles?.countdownNumbersColor || "#ffffff",
      countdownLabelsColor: cta?.styles?.countdownLabelsColor || "#cccccc",
    },
  }

  // Inicializar el formulario
  const form = useForm<CTAFormValues>({
    resolver: zodResolver(ctaFormSchema),
    defaultValues,
  })

  // Cargar eventos al montar el componente
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const eventsData = await getEventsForAdmin()
        setEvents(eventsData)
        setFilteredEvents(eventsData)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Filtrar eventos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEvents(events)
    } else {
      const filtered = events.filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredEvents(filtered)
    }
  }, [searchTerm, events])

  // Manejar el envío del formulario
  const onSubmit = async (data: CTAFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      if (cta) {
        // Actualizar CTA existente
        await updateCTA(cta.id, {
          ...data,
          updatedBy: user.id,
        })
        toast({
          title: "CTA actualizado",
          description: "El CTA ha sido actualizado correctamente",
        })
      } else {
        // Crear nuevo CTA
        await createCTA({
          ...data,
          createdBy: user.id,
          updatedBy: user.id,
        })
        toast({
          title: "CTA creado",
          description: "El CTA ha sido creado correctamente",
        })
      }

      router.push("/admin/ctas")
    } catch (error) {
      console.error("Error saving CTA:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el CTA",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Obtener valores actuales del formulario para la vista previa
  const watchedValues = form.watch()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="form">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Formulario</TabsTrigger>
          <TabsTrigger value="preview">Vista previa</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda: Información básica */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Información básica</h3>

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Compra rápido por WhatsApp aquí" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ej: Últimas entradas ultra para Ultra Perú" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="eventId"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Evento</FormLabel>
                            <div className="mb-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar evento..."
                                  className="pl-8"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un evento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredEvents.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                      {loading ? "Cargando eventos..." : "No se encontraron eventos"}
                                    </div>
                                  ) : (
                                    filteredEvents.map((event) => (
                                      <SelectItem key={event.id} value={event.id}>
                                        {event.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>El CTA se mostrará en la página de este evento</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactType"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Tipo de contacto</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona tipo de contacto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="whatsapp">
                                    <div className="flex items-center">
                                      <Smartphone className="h-4 w-4 mr-2" />
                                      <span>WhatsApp</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="link">
                                    <div className="flex items-center">
                                      <Link2 className="h-4 w-4 mr-2" />
                                      <span>Link externo</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactValue"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>
                              {form.getValues("contactType") === "whatsapp" ? "Número de WhatsApp" : "URL del enlace"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={
                                  form.getValues("contactType") === "whatsapp"
                                    ? "Ej: 51999999999 (sin + ni espacios)"
                                    : "Ej: https://www.ejemplo.com"
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {form.getValues("contactType") === "whatsapp"
                                ? "Ingresa solo números, sin el símbolo + ni espacios"
                                : "Ingresa la URL completa, incluyendo https://"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="hasCountdown"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Mostrar countdown</FormLabel>
                                <FormDescription>
                                  Muestra un contador regresivo hasta la fecha especificada
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {form.watch("hasCountdown") && (
                          <FormField
                            control={form.control}
                            name="countdownEndDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha y hora de finalización</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground",
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP HH:mm", { locale: es })
                                        ) : (
                                          <span>Selecciona fecha y hora</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={(date) => {
                                        if (date) {
                                          const currentDate = field.value || new Date()
                                          date.setHours(currentDate.getHours())
                                          date.setMinutes(currentDate.getMinutes())
                                          field.onChange(date)
                                        }
                                      }}
                                      initialFocus
                                    />
                                    <div className="p-3 border-t">
                                      <div className="flex items-center justify-between">
                                        <FormLabel>Hora:</FormLabel>
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            type="time"
                                            value={field.value ? format(field.value, "HH:mm") : ""}
                                            onChange={(e) => {
                                              const [hours, minutes] = e.target.value.split(":")
                                              const newDate = field.value || new Date()
                                              newDate.setHours(Number.parseInt(hours))
                                              newDate.setMinutes(Number.parseInt(minutes))
                                              field.onChange(newDate)
                                            }}
                                            className="w-24"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  El countdown se ocultará automáticamente al llegar a esta fecha y hora
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Activo</FormLabel>
                                <FormDescription>Mostrar u ocultar este CTA en la página del evento</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Columna derecha: Estilos */}
                <div className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-medium mb-4">Personalización de estilos</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="styles.backgroundColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color de fondo</FormLabel>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }} />
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="styles.backgroundGradient"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gradiente (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="linear-gradient(45deg, #ff0000, #0000ff)"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Ej: linear-gradient(45deg, #ff0000, #0000ff)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="styles.titleColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color del título</FormLabel>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }} />
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="styles.descriptionColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color de la descripción</FormLabel>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }} />
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="styles.buttonColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color del botón</FormLabel>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }} />
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="styles.buttonTextColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color del texto del botón</FormLabel>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: field.value }} />
                                <FormControl>
                                  <Input type="color" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("hasCountdown") && (
                        <div className="mt-6 space-y-4">
                          <h4 className="font-medium">Estilos del countdown</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="styles.countdownColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color del countdown</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-full border"
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <FormControl>
                                      <Input
                                        type="color"
                                        {...field}
                                        value={field.value || "#ffffff"}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="styles.countdownNumbersColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Color de los números</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-full border"
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <FormControl>
                                      <Input
                                        type="color"
                                        {...field}
                                        value={field.value || "#ffffff"}
                                        onChange={(e) => field.onChange(e.target.value)}
                                      />
                                    </FormControl>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="styles.countdownLabelsColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color de las etiquetas</FormLabel>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full border"
                                    style={{ backgroundColor: field.value }}
                                  />
                                  <FormControl>
                                    <Input
                                      type="color"
                                      {...field}
                                      value={field.value || "#cccccc"}
                                      onChange={(e) => field.onChange(e.target.value)}
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/ctas")}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      {cta ? "Actualizando..." : "Creando..."}
                    </>
                  ) : cta ? (
                    "Actualizar CTA"
                  ) : (
                    "Crear CTA"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Vista previa del CTA</h3>
              <div className="border rounded-lg overflow-hidden">
                <EventCTAPreview
                  cta={{
                    id: cta?.id || "preview",
                    title: watchedValues.title || "Título del CTA",
                    description: watchedValues.description || "Descripción del CTA",
                    eventId: watchedValues.eventId || "",
                    contactType: watchedValues.contactType || "whatsapp",
                    contactValue: watchedValues.contactValue || "",
                    hasCountdown: watchedValues.hasCountdown || false,
                    countdownEndDate: watchedValues.countdownEndDate,
                    isActive: true,
                    styles: {
                      backgroundColor: watchedValues.styles?.backgroundColor || "#000000",
                      backgroundGradient: watchedValues.styles?.backgroundGradient || "",
                      titleColor: watchedValues.styles?.titleColor || "#ffffff",
                      descriptionColor: watchedValues.styles?.descriptionColor || "#cccccc",
                      buttonColor: watchedValues.styles?.buttonColor || "#ff0000",
                      buttonTextColor: watchedValues.styles?.buttonTextColor || "#ffffff",
                      countdownColor: watchedValues.styles?.countdownColor || "#ffffff",
                      countdownNumbersColor: watchedValues.styles?.countdownNumbersColor || "#ffffff",
                      countdownLabelsColor: watchedValues.styles?.countdownLabelsColor || "#cccccc",
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: "",
                    updatedBy: "",
                  }}
                  isPreview={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
