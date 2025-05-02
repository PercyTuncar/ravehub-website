"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Unlock, Ban, AlertTriangle } from "lucide-react"
import { getLockedAccounts, unlockAccount, lockAccount } from "@/lib/firebase/account-locks"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export function LockedAccountsList() {
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("24")
  const { user } = useAuth()

  useEffect(() => {
    fetchLockedAccounts()
  }, [])

  const fetchLockedAccounts = async () => {
    try {
      setLoading(true)
      const accounts = await getLockedAccounts()
      setLockedAccounts(accounts)
    } catch (error) {
      console.error("Error al obtener cuentas bloqueadas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas bloqueadas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockAccount = async () => {
    if (!selectedAccount) return

    try {
      const success = await unlockAccount(selectedAccount.userId)
      if (success) {
        toast({
          title: "Cuenta desbloqueada",
          description: `La cuenta ${selectedAccount.email} ha sido desbloqueada correctamente.`,
        })
        fetchLockedAccounts()
      } else {
        toast({
          title: "Error",
          description: "No se pudo desbloquear la cuenta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al desbloquear cuenta:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al desbloquear la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsUnlockDialogOpen(false)
    }
  }

  const handleBanAccount = async () => {
    if (!selectedAccount || !user) return

    try {
      const success = await lockAccount(
        selectedAccount.userId,
        banReason || "Bloqueado por administrador",
        user.id,
        Number.parseInt(banDuration),
      )

      if (success) {
        toast({
          title: "Cuenta bloqueada",
          description: `La cuenta ${selectedAccount.email} ha sido bloqueada correctamente.`,
        })
        fetchLockedAccounts()
      } else {
        toast({
          title: "Error",
          description: "No se pudo bloquear la cuenta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al bloquear cuenta:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al bloquear la cuenta",
        variant: "destructive",
      })
    } finally {
      setIsBanDialogOpen(false)
      setBanReason("")
      setBanDuration("24")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      // Eliminar el usuario de Firestore
      await deleteDoc(doc(db, "users", userId))

      // También eliminar el registro de bloqueo
      await deleteDoc(doc(db, "accountLocks", userId))

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado permanentemente",
      })

      fetchLockedAccounts()
    } catch (error) {
      console.error("Error al eliminar usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return "N/A"
    return format(timestamp.toDate(), "dd/MM/yyyy HH:mm:ss")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Cuentas bloqueadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Último intento</TableHead>
                <TableHead>Bloqueado hasta</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Intentos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Cargando cuentas bloqueadas...
                  </TableCell>
                </TableRow>
              ) : lockedAccounts.length > 0 ? (
                lockedAccounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell>{formatDate(account.lastFailedAttempt)}</TableCell>
                    <TableCell>{formatDate(account.lockedUntil)}</TableCell>
                    <TableCell>{account.lockReason}</TableCell>
                    <TableCell>{account.failedAttempts}</TableCell>
                    <TableCell>
                      {account.unlockRequested ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Solicita desbloqueo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Bloqueado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedAccount(account)
                            setIsUnlockDialogOpen(true)
                          }}
                        >
                          <Unlock className="h-4 w-4" />
                          <span className="sr-only">Desbloquear</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedAccount(account)
                            setIsBanDialogOpen(true)
                          }}
                        >
                          <Ban className="h-4 w-4" />
                          <span className="sr-only">Bloquear</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(account.userId)}>
                          <Ban className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No hay cuentas bloqueadas actualmente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Diálogo de desbloqueo */}
      <AlertDialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas desbloquear la cuenta {selectedAccount?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlockAccount}>Desbloquear</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de bloqueo manual */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear cuenta</DialogTitle>
            <DialogDescription>Configura el bloqueo para la cuenta {selectedAccount?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Razón del bloqueo</Label>
              <Input
                id="reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Actividad sospechosa"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duración (horas)</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Seleccionar duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="6">6 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="72">3 días</SelectItem>
                  <SelectItem value="168">1 semana</SelectItem>
                  <SelectItem value="720">30 días</SelectItem>
                  <SelectItem value="8760">1 año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBanAccount}>
              Bloquear cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
