"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useCart } from "@/context/cart-context"
import { useCurrency } from "@/context/currency-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, AlertCircle, Loader2 } from "lucide-react"
import { offlinePaymentMethods } from "@/lib/constants"
import { createOrder, uploadPaymentProof } from "@/lib/firebase/orders"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import type { Order, OrderItem, Address } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { checkStockAvailability, updateStockAfterOrder } from "@/lib/firebase/stock"
import { OrderSummary } from "@/components/store/order-summary"

export function CheckoutForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, clearCart, subtotal, formattedSubtotal } = useCart()
  const { currency } = useCurrency()

  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">("offline")
  const [offlineMethod, setOfflineMethod] = useState<"yape" | "plin" | "transfer">("yape")
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Shipping information
  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: user?.country || "",
    phone: user?.phone || "",
    isDefault: true,
  })

  const [notes, setNotes] = useState("")

  // Shipping cost (could be calculated based on location, weight, etc.)
  const shippingCost = 10 // Fixed shipping cost for now
  const totalAmount = subtotal + shippingCost

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0])
    }
  }

  // Handle shipping address changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingAddress((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar una compra",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Tu carrito está vacío",
        variant: "destructive",
      })
      return
    }

    // Validate shipping address
    if (
      !shippingAddress.fullName ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country ||
      !shippingAddress.phone
    ) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos de la dirección de envío",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "offline" && !paymentProof) {
      toast({
        title: "Error",
        description: "Debes adjuntar un comprobante de pago",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Generate order ID
      const orderId = uuidv4()

      // Upload payment proof if provided
      let paymentProofUrl = ""
      if (paymentProof) {
        paymentProofUrl = await uploadPaymentProof(
          paymentProof,
          `payment-proofs/orders/${user.id}/${orderId}/${paymentProof.name}`,
        )
      }

      // Create order items
      const orderItems: OrderItem[] = items.map((item) => ({
        id: uuidv4(),
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        pricePerUnit: item.price,
        currency: item.currency,
        subtotal: item.price * item.quantity,
      }))

      // Justo antes de crear la orden
      // Check if all items are in stock
      const allItemsInStock = await checkStockAvailability(orderItems)
      if (!allItemsInStock) {
        toast({
          title: "Error",
          description:
            "Algunos productos ya no están disponibles en la cantidad solicitada. Por favor, revisa tu carrito.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create order object
      const order: Order = {
        id: orderId,
        userId: user.id,
        orderDate: new Date(),
        totalAmount,
        currency,
        status: "pending",
        paymentMethod,
        offlinePaymentMethod: offlineMethod,
        paymentProofUrl,
        paymentStatus: "pending",
        shippingAddress,
        shippingCost,
        notes,
        orderItems,
      }

      // Save order to Firestore
      await createOrder(order)

      // Después de crear la orden exitosamente, añadir:
      // Update stock quantities
      await updateStockAfterOrder(orderItems)

      toast({
        title: "¡Pedido realizado!",
        description: "Tu pedido ha sido enviado y está pendiente de aprobación.",
      })

      // Clear cart and redirect to orders page
      clearCart()
      router.push("/perfil/compras")
    } catch (error) {
      console.error("Error submitting order:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu pedido. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No has iniciado sesión</AlertTitle>
        <AlertDescription>
          Debes iniciar sesión para realizar una compra.{" "}
          <Button variant="link" className="p-0" onClick={() => router.push("/login?redirect=/tienda/checkout")}>
            Iniciar sesión
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Carrito vacío</AlertTitle>
        <AlertDescription>
          Tu carrito está vacío. Agrega productos antes de proceder al pago.{" "}
          <Button variant="link" className="p-0" onClick={() => router.push("/tienda")}>
            Ver productos
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de envío</CardTitle>
            <CardDescription>Ingresa la dirección donde quieres recibir tu pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={shippingAddress.fullName}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" value={shippingAddress.phone} onChange={handleAddressChange} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Dirección</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={shippingAddress.addressLine1}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Apartamento, suite, etc. (opcional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={shippingAddress.addressLine2}
                onChange={handleAddressChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" value={shippingAddress.city} onChange={handleAddressChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado/Provincia</Label>
                <Input id="state" name="state" value={shippingAddress.state} onChange={handleAddressChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Código postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                name="country"
                value={shippingAddress.country}
                onChange={handleAddressChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones especiales para la entrega, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Método de pago</CardTitle>
            <CardDescription>Selecciona cómo quieres pagar tu pedido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="offline" onValueChange={(value) => setPaymentMethod(value as "online" | "offline")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="offline">Pago offline</TabsTrigger>
                <TabsTrigger value="online" disabled>
                  Pago online (próximamente)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="offline" className="mt-4">
                <div className="space-y-4">
                  <RadioGroup
                    value={offlineMethod}
                    onValueChange={(value) => setOfflineMethod(value as "yape" | "plin" | "transfer")}
                  >
                    {offlinePaymentMethods.map((method) => (
                      <div key={method.code} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.code} id={method.code} />
                        <Label htmlFor={method.code} className="flex items-center">
                          <span className="mr-2">{method.icon}</span>
                          {method.name}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="bg-muted p-3 rounded-md text-sm">
                    {offlineMethod === "yape" && (
                      <div>
                        <p className="font-medium">Instrucciones para Yape:</p>
                        <p>1. Abre tu aplicación Yape</p>
                        <p>2. Envía el pago al número: +51 987 654 321</p>
                        <p>3. Adjunta el comprobante de pago a continuación</p>
                      </div>
                    )}

                    {offlineMethod === "plin" && (
                      <div>
                        <p className="font-medium">Instrucciones para Plin:</p>
                        <p>1. Abre tu aplicación Plin</p>
                        <p>2. Envía el pago al número: +51 987 654 321</p>
                        <p>3. Adjunta el comprobante de pago a continuación</p>
                      </div>
                    )}

                    {offlineMethod === "transfer" && (
                      <div>
                        <p className="font-medium">Instrucciones para transferencia bancaria:</p>
                        <p>Banco: Interbank</p>
                        <p>Cuenta: 123-456-789</p>
                        <p>Titular: Ravehub S.A.C.</p>
                        <p>
                          Concepto: Orden - {user?.firstName} {user?.lastName}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payment-proof">Comprobante de pago</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="payment-proof"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon" type="button">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Adjunta una captura de pantalla o foto de tu comprobante de pago
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="online">
                <div className="py-8 text-center text-muted-foreground">
                  <p>El pago online estará disponible próximamente.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="sticky top-6 space-y-4">
          <OrderSummary shippingCost={shippingCost} />

          <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Confirmar pedido"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
