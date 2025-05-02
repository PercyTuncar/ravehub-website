import { db } from "./config"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore"

// Interfaz para el bloqueo de cuenta
export interface AccountLock {
  userId: string
  email: string
  failedAttempts: number
  lastFailedAttempt: Timestamp
  isLocked: boolean
  lockedUntil: Timestamp | null
  lockReason: string
  lockedBy: string | null // admin que bloqueó manualmente
  unlockRequested: boolean
}

// Constantes para la política de bloqueo
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 30

// Registrar un intento fallido de inicio de sesión
export async function recordFailedLoginAttempt(userId: string, email: string): Promise<boolean> {
  try {
    const lockRef = doc(db, "accountLocks", userId)
    const lockDoc = await getDoc(lockRef)

    const now = Timestamp.now()

    if (lockDoc.exists()) {
      const lockData = lockDoc.data() as AccountLock

      // Si ya está bloqueada y el bloqueo no ha expirado, no hacer nada
      if (lockData.isLocked && lockData.lockedUntil && lockData.lockedUntil.toMillis() > now.toMillis()) {
        return true // La cuenta sigue bloqueada
      }

      // Si el bloqueo ha expirado, reiniciar el contador
      if (lockData.lockedUntil && lockData.lockedUntil.toMillis() <= now.toMillis()) {
        await updateDoc(lockRef, {
          failedAttempts: 1,
          lastFailedAttempt: now,
          isLocked: false,
          lockedUntil: null,
        })
        return false
      }

      // Incrementar contador de intentos fallidos
      const newFailedAttempts = lockData.failedAttempts + 1

      // Verificar si debe bloquearse
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Timestamp(now.seconds + LOCK_DURATION_MINUTES * 60, now.nanoseconds)

        await updateDoc(lockRef, {
          failedAttempts: newFailedAttempts,
          lastFailedAttempt: now,
          isLocked: true,
          lockedUntil: lockUntil,
          lockReason: "Demasiados intentos fallidos de inicio de sesión",
        })

        return true // Cuenta bloqueada
      } else {
        // Solo actualizar contador
        await updateDoc(lockRef, {
          failedAttempts: newFailedAttempts,
          lastFailedAttempt: now,
        })

        return false
      }
    } else {
      // Crear nuevo registro
      await setDoc(lockRef, {
        userId,
        email,
        failedAttempts: 1,
        lastFailedAttempt: now,
        isLocked: false,
        lockedUntil: null,
        lockReason: "",
        lockedBy: null,
        unlockRequested: false,
      })

      return false
    }
  } catch (error) {
    console.error("Error al registrar intento fallido:", error)
    return false
  }
}

// Verificar si una cuenta está bloqueada
export async function isAccountLocked(
  userId: string,
): Promise<{ isLocked: boolean; reason: string; until: Date | null }> {
  try {
    const lockRef = doc(db, "accountLocks", userId)
    const lockDoc = await getDoc(lockRef)

    if (!lockDoc.exists()) {
      return { isLocked: false, reason: "", until: null }
    }

    const lockData = lockDoc.data() as AccountLock
    const now = Timestamp.now()

    // Si está bloqueada pero el tiempo ha expirado, desbloquear automáticamente
    if (lockData.isLocked && lockData.lockedUntil && lockData.lockedUntil.toMillis() <= now.toMillis()) {
      await updateDoc(lockRef, {
        isLocked: false,
        lockedUntil: null,
      })

      return { isLocked: false, reason: "", until: null }
    }

    return {
      isLocked: lockData.isLocked,
      reason: lockData.lockReason,
      until: lockData.lockedUntil ? lockData.lockedUntil.toDate() : null,
    }
  } catch (error) {
    console.error("Error al verificar bloqueo de cuenta:", error)
    return { isLocked: false, reason: "", until: null }
  }
}

// Resetear intentos fallidos después de un login exitoso
export async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    const lockRef = doc(db, "accountLocks", userId)
    const lockDoc = await getDoc(lockRef)

    if (lockDoc.exists()) {
      await updateDoc(lockRef, {
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      })
    }
  } catch (error) {
    console.error("Error al resetear intentos fallidos:", error)
  }
}

// Bloquear cuenta manualmente (por admin)
export async function lockAccount(
  userId: string,
  reason: string,
  adminId: string,
  duration: number = 24 * 60,
): Promise<boolean> {
  try {
    const lockRef = doc(db, "accountLocks", userId)
    const userRef = doc(db, "users", userId)

    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      return false
    }

    const now = Timestamp.now()
    const lockUntil = new Timestamp(now.seconds + duration * 60, now.nanoseconds)

    await setDoc(
      lockRef,
      {
        userId,
        email: userDoc.data().email || "",
        failedAttempts: MAX_FAILED_ATTEMPTS,
        lastFailedAttempt: now,
        isLocked: true,
        lockedUntil: lockUntil,
        lockReason: reason,
        lockedBy: adminId,
        unlockRequested: false,
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error al bloquear cuenta:", error)
    return false
  }
}

// Desbloquear cuenta (por admin)
export async function unlockAccount(userId: string): Promise<boolean> {
  try {
    const lockRef = doc(db, "accountLocks", userId)

    await updateDoc(lockRef, {
      failedAttempts: 0,
      isLocked: false,
      lockedUntil: null,
      unlockRequested: false,
    })

    return true
  } catch (error) {
    console.error("Error al desbloquear cuenta:", error)
    return false
  }
}

// Obtener todas las cuentas bloqueadas
export async function getLockedAccounts(): Promise<AccountLock[]> {
  try {
    const locksRef = collection(db, "accountLocks")
    const q = query(locksRef, where("isLocked", "==", true))
    const querySnapshot = await getDocs(q)

    const lockedAccounts: AccountLock[] = []
    querySnapshot.forEach((doc) => {
      lockedAccounts.push(doc.data() as AccountLock)
    })

    return lockedAccounts
  } catch (error) {
    console.error("Error al obtener cuentas bloqueadas:", error)
    return []
  }
}

// Solicitar desbloqueo (por usuario)
export async function requestUnlock(userId: string): Promise<boolean> {
  try {
    const lockRef = doc(db, "accountLocks", userId)
    const lockDoc = await getDoc(lockRef)

    if (!lockDoc.exists() || !lockDoc.data().isLocked) {
      return false
    }

    await updateDoc(lockRef, {
      unlockRequested: true,
    })

    return true
  } catch (error) {
    console.error("Error al solicitar desbloqueo:", error)
    return false
  }
}

// Add this function to get user by email
export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
    }
  } catch (error) {
    console.error("Error al obtener usuario por email:", error)
    return null
  }
}
