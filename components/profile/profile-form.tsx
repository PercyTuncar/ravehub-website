"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type UserData, updateUserProfile, uploadProfileImage } from "@/lib/firebase/users"
import { Loader2, Upload, Eye, EyeOff, Mail, AlertCircle } from "lucide-react"
import Cropper from "react-easy-crop"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FcGoogle } from "react-icons/fc"
import { linkGoogleAccount, setPasswordForGoogleUser } from "@/lib/firebase/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Añadir esquema de validación para el formulario de cambio de contraseña
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6, {
      message: "La contraseña actual debe tener al menos 6 caracteres",
    }),
    newPassword: z.string().min(8, {
      message: "La nueva contraseña debe tener al menos 8 caracteres",
    }),
    confirmPassword: z.string().min(8, {
      message: "La confirmación de contraseña debe tener al menos 8 caracteres",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>

// Esquema de validación para el formulario de perfil
const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, {
      message: "El nombre debe tener al menos 2 caracteres",
    })
    .max(50, {
      message: "El nombre no puede tener más de 50 caracteres",
    }),
  lastName: z
    .string()
    .min(2, {
      message: "El apellido debe tener al menos 2 caracteres",
    })
    .max(50, {
      message: "El apellido no puede tener más de 50 caracteres",
    }),
  documentType: z.string(),
  documentNumber: z
    .string()
    .min(5, {
      message: "El número de documento debe tener al menos 5 caracteres",
    })
    .max(20, {
      message: "El número de documento no puede tener más de 20 caracteres",
    }),
  country: z.string(),
  phonePrefix: z.string(),
  phone: z.string().regex(/^[0-9]{6,15}$/, {
    message: "Ingresa un número de teléfono válido (solo números)",
  }),
  preferredCurrency: z.string(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData: UserData
  userEmail: string
}

// Añadir nuevos estados para el formulario de cambio de contraseña y visibilidad de contraseñas
export default function ProfileForm({ initialData, userEmail }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [photoURL, setPhotoURL] = useState<string | null>(initialData.photoURL || null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData.photoURL || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  // Nuevos estados para el cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Formulario para cambio de contraseña
  const passwordForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Configurar el formulario con los valores iniciales
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      documentType: initialData.documentType || "DNI",
      documentNumber: initialData.documentNumber || "",
      country: initialData.country || "PE",
      phonePrefix: initialData.phonePrefix || "+51",
      phone: initialData.phone || "",
      preferredCurrency: initialData.preferredCurrency || "PEN",
    },
  })

  // Manejar la selección de archivo de imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor, selecciona una imagen válida",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      })
      return
    }

    setPhotoFile(file)

    // Crear URL para el cropper
    const reader = new FileReader()
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string)
      setIsCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  // Función para manejar el completado del recorte
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  // Función para crear la imagen recortada
  const createCroppedImage = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return null

      const image = new Image()
      image.src = imageSrc

      // Esperar a que la imagen se cargue
      await new Promise((resolve) => {
        image.onload = resolve
      })

      // Crear un canvas con las dimensiones del área recortada
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) return null

      // Establecer el tamaño del canvas al tamaño del recorte
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      // Dibujar la imagen recortada en el canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      )

      // Convertir el canvas a un Blob
      return new Promise<File>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob || !photoFile) return

          // Crear un nuevo archivo a partir del blob
          const croppedFile = new File([blob], photoFile.name, {
            type: photoFile.type,
            lastModified: Date.now(),
          })

          resolve(croppedFile)
        }, photoFile?.type)
      })
    } catch (error) {
      // Error manejado en UI
      return null
    }
  }

  // Función para aplicar el recorte
  const applyCrop = async () => {
    const croppedFile = await createCroppedImage()

    if (croppedFile) {
      setPhotoFile(croppedFile)

      // Crear URL para previsualización
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(croppedFile)
    }

    setIsCropperOpen(false)
  }

  // Manejar clic en el avatar para abrir selector de archivos
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Enviar el formulario
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true)

      // Si hay una nueva foto, subirla primero
      let newPhotoURL = photoURL
      if (photoFile && initialData.id) {
        const uploadedURL = await uploadProfileImage(initialData.id, photoFile)
        if (!uploadedURL) {
          toast({
            title: "Error",
            description: "Error al subir la imagen de perfil",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        newPhotoURL = uploadedURL
      }

      // Preparar datos para actualizar
      const updateData: Partial<UserData> = {
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        country: data.country,
        phonePrefix: data.phonePrefix,
        phone: data.phone,
        preferredCurrency: data.preferredCurrency,
      }

      // Solo incluir photoURL si no es undefined
      if (newPhotoURL !== undefined) {
        updateData.photoURL = newPhotoURL
      }

      // Actualizar perfil
      if (initialData.id) {
        const success = await updateUserProfile(initialData.id, updateData)

        if (success) {
          toast({
            title: "Éxito",
            description: "Perfil actualizado correctamente",
          })
          router.refresh() // Actualizar la página para mostrar los cambios
        } else {
          toast({
            title: "Error",
            description: "Error al actualizar el perfil",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Error manejado en UI
      toast({
        title: "Error",
        description: "Error al actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkGoogle = async () => {
    try {
      setIsLoading(true)
      await linkGoogleAccount()
      toast({
        title: "Cuenta vinculada",
        description: "Tu cuenta de Google ha sido vinculada correctamente",
      })
    } catch (error) {
      console.error("Error al vincular cuenta de Google:", error)
      toast({
        title: "Error",
        description: "No se pudo vincular la cuenta de Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    // Validar fortaleza de la contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/

    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "La contraseña debe tener mínimo 8 caracteres, incluyendo al menos una letra minúscula, una letra mayúscula, un número y un símbolo.",
      )
      return
    }

    try {
      setIsLoading(true)
      setPasswordError(null)
      await setPasswordForGoogleUser(newPassword)
      setShowPasswordModal(false)
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Contraseña establecida",
        description: "Tu contraseña ha sido establecida correctamente",
      })
    } catch (error) {
      console.error("Error al establecer contraseña:", error)
      setPasswordError("No se pudo establecer la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  // Añadir función para manejar el cambio de contraseña
  // Añadir después de la función onSubmit existente

  // Función para cambiar la contraseña
  const onChangePassword = async (data: PasswordChangeValues) => {
    try {
      setIsChangingPassword(true)

      const user = auth.currentUser
      if (!user || !user.email) {
        toast({
          title: "Error",
          description: "No se pudo identificar al usuario actual",
          variant: "destructive",
        })
        return
      }

      // Reautenticar al usuario antes de cambiar la contraseña
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword)

      try {
        await reauthenticateWithCredential(user, credential)
      } catch (error) {
        // Error manejado en UI
        toast({
          title: "Error",
          description: "La contraseña actual es incorrecta",
          variant: "destructive",
        })
        return
      }

      // Cambiar la contraseña
      await updatePassword(user, data.newPassword)

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })

      // Limpiar el formulario
      passwordForm.reset()
    } catch (error) {
      // Error manejado en UI
      toast({
        title: "Error",
        description: "Error al actualizar la contraseña. Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Obtener las iniciales para el avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return "US"

    const firstInitial = firstName ? firstName.charAt(0) : ""
    const lastInitial = lastName ? lastName.charAt(0) : ""

    return (firstInitial + lastInitial).toUpperCase()
  }

  // Modificar el componente de Tabs para añadir una nueva pestaña de Seguridad
  // Reemplazar el componente Tabs existente con este:

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="documents">Documentos e Identidad</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        {/* Pestaña de información personal - mantener igual */}
        <TabsContent value="personal">
          {/* Contenido existente */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu información personal y foto de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
                  <Avatar className="h-24 w-24 overflow-hidden">
                    <AvatarImage
                      src={photoPreview || undefined}
                      alt={`${form.getValues("firstName")} ${form.getValues("lastName")}`}
                      className="object-cover"
                      style={{ width: "100%", height: "100%", objectPosition: "center" }}
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(form.getValues("firstName"), form.getValues("lastName"))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button type="button" variant="outline" size="sm" onClick={handleAvatarClick}>
                  Cambiar foto
                </Button>
              </div>

              {/* Email (no editable) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={userEmail} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" {...form.register("firstName")} placeholder="Tu nombre" />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              {/* Apellido */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" {...form.register("lastName")} placeholder="Tu apellido" />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="flex gap-2">
                  <div className="w-24">
                    <Select
                      defaultValue={form.getValues("phonePrefix")}
                      onValueChange={(value) => form.setValue("phonePrefix", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Prefijo" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Lista de países de Latinoamérica y Estados Unidos con códigos de marcación */}
                        <SelectItem value="+54">+54 (AR)</SelectItem> {/* Argentina */}
                        <SelectItem value="+591">+591 (BO)</SelectItem> {/* Bolivia */}
                        <SelectItem value="+55">+55 (BR)</SelectItem> {/* Brasil */}
                        <SelectItem value="+56">+56 (CL)</SelectItem> {/* Chile */}
                        <SelectItem value="+57">+57 (CO)</SelectItem> {/* Colombia */}
                        <SelectItem value="+506">+506 (CR)</SelectItem> {/* Costa Rica */}
                        <SelectItem value="+53">+53 (CU)</SelectItem> {/* Cuba */}
                        <SelectItem value="+1">+1 (DO)</SelectItem>{" "}
                        {/* República Dominicana (mismo código que EE.UU.) */}
                        <SelectItem value="+593">+593 (EC)</SelectItem> {/* Ecuador */}
                        <SelectItem value="+502">+502 (GT)</SelectItem> {/* Guatemala */}
                        <SelectItem value="+504">+504 (HN)</SelectItem> {/* Honduras */}
                        <SelectItem value="+52">+52 (MX)</SelectItem> {/* México */}
                        <SelectItem value="+505">+505 (NI)</SelectItem> {/* Nicaragua */}
                        <SelectItem value="+507">+507 (PA)</SelectItem> {/* Panamá */}
                        <SelectItem value="+595">+595 (PY)</SelectItem> {/* Paraguay */}
                        <SelectItem value="+51">+51 (PE)</SelectItem> {/* Perú */}
                        <SelectItem value="+503">+503 (SV)</SelectItem> {/* El Salvador */}
                        <SelectItem value="+598">+598 (UY)</SelectItem> {/* Uruguay */}
                        <SelectItem value="+58">+58 (VE)</SelectItem> {/* Venezuela */}
                        <SelectItem value="+1">+1 (US)</SelectItem> {/* Estados Unidos */}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input id="phone" {...form.register("phone")} placeholder="987654321" />
                  </div>
                </div>
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* País */}
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  defaultValue={form.getValues("country")}
                  onValueChange={(value) => form.setValue("country", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AR">Argentina</SelectItem>
                    <SelectItem value="BO">Bolivia</SelectItem>
                    <SelectItem value="BR">Brasil</SelectItem>
                    <SelectItem value="CL">Chile</SelectItem>
                    <SelectItem value="CO">Colombia</SelectItem>
                    <SelectItem value="CR">Costa Rica</SelectItem>
                    <SelectItem value="CU">Cuba</SelectItem>
                    <SelectItem value="DO">República Dominicana</SelectItem>
                    <SelectItem value="EC">Ecuador</SelectItem>
                    <SelectItem value="GT">Guatemala</SelectItem>
                    <SelectItem value="HN">Honduras</SelectItem>
                    <SelectItem value="MX">México</SelectItem>
                    <SelectItem value="NI">Nicaragua</SelectItem>
                    <SelectItem value="PA">Panamá</SelectItem>
                    <SelectItem value="PY">Paraguay</SelectItem>
                    <SelectItem value="PE">Perú</SelectItem>
                    <SelectItem value="SV">El Salvador</SelectItem>
                    <SelectItem value="UY">Uruguay</SelectItem>
                    <SelectItem value="VE">Venezuela</SelectItem>
                    <SelectItem value="USD">Internacional (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda preferida */}
              <div className="space-y-2">
                <Label htmlFor="preferredCurrency">Moneda preferida</Label>
                <Select
                  defaultValue={form.getValues("preferredCurrency")}
                  onValueChange={(value) => form.setValue("preferredCurrency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS $)</SelectItem>
                    <SelectItem value="BOB">Boliviano (BOB Bs.)</SelectItem>
                    <SelectItem value="BRL">Real Brasileño (BRL R$)</SelectItem>
                    <SelectItem value="CLP">Peso Chileno (CLP $)</SelectItem>
                    <SelectItem value="COP">Peso Colombiano (COP $)</SelectItem>
                    <SelectItem value="CRC">Colón Costarricense (CRC ₡)</SelectItem>
                    <SelectItem value="CUP">Peso Cubano (CUP $)</SelectItem>
                    <SelectItem value="DOP">Peso Dominicano (DOP RD$)</SelectItem>
                    <SelectItem value="GTQ">Quetzal Guatemalteco (GTQ Q)</SelectItem>
                    <SelectItem value="HNL">Lempira Hondureño (HNL L)</SelectItem>
                    <SelectItem value="MXN">Peso Mexicano (MXN $)</SelectItem>
                    <SelectItem value="NIO">Córdoba Nicaragüense (NIO C$)</SelectItem>
                    <SelectItem value="PAB">Balboa Panameño (PAB B/.)</SelectItem>
                    <SelectItem value="PEN">Sol Peruano (PEN S/)</SelectItem>
                    <SelectItem value="PYG">Guaraní Paraguayo (PYG ₲)</SelectItem>
                    <SelectItem value="UYU">Peso Uruguayo (UYU $)</SelectItem>
                    <SelectItem value="VES">Bolívar Venezolano (VES Bs.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de documentos e identidad - mantener igual */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documentos e Identidad</CardTitle>
              <CardDescription>Gestiona tus documentos de identidad y verificación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de documento */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de documento</Label>
                <Select
                  defaultValue={form.getValues("documentType")}
                  onValueChange={(value) => form.setValue("documentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Número de documento */}
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número de documento</Label>
                <Input
                  id="documentNumber"
                  {...form.register("documentNumber")}
                  placeholder="Ingresa el número de tu documento"
                />
                {form.formState.errors.documentNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.documentNumber.message}</p>
                )}
              </div>

              {/* Información adicional sobre verificación */}
              <div className="rounded-md bg-blue-50 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      La información de tu documento es importante para verificar tu identidad y brindarte una
                      experiencia segura.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nueva pestaña de seguridad */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la cuenta</CardTitle>
              <CardDescription>Actualiza tu contraseña y configura opciones de seguridad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Contraseña actual */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      {...passwordForm.register("currentPassword")}
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">
                        {showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      </span>
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                {/* Nueva contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      {...passwordForm.register("newPassword")}
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">{showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                    </Button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres</p>
                </div>

                {/* Confirmar nueva contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...passwordForm.register("confirmPassword")}
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span className="sr-only">
                        {showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      </span>
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Información de seguridad */}
                <div className="rounded-md bg-amber-50 p-4 mt-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-amber-700">
                        Por seguridad, tu nueva contraseña debe ser diferente a la actual y tener al menos 8 caracteres.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de cambiar contraseña */}
                <Button
                  type="button"
                  className="w-full"
                  disabled={isChangingPassword}
                  onClick={passwordForm.handleSubmit(onChangePassword)}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando contraseña...
                    </>
                  ) : (
                    "Cambiar contraseña"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-medium mb-4">Métodos de inicio de sesión</h3>

        {/* Mostrar los métodos de inicio de sesión actuales */}
        <div className="space-y-4">
          {/* Email/Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>Email y contraseña</span>
            </div>
            {auth.currentUser?.providerData.some((provider) => provider.providerId === "password") ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Activo
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                Establecer contraseña
              </Button>
            )}
          </div>

          {/* Google */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FcGoogle className="h-5 w-5" />
              <span>Google</span>
            </div>
            {auth.currentUser?.providerData.some((provider) => provider.providerId === "google.com") ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Activo
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLinkGoogle} disabled={isLoading}>
                Vincular Google
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción para el formulario principal */}
      <div className="mt-6 flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
      {/* Diálogo de recorte de imagen */}
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recortar imagen de perfil</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-80 mt-4">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="mt-4 px-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Zoom</span>
              <span className="text-sm">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="w-full"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsCropperOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyCrop}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal para establecer contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Establecer contraseña</h3>
            <p className="mb-4">Establece una contraseña para poder iniciar sesión con tu email y contraseña.</p>
            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSetPassword}
                  disabled={!newPassword || !confirmPassword || isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Procesando..." : "Guardar contraseña"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setNewPassword("")
                    setConfirmPassword("")
                    setPasswordError(null)
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
