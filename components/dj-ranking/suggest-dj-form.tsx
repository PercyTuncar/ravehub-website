"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { searchDJSuggestions, addDJSuggestion } from "@/lib/firebase/dj-suggestions"
import type { DJSuggestion } from "@/types/dj-ranking"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// List of countries
const countries = [
  { value: "peru", label: "Perú" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "mexico", label: "México" },
  { value: "spain", label: "España" },
  { value: "usa", label: "Estados Unidos" },
  // Add more countries as needed
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  instagram: z.string().min(1, {
    message: "El Instagram es requerido.",
  }),
  country: z.string({
    required_error: "Por favor selecciona un país.",
  }),
})

export function SuggestDJForm() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<DJSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<DJSuggestion | null>(null)
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      instagram: "",
      country: "",
    },
  })

  const watchName = form.watch("name")

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (watchName.length >= 2) {
        const results = await searchDJSuggestions(watchName)
        setSuggestions(results)
      } else {
        setSuggestions([])
      }
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [watchName])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para sugerir un DJ.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (selectedSuggestion) {
        // User selected an existing suggestion
        await addDJSuggestion({
          name: selectedSuggestion.name,
          instagram: selectedSuggestion.instagram,
          country: selectedSuggestion.country,
          suggestedBy: [user.id],
        })
      } else {
        // New suggestion
        await addDJSuggestion({
          name: values.name,
          instagram: values.instagram,
          country: values.country,
          suggestedBy: [user.id],
        })
      }

      toast({
        title: "¡Gracias por tu sugerencia!",
        description: "Tu DJ ha sido sugerido exitosamente.",
      })

      form.reset()
      setSelectedSuggestion(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al sugerir el DJ.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectSuggestion = (suggestion: DJSuggestion) => {
    setSelectedSuggestion(suggestion)
    form.setValue("name", suggestion.name)
    form.setValue("instagram", suggestion.instagram)
    form.setValue("country", suggestion.country)
    setOpen(false)
  }

  const handleClearSuggestion = () => {
    setSelectedSuggestion(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Nombre del DJ</FormLabel>
                <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Ej. Carl Cox"
                          {...field}
                          className={cn(selectedSuggestion && "border-green-500 pr-10")}
                        />
                        {selectedSuggestion && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Check className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar DJ..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron DJs.</CommandEmpty>
                        <CommandGroup>
                          {suggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion.id}
                              value={suggestion.name}
                              onSelect={() => handleSelectSuggestion(suggestion)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSuggestion?.id === suggestion.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {suggestion.name} ({suggestion.instagram})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedSuggestion && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    DJ ya sugerido. Al enviar, aumentarás su popularidad.
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="ml-2 text-gray-500"
                      onClick={handleClearSuggestion}
                    >
                      No es el mismo
                    </Button>
                  </div>
                )}
                <FormDescription>Ingresa el nombre artístico del DJ.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. carlcox_official" {...field} disabled={!!selectedSuggestion} />
                </FormControl>
                <FormDescription>Ingresa el usuario de Instagram sin el @.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedSuggestion}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Selecciona el país de origen del DJ.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Sugerir DJ"}
        </Button>
      </form>
    </Form>
  )
}
