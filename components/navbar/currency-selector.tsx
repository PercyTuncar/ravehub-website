"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/currency-context"
import { currencies } from "@/lib/constants"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currency)

  // Actualizar el estado local cuando cambia la moneda en el contexto
  useEffect(() => {
    setSelectedCurrency(currency)
  }, [currency])

  // Función para manejar el cambio de moneda
  const handleCurrencyChange = (value: string) => {
    console.log(`Cambiando moneda a: ${value}`)
    setCurrency(value)
    setSelectedCurrency(value)
    setOpen(false)

    // Forzar una actualización de la UI
    window.dispatchEvent(new CustomEvent("currency-changed", { detail: value }))
  }

  // Obtener la bandera para la moneda seleccionada
  const getFlag = (code: string) => {
    const currency = currencies.find((c) => c.code === code)
    return currency?.flag || ""
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[120px] justify-between">
          <span className="flex items-center">
            <span className="mr-2">{getFlag(selectedCurrency)}</span>
            {selectedCurrency}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar moneda..." />
          <CommandList>
            <CommandEmpty>No se encontró la moneda.</CommandEmpty>
            <CommandGroup>
              {currencies.map((c) => (
                <CommandItem key={c.code} value={c.code} onSelect={handleCurrencyChange}>
                  <Check className={cn("mr-2 h-4 w-4", selectedCurrency === c.code ? "opacity-100" : "opacity-0")} />
                  <span className="mr-2">{c.flag}</span>
                  {c.code} - {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
