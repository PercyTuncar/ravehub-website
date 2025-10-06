"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Facebook, Instagram, MapPin, MessageCircle, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Breadcrumbs } from "@/components/breadcrumbs"

const TiktokIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

const WhatsappIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
    <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
    <path d="M9.5 13.5c.5 1 1.5 1 2.5 1s2-.5 2.5-1" />
  </svg>
)

const whatsappGroups = [
  { country: "🇵🇪", name: "Perú", url: "https://linktr.ee/Grupo__WhatsApp" },
  { country: "🇨🇱", name: "Chile", url: "https://linktr.ee/Grupo__WhatsApp" },
  { country: "🇪🇨", name: "Ecuador", url: "https://linktr.ee/Grupo__WhatsApp" },
  { country: "🇲🇽", name: "Mexico", url: "https://linktr.ee/Grupo__WhatsApp" },
  { country: "🇵🇾", name: "Paraguay", url: "https://linktr.ee/Grupo__WhatsApp" },
  { country: "🇦🇷", name: "Argentina", url: "https://linktr.ee/Grupo__WhatsApp" },
]

const socialLinks = [
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@ravehub.pe",
    icon: <TiktokIcon className="h-6 w-6" />,
    color: "bg-black hover:bg-gray-800",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/ravehub.pe",
    icon: <Instagram className="h-6 w-6" />,
    color: "bg-gradient-to-r from-primary to-amber-600 hover:from-primary hover:to-amber-700",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/ravehub",
    icon: <Facebook className="h-6 w-6" />,
    color: "bg-secondary hover:bg-gray-700",
  },
]

const phoneNumbers = [
  { country: "🇵🇪", number: "+51944784488" },
  { country: "🇨🇱", number: "+56944324385" },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el mensaje")
      }

      toast({
        title: "Mensaje enviado",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      })

      setFormData({ name: "", email: "", message: "" })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al enviar tu mensaje. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-500">
          Contáctanos
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Estamos aquí para ayudarte. Conéctate con nosotros a través de cualquiera de estos canales o envíanos un
          mensaje directo.
        </p>
      </motion.div>

      <Breadcrumbs className="container mx-auto my-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Tu nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-background"
                    aria-label="Nombre"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Tu correo electrónico"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-background"
                    aria-label="Correo electrónico"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Tu mensaje"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="min-h-[150px] bg-background"
                    aria-label="Mensaje"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-amber-600 hover:from-primary hover:to-amber-700 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="mr-2 h-4 w-4" /> Enviar mensaje
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="social" className="h-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="social">Redes Sociales</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="direct">Contacto Directo</TabsTrigger>
            </TabsList>

            <TabsContent value="social" className="h-[calc(100%-48px)]">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-primary" />
                    Síguenos en redes sociales
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {socialLinks.map((social, index) => (
                      <motion.a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center p-4 rounded-lg text-white ${social.color} transition-transform duration-300 hover:scale-105`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ y: -5 }}
                      >
                        {social.icon}
                        <span className="ml-3 font-medium">{social.name}</span>
                        <span className="ml-auto">→</span>
                      </motion.a>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Encuéntranos</h3>
                    <div className="rounded-lg overflow-hidden h-[250px] border border-border">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.964216380948!2d-77.03196492394066!3d-12.046654888118095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c8b5d35662c7%3A0x15f8dcc0c8c4fb8c!2sLima%2C%20Peru!5e0!3m2!1sen!2sus!4v1714500000000!5m2!1sen!2sus"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                      <a
                        href="https://maps.app.goo.gl/2udSZAqNMEzvJPoe8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Ver en Google Maps
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="h-[calc(100%-48px)]">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <WhatsappIcon className="mr-2 h-5 w-5 text-green-500" />
                    Grupos de WhatsApp
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {whatsappGroups.map((group, index) => (
                      <motion.a
                        key={group.name}
                        href={group.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-all duration-300 border border-primary/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-2xl mr-2">{group.country}</span>
                        <span className="font-medium">{group.name}</span>
                        <span className="ml-auto">→</span>
                      </motion.a>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Contáctanos directamente</h3>
                    <div className="space-y-4">
                      {phoneNumbers.map((phone, index) => (
                        <motion.a
                          key={phone.number}
                          href={`https://wa.me/${phone.number.replace("+", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-4 rounded-lg border border-border hover:border-primary hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-300"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                        >
                          <span className="text-2xl mr-2">{phone.country}</span>
                          <span className="font-medium">{phone.number}</span>
                          <WhatsappIcon className="ml-auto h-5 w-5 text-green-500" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct" className="h-[calc(100%-48px)]">
              <Card className="h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    Contacto directo
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium mb-2">Teléfonos</h4>
                      <div className="space-y-3">
                        {phoneNumbers.map((phone, index) => (
                          <motion.a
                            key={phone.number}
                            href={`tel:${phone.number}`}
                            className="flex items-center p-3 rounded-lg border border-border hover:border-primary hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-300"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 * index }}
                          >
                            <span className="text-xl mr-2">{phone.country}</span>
                            <span className="font-medium">{phone.number}</span>
                            <Phone className="ml-auto h-4 w-4 text-primary" />
                          </motion.a>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-2">Horario de atención</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm">Lunes - Viernes:</div>
                          <div className="text-sm font-medium">9:00 AM - 6:00 PM</div>

                          <div className="text-sm">Sábados:</div>
                          <div className="text-sm font-medium">10:00 AM - 2:00 PM</div>

                          <div className="text-sm">Domingos:</div>
                          <div className="text-sm font-medium">Cerrado</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium mb-2">Correo electrónico</h4>
                      <motion.a
                        href="mailto:contacto@weareravehub.com"
                        className="flex items-center p-3 rounded-lg border border-border hover:border-primary hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all duration-300"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2 text-primary"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span className="font-medium">contacto@weareravehub.com</span>
                      </motion.a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Preguntas frecuentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              question: "¿Cómo puedo unirme a un evento?",
              answer:
                "Puedes comprar entradas para nuestros eventos directamente desde nuestra plataforma o contactarnos por WhatsApp.",
            },
            {
              question: "¿Ofrecen descuentos para grupos?",
              answer:
                "Sí, ofrecemos descuentos especiales para grupos de 5 o más personas. Contáctanos para más información.",
            },
            {
              question: "¿Cómo puedo colaborar con RaveHub?",
              answer:
                "Estamos abiertos a colaboraciones con artistas, promotores y marcas. Envíanos un mensaje con tu propuesta.",
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              className="bg-card border border-border rounded-lg p-6 text-left hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index + 0.5 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(255, 153, 0, 0.3)" }}
            >
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
