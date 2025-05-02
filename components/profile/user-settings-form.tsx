"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useCurrency } from "@/context/currency-context"
import { updateUserProfile, getUserById } from "@/lib/firebase/users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"

export default function UserSettingsForm() {
  const { user } = useAuth()
  const { currencies, activeCurrency, setActiveCurrency } = useCurrency()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    preferredCurrency: activeCurrency || "USD",
    emailNotifications: true,
    eventReminders: true,
    marketingEmails: false,
    orderUpdates: true,
    showProfilePublicly: false,
  })

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user?.uid) return

      setLoading(true)
      try {
        const userData = await getUserById(user.uid)
        if (userData) {
          setSettings({
            preferredCurrency: userData.preferredCurrency || activeCurrency || "USD",
            emailNotifications: userData.emailNotifications !== false,
            eventReminders: userData.eventReminders !== false,
            marketingEmails: userData.marketingEmails === true,
            orderUpdates: userData.orderUpdates !== false,
            showProfilePublicly: userData.showProfilePublicly === true,
          })
        }
      } catch (error) {
        console.error("Error al cargar ajustes:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar tus ajustes. Intenta de nuevo más tarde.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadUserSettings()
  }, [user, activeCurrency])

  const handleSaveSettings = async () => {
    if (!user?.uid) return

    setSaving(true)
    try {
      // Actualizar la moneda en el contexto si ha cambiado
      if (settings.preferredCurrency !== activeCurrency) {
        setActiveCurrency(settings.preferredCurrency)
      }

      // Guardar todos los ajustes en Firebase
      await updateUserProfile(user.uid, {
        preferredCurrency: settings.preferredCurrency,
        emailNotifications: settings.emailNotifications,
        eventReminders: settings.eventReminders,
        marketingEmails: settings.marketingEmails,
        orderUpdates: settings.orderUpdates,
        showProfilePublicly: settings.showProfilePublicly,
      })

      toast({
        title: "Ajustes guardados",
        description: "Tus preferencias han sido actualizadas correctamente.",
      })
    } catch (error) {
      console.error("Error al guardar ajustes:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar tus ajustes. Intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando tus preferencias...</span>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Preferencias de Usuario</CardTitle>
        <CardDescription>Personaliza tu experiencia en RaveHub ajustando tus preferencias</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="privacy">Privacidad</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda preferida</Label>
              <Select
                value={settings.preferredCurrency}
                onValueChange={(value) => setSettings({ ...settings, preferredCurrency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Selecciona tu moneda preferida" />
                </SelectTrigger>
                <SelectContent>
                  {currencies && currencies.length > 0 ? (
                    currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="USD">USD - Dólar estadounidense</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Esta será la moneda predeterminada para mostrar precios en todo el sitio.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones importantes por correo electrónico
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Recordatorios de eventos</Label>
                  <p className="text-sm text-muted-foreground">Recibe recordatorios sobre eventos próximos</p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={settings.eventReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, eventReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Emails promocionales</Label>
                  <p className="text-sm text-muted-foreground">Recibe ofertas especiales y novedades</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => setSettings({ ...settings, marketingEmails: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="order-updates">Actualizaciones de pedidos</Label>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones sobre el estado de tus compras</p>
                </div>
                <Switch
                  id="order-updates"
                  checked={settings.orderUpdates}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderUpdates: checked })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility">Perfil público</Label>
                <p className="text-sm text-muted-foreground">Permite que otros usuarios vean tu perfil</p>
              </div>
              <Switch
                id="profile-visibility"
                checked={settings.showProfilePublicly}
                onCheckedChange={(checked) => setSettings({ ...settings, showProfilePublicly: checked })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} disabled={saving} className="ml-auto">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
