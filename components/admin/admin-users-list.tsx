"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Edit, Trash, Eye, Lock, Unlock, Save } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { getDocs, collection, query, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { UserData } from "@/lib/firebase/users"
import { toast } from "@/components/ui/use-toast"
import { lockAccount, unlockAccount, getLockedAccounts } from "@/lib/firebase/account-locks"

export function AdminUsersList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [users, setUsers] = useState<UserData[]>([])
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLocking, setIsLocking] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userToLock, setUserToLock] = useState<string | null>(null)
  const [userToUnlock, setUserToUnlock] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false)
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [lockReason, setLockReason] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedUser, setEditedUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Reemplazar la función formatDate con una versión mejorada
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    try {
      // Manejar diferentes tipos de timestamp de Firestore
      let date

      // Si es un objeto Timestamp de Firestore con método toDate()
      if (timestamp && typeof timestamp.toDate === "function") {
        date = timestamp.toDate()
      }
      // Si es un objeto Date
      else if (timestamp instanceof Date) {
        date = timestamp
      }
      // Si es un string ISO o timestamp en milisegundos
      else if (typeof timestamp === "string" || typeof timestamp === "number") {
        date = new Date(timestamp)
      }
      // Si es un objeto con seconds y nanoseconds (formato raw de Firestore)
      else if (timestamp && timestamp.seconds !== undefined) {
        date = new Date(timestamp.seconds * 1000)
      } else {
        console.error("Formato de timestamp no reconocido:", timestamp)
        return "Formato inválido"
      }

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error("Fecha inválida:", timestamp)
        return "Fecha inválida"
      }

      // Formatear la fecha con Intl.DateTimeFormat para mayor consistencia
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Santiago", // Usar zona horaria de Chile por defecto
      }).format(date)
    } catch (error) {
      console.error("Error al formatear fecha:", error, "Timestamp original:", timestamp)
      return "Error en formato"
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // Asegurarse de que estamos obteniendo todos los campos necesarios
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(usersQuery)

        const usersData = querySnapshot.docs.map((doc) => {
          const data = doc.data()

          // Log para depuración - solo del primer usuario
          if (querySnapshot.docs.indexOf(doc) === 0) {
            console.log("Datos de usuario (muestra):", {
              id: doc.id,
              lastLoginAt: data.lastLoginAt,
              lastLogin: data.lastLogin,
              lastLoginDevice: data.lastLoginDevice,
            })
          }

          return {
            id: doc.id,
            ...data,
            // Usar cualquiera de los dos campos de timestamp que esté disponible
            lastLoginAt: data.lastLoginAt || data.lastLogin || null,
            lastLogin: data.lastLogin || data.lastLoginAt || null,
          }
        })

        setUsers(usersData)
        console.log("Users data fetched:", usersData[0]) // Log para depuración
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar los usuarios",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchLockedAccounts = async () => {
      try {
        const lockedAccountsData = await getLockedAccounts()
        setLockedAccounts(lockedAccountsData)
      } catch (error) {
        console.error("Error fetching locked accounts:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar las cuentas bloqueadas",
          variant: "destructive",
        })
      }
    }

    fetchUsers()
    fetchLockedAccounts()
  }, [])

  // Filter users based on search term and role
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.documentNumber && user.documentNumber.includes(searchTerm))

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleLockAccount = (userId: string) => {
    setUserToLock(userId)
    setIsLockDialogOpen(true)
  }

  const handleUnlockAccount = (userId: string) => {
    setUserToUnlock(userId)
    setIsUnlockDialogOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    setIsDeleteDialogOpen(true)
  }

  const handleViewUser = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId)
      if (user) {
        setSelectedUser(user)
        setIsViewDialogOpen(true)
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del usuario",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user) {
      setEditedUser({ ...user })
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveUser = async () => {
    if (!editedUser) return

    try {
      setIsSaving(true)
      const userRef = doc(db, "users", editedUser.id)

      // Update the updatedAt timestamp
      const updatedUser = {
        ...editedUser,
        updatedAt: Timestamp.now(),
      }

      // Remove id from the object before saving to Firestore
      const { id, ...userDataToSave } = updatedUser

      await updateDoc(userRef, userDataToSave)

      // Update the user in the local state
      setUsers(users.map((user) => (user.id === editedUser.id ? updatedUser : user)))

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido actualizados exitosamente",
      })

      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const confirmLockAccount = async () => {
    if (!userToLock || !lockReason) return

    try {
      setIsLocking(true)
      // Get the admin user ID from the current user
      const adminId = "currentAdminId" // Replace with actual admin ID
      const success = await lockAccount(userToLock, lockReason, adminId)

      if (success) {
        // Update the local state to reflect the locked account
        setUsers(
          users.map((user) => {
            if (user.id === userToLock) {
              return { ...user, isActive: false }
            }
            return user
          }),
        )

        toast({
          title: "Cuenta bloqueada",
          description: "La cuenta ha sido bloqueada exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo bloquear la cuenta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error locking account:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al bloquear la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsLocking(false)
      setIsLockDialogOpen(false)
      setUserToLock(null)
      setLockReason("")
    }
  }

  const confirmUnlockAccount = async () => {
    if (!userToUnlock) return

    try {
      setIsUnlocking(true)
      const success = await unlockAccount(userToUnlock)

      if (success) {
        // Update the local state to reflect the unlocked account
        setUsers(
          users.map((user) => {
            if (user.id === userToUnlock) {
              return { ...user, isActive: true }
            }
            return user
          }),
        )

        toast({
          title: "Cuenta desbloqueada",
          description: "La cuenta ha sido desbloqueada exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo desbloquear la cuenta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unlocking account:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al desbloquear la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsUnlocking(false)
      setIsUnlockDialogOpen(false)
      setUserToUnlock(null)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      await deleteDoc(doc(db, "users", userToDelete))
      setUsers(users.filter((user) => user.id !== userToDelete))
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (checked: boolean, name: string) => {
    setEditedUser((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de usuarios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="user">Usuarios</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || ""} alt={`${user.firstName} ${user.lastName}`} />
                            <AvatarFallback>
                              {user.firstName?.charAt(0)}
                              {user.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.documentType} {user.documentNumber}
                      </TableCell>
                      <TableCell>{user.country}</TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="outline">Usuario</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="success" className="bg-green-500">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </TableCell>
                      {/* Modificar la celda de último acceso para mostrar información más detallada */}
                      <TableCell>
                        {user.lastLoginAt || user.lastLogin ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDate(user.lastLoginAt || user.lastLogin)}</span>
                            {user.lastLoginDevice && (
                              <span className="text-xs text-muted-foreground mt-1">{user.lastLoginDevice}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca ha iniciado sesión</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleViewUser(user.id)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleEditUser(user.id)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          {user.isActive ? (
                            <Button variant="outline" size="icon" onClick={() => handleLockAccount(user.id)}>
                              <Lock className="h-4 w-4" />
                              <span className="sr-only">Bloquear</span>
                            </Button>
                          ) : (
                            <Button variant="outline" size="icon" onClick={() => handleUnlockAccount(user.id)}>
                              <Unlock className="h-4 w-4" />
                              <span className="sr-only">Desbloquear</span>
                            </Button>
                          )}
                          <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} de{" "}
                {filteredUsers.length} usuarios
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>Información completa del usuario</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="account">Cuenta</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={selectedUser.photoURL || ""}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.firstName?.charAt(0)}
                      {selectedUser.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedUser.role === "admin" ? "default" : "outline"}>
                        {selectedUser.role === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                      <Badge
                        variant={selectedUser.isActive ? "success" : "destructive"}
                        className={selectedUser.isActive ? "bg-green-500" : ""}
                      >
                        {selectedUser.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <div className="p-2 border rounded-md">{selectedUser.firstName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <div className="p-2 border rounded-md">{selectedUser.lastName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <div className="p-2 border rounded-md">{selectedUser.documentType || "No especificado"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Número de Documento</Label>
                    <div className="p-2 border rounded-md">{selectedUser.documentNumber || "No especificado"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>País</Label>
                    <div className="p-2 border rounded-md">{selectedUser.country || "No especificado"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda Preferida</Label>
                    <div className="p-2 border rounded-md">{selectedUser.preferredCurrency || "No especificada"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prefijo Telefónico</Label>
                    <div className="p-2 border rounded-md">{selectedUser.phonePrefix || "No especificado"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <div className="p-2 border rounded-md">{selectedUser.phone || "No especificado"}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-2 border rounded-md">{selectedUser.email}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="p-2 border rounded-md">
                      {selectedUser.role === "admin" ? "Administrador" : "Usuario"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="p-2 border rounded-md">{selectedUser.isActive ? "Activo" : "Inactivo"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Intentos de inicio de sesión fallidos</Label>
                    <div className="p-2 border rounded-md">{selectedUser.failedLoginAttempts || 0}</div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>URL de la foto de perfil</Label>
                    <div className="p-2 border rounded-md break-all">{selectedUser.photoURL || "No tiene"}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de creación</Label>
                    <div className="p-2 border rounded-md">{formatDate(selectedUser.createdAt)}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Última actualización</Label>
                    <div className="p-2 border rounded-md">{formatDate(selectedUser.updatedAt)}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Último inicio de sesión</Label>
                    <div className="p-2 border rounded-md">
                      {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : "Nunca"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Último intento fallido</Label>
                    <div className="p-2 border rounded-md">
                      {selectedUser.lastFailedLoginAttempt
                        ? formatDate(selectedUser.lastFailedLoginAttempt)
                        : "Ninguno"}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedUser) handleEditUser(selectedUser.id)
              }}
            >
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica la información del usuario</DialogDescription>
          </DialogHeader>

          {editedUser && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="account">Cuenta</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={editedUser.photoURL || ""}
                      alt={`${editedUser.firstName} ${editedUser.lastName}`}
                    />
                    <AvatarFallback>
                      {editedUser.firstName?.charAt(0)}
                      {editedUser.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      placeholder="URL de la foto de perfil"
                      name="photoURL"
                      value={editedUser.photoURL || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={editedUser.firstName || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={editedUser.lastName || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Select
                      value={editedUser.documentType || ""}
                      onValueChange={(value) => setEditedUser({ ...editedUser, documentType: value })}
                    >
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Cédula">Cédula</SelectItem>
                        <SelectItem value="RUT">RUT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número de Documento</Label>
                    <Input
                      id="documentNumber"
                      name="documentNumber"
                      value={editedUser.documentNumber || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Select
                      value={editedUser.country || ""}
                      onValueChange={(value) => setEditedUser({ ...editedUser, country: value })}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PE">Perú</SelectItem>
                        <SelectItem value="CL">Chile</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="ES">España</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredCurrency">Moneda Preferida</Label>
                    <Select
                      value={editedUser.preferredCurrency || ""}
                      onValueChange={(value) => setEditedUser({ ...editedUser, preferredCurrency: value })}
                    >
                      <SelectTrigger id="preferredCurrency">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN">Sol Peruano (PEN)</SelectItem>
                        <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phonePrefix">Prefijo Telefónico</Label>
                    <Select
                      value={editedUser.phonePrefix || ""}
                      onValueChange={(value) => setEditedUser({ ...editedUser, phonePrefix: value })}
                    >
                      <SelectTrigger id="phonePrefix">
                        <SelectValue placeholder="Seleccionar prefijo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+51">+51 (Perú)</SelectItem>
                        <SelectItem value="+56">+56 (Chile)</SelectItem>
                        <SelectItem value="+54">+54 (Argentina)</SelectItem>
                        <SelectItem value="+57">+57 (Colombia)</SelectItem>
                        <SelectItem value="+52">+52 (México)</SelectItem>
                        <SelectItem value="+34">+34 (España)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" value={editedUser.phone || ""} onChange={handleInputChange} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={editedUser.email || ""} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={editedUser.role || "user"}
                      onValueChange={(value) => setEditedUser({ ...editedUser, role: value })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Label htmlFor="isActive">Estado activo</Label>
                    <Switch
                      id="isActive"
                      checked={editedUser.isActive}
                      onCheckedChange={(checked) => handleSwitchChange(checked, "isActive")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="failedLoginAttempts">Intentos de inicio de sesión fallidos</Label>
                    <Input
                      id="failedLoginAttempts"
                      name="failedLoginAttempts"
                      type="number"
                      value={editedUser.failedLoginAttempts || 0}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de creación</Label>
                    <div className="p-2 border rounded-md">{formatDate(editedUser.createdAt)}</div>
                    <p className="text-xs text-muted-foreground">Este campo no se puede editar</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Última actualización</Label>
                    <div className="p-2 border rounded-md">{formatDate(editedUser.updatedAt)}</div>
                    <p className="text-xs text-muted-foreground">Este campo se actualizará automáticamente</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Último inicio de sesión</Label>
                    <div className="p-2 border rounded-md">
                      {editedUser.lastLoginAt ? formatDate(editedUser.lastLoginAt) : "Nunca"}
                    </div>
                    <p className="text-xs text-muted-foreground">Este campo no se puede editar</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Bloquear usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas bloquear este usuario? Ingresa el motivo del bloqueo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Input
              type="text"
              placeholder="Motivo del bloqueo"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              className="mb-4"
            />
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLockAccount} disabled={isLocking || !lockReason}>
              {isLocking ? "Bloqueando..." : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desbloquear usuario?</AlertDialogTitle>
            <AlertDialogDescription>¿Estás seguro de que deseas desbloquear este usuario?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlockAccount} disabled={isUnlocking}>
              {isUnlocking ? "Desbloqueando..." : "Desbloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={isDeleting} className="bg-red-600">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
