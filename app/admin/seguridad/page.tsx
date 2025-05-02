"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Unlock, Loader2 } from "lucide-react"
import { getLockedAccounts, unlockAccount } from "@/lib/firebase/account-locks"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

export default function AdminSecurityPage() {
  const [lockedAccounts, setLockedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [userToUnlock, setUserToUnlock] = useState(null)
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)

  useEffect(() => {
    const fetchLockedAccounts = async () => {
      try {
        setLoading(true)
        const lockedAccountsData = await getLockedAccounts()
        setLockedAccounts(lockedAccountsData)
      } catch (error) {
        console.error("Error fetching locked accounts:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar las cuentas bloqueadas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLockedAccounts()
  }, [])

  const handleUnlockAccount = (userId: string) => {
    setUserToUnlock(userId)
    setIsUnlockDialogOpen(true)
  }

  const confirmUnlockAccount = async () => {
    if (!userToUnlock) return

    try {
      setIsUnlocking(true)
      const success = await unlockAccount(userToUnlock)

      if (success) {
        setLockedAccounts(lockedAccounts.filter((account) => account.userId !== userToUnlock))
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuentas bloqueadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Bloqueado hasta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Cargando cuentas bloqueadas...
                    </TableCell>
                  </TableRow>
                ) : lockedAccounts.length > 0 ? (
                  lockedAccounts.map((account) => (
                    <TableRow key={account.userId}>
                      <TableCell className="font-medium">{account.userId}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.lockReason}</TableCell>
                      <TableCell>{account.lockedUntil ? formatDate(account.lockedUntil) : "Permanentemente"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" onClick={() => handleUnlockAccount(account.userId)}>
                          <Unlock className="h-4 w-4" />
                          <span className="sr-only">Desbloquear</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No hay cuentas bloqueadas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
              {isUnlocking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Desbloqueando...</span>
                </>
              ) : (
                "Desbloquear"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
