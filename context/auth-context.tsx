"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { verifyAuthConsistency, getCurrentUserData } from "@/lib/firebase/auth"
import type { User } from "@/types"
import {
  isAccountLocked,
  recordFailedLoginAttempt,
  resetFailedAttempts,
  getUserByEmail,
} from "@/lib/firebase/account-locks"

// Añadir estas importaciones al inicio del archivo, después de las importaciones existentes
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  linkGoogleAccount as firebaseLinkGoogleAccount,
  setPasswordForGoogleUser as firebaseSetPasswordForGoogleUser,
} from "@/lib/firebase/auth"

// Actualizar la interfaz AuthContextType para incluir las nuevas funciones
interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  register: (
    email: string,
    password: string,
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "isActive" | "role">,
  ) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
  refreshUserData: () => Promise<void>
  authStatus: {
    initialized: boolean
    lastChecked: Date | null
    isConsistent: boolean | null
  }
  // Nuevas funciones
  signInWithGoogle: () => Promise<any>
  linkGoogleAccount: () => Promise<boolean>
  setPasswordForGoogleUser: (password: string) => Promise<boolean>
  completeGoogleRegistration: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authStatus, setAuthStatus] = useState({
    initialized: false,
    lastChecked: null as Date | null,
    isConsistent: null as boolean | null,
  })

  // Función para validar y corregir el objeto de usuario
  const validateUserObject = (userData: any): User => {
    if (!userData) return null

    // Asegurarse de que el objeto tenga todas las propiedades requeridas
    const validatedUser = {
      ...userData,
      // Asegurarse de que el ID esté presente
      id: userData.id || auth.currentUser?.uid || "",
    }

    // Eliminar esta línea

    return validatedUser as User
  }

  // Función para refrescar los datos del usuario
  const refreshUserData = useCallback(async () => {
    try {
      setLoading(true)

      // Verificar si tenemos datos en caché recientes
      if (typeof window !== "undefined") {
        const cachedUserData = localStorage.getItem("userData")
        const cacheTime = localStorage.getItem("userDataTimestamp")

        if (cachedUserData && cacheTime && Date.now() - Number.parseInt(cacheTime) < 60 * 1000) {
          try {
            const userData = JSON.parse(cachedUserData) as User
            setUser(userData)
            setIsAdmin(userData.role === "admin")
            setLoading(false)

            // Actualizar en segundo plano
            setTimeout(async () => {
              const freshData = await getCurrentUserData()
              if (freshData) {
                setUser(freshData)
                setIsAdmin(freshData.role === "admin")
              }
            }, 0)

            return
          } catch (e) {
            console.error("Error al parsear datos de usuario en caché:", e)
          }
        }
      }

      const userData = await getCurrentUserData()

      if (userData) {
        // Validar y corregir el objeto de usuario
        const validatedUser = validateUserObject(userData)

        setUser(validatedUser)
        setIsAdmin(validatedUser.role === "admin")
      } else {
        setUser(null)
        setIsAdmin(false)
      }

      // Verificar consistencia en segundo plano
      setTimeout(async () => {
        try {
          const consistency = await verifyAuthConsistency()
          setAuthStatus((prev) => ({
            ...prev,
            lastChecked: new Date(),
            isConsistent: consistency.isConsistent,
          }))
        } catch (err) {
          console.error("Error verificando consistencia en segundo plano:", err)
        }
      }, 0)
    } catch (err) {
      console.error("Error al refrescar datos del usuario:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Dentro de la función AuthProvider, en el useEffect para onAuthStateChanged
  useEffect(() => {
    // Verificar si tenemos datos en caché local para mostrar inmediatamente
    if (typeof window !== "undefined") {
      const cachedUserData = localStorage.getItem("userData")
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData) as User
          setUser(userData)
          setIsAdmin(userData.role === "admin")
          setLoading(false) // Reducir el tiempo de carga inicial usando caché
        } catch (e) {
          console.error("Error al parsear datos de usuario en caché:", e)
          localStorage.removeItem("userData")
        }
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Verificar si la cuenta está bloqueada (mantener esta verificación por seguridad)
          const lockStatus = await isAccountLocked(firebaseUser.uid)
          if (lockStatus.isLocked) {
            setError(`Cuenta bloqueada: ${lockStatus.reason}`)
            await signOut(auth)
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
            return
          }

          // Registrar el último acceso en Firestore en segundo plano
          const userRef = doc(db, "users", firebaseUser.uid)
          const now = new Date()
          const firestoreTimestamp = Timestamp.now()

          // Detectar información del dispositivo
          const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
          }

          // Crear un string descriptivo del dispositivo
          const deviceDescription = `${getDeviceType(navigator.userAgent)} - ${getBrowserInfo(navigator.userAgent)}`

          // Actualizar en segundo plano sin bloquear la UI
          setTimeout(() => {
            updateDoc(userRef, {
              lastLoginAt: firestoreTimestamp,
              lastLogin: firestoreTimestamp,
              lastLoginDevice: deviceDescription,
              lastLoginInfo: deviceInfo,
            }).catch((err) => console.error("Error al actualizar timestamp de login:", err))
          }, 0)

          // Verificar si ya tenemos datos del usuario en caché
          let userData: User | null = null
          if (typeof window !== "undefined") {
            const cachedUserData = localStorage.getItem("userData")
            const cacheTime = localStorage.getItem("userDataTimestamp")

            if (cachedUserData && cacheTime && Date.now() - Number.parseInt(cacheTime) < 5 * 60 * 1000) {
              try {
                userData = JSON.parse(cachedUserData) as User
              } catch (e) {
                console.error("Error al parsear datos de usuario en caché:", e)
              }
            }
          }

          // Si no tenemos datos en caché o son antiguos, obtenerlos de Firestore
          if (!userData) {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

            if (userDoc.exists()) {
              userData = userDoc.data() as User

              // Asegurarse de que el ID del usuario esté siempre presente
              userData = validateUserObject({
                ...userData,
                id: firebaseUser.uid, // Forzar el ID correcto
              })

              // Guardar en caché local
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("userData", JSON.stringify(userData))
                  localStorage.setItem("userDataTimestamp", Date.now().toString())
                } catch (e) {
                  console.error("Error al guardar datos de usuario en caché:", e)
                }
              }
            } else {
              // Crear un usuario básico con el ID correcto
              userData = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                firstName: firebaseUser.displayName?.split(" ")[0] || "Usuario",
                lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
                phone: "",
                phonePrefix: "",
                country: "",
                documentType: "",
                documentNumber: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                role: "user",
                preferredCurrency: "USD",
              }

              // Guardar el usuario básico en Firestore en segundo plano
              setTimeout(() => {
                setDoc(doc(db, "users", firebaseUser.uid), userData).catch((err) =>
                  console.error("Error al guardar usuario básico:", err),
                )
              }, 0)

              // Guardar en caché local
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("userData", JSON.stringify(userData))
                  localStorage.setItem("userDataTimestamp", Date.now().toString())
                } catch (e) {
                  console.error("Error al guardar datos de usuario en caché:", e)
                }
              }
            }
          }

          setUser(userData)
          setIsAdmin(userData.role === "admin")
        } else {
          setUser(null)
          setIsAdmin(false)

          // Limpiar caché local cuando el usuario cierra sesión
          if (typeof window !== "undefined") {
            localStorage.removeItem("userData")
            localStorage.removeItem("userDataTimestamp")
          }
        }

        // Verificar consistencia en segundo plano sin bloquear la UI
        setTimeout(async () => {
          try {
            const consistency = await verifyAuthConsistency()
            setAuthStatus({
              initialized: true,
              lastChecked: new Date(),
              isConsistent: consistency.isConsistent,
            })
          } catch (err) {
            console.error("Error verificando consistencia en segundo plano:", err)
          }
        }, 0)
      } catch (err) {
        console.error("Error procesando cambio de estado de autenticación:", err)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const register = async (
    email: string,
    password: string,
    userData: Omit<User, "id" | "createdAt" | "updatedAt" | "isActive" | "role">,
  ) => {
    try {
      setError(null)
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      const newUser: User = {
        id: firebaseUser.uid,
        email,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: "user",
      }

      await setDoc(doc(db, "users", firebaseUser.uid), newUser)
      setUser(newUser)
      setIsAdmin(false)
    } catch (err: any) {
      console.error("Error en registro:", err.message)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // Eliminar esta línea
      setError(null)
      setLoading(true)

      // Primero intentamos obtener el usuario por email para verificar si está bloqueado
      const userByEmail = await getUserByEmail(email)

      if (userByEmail) {
        // Verificar si la cuenta está bloqueada
        const lockStatus = await isAccountLocked(userByEmail.id)

        if (lockStatus.isLocked) {
          const untilDate = lockStatus.until ? new Date(lockStatus.until).toLocaleString() : "tiempo indefinido"
          setError(`Cuenta bloqueada hasta ${untilDate}: ${lockStatus.reason}`)
          setLoading(false)
          return
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Resetear intentos fallidos después de login exitoso
      await resetFailedAttempts(firebaseUser.uid)

      // Eliminar esta línea

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data() as User

        // Asegurarse de que el ID del usuario esté siempre presente
        const validatedUser = validateUserObject({
          ...userData,
          id: firebaseUser.uid, // Forzar el ID correcto
        })

        setUser(validatedUser)
        setIsAdmin(validatedUser.role === "admin")
      } else {
        // Si el documento del usuario no existe, crear uno básico
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          firstName: firebaseUser.displayName?.split(" ")[0] || "Usuario",
          lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
          phone: "",
          phonePrefix: "",
          country: "",
          documentType: "",
          documentNumber: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          role: "user",
          preferredCurrency: "USD",
        }

        await setDoc(doc(db, "users", firebaseUser.uid), newUser)
        setUser(newUser)
        setIsAdmin(false)
      }

      // Verificar consistencia después del login
      const consistency = await verifyAuthConsistency()
      setAuthStatus((prev) => ({
        ...prev,
        lastChecked: new Date(),
        isConsistent: consistency.isConsistent,
      }))
    } catch (err: any) {
      // Eliminar esta línea

      // Registrar intento fallido si podemos identificar el usuario
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        // Intentar obtener el usuario por email para registrar el intento fallido
        const userByEmail = await getUserByEmail(email)
        if (userByEmail) {
          await recordFailedLoginAttempt(userByEmail.id, email)
        }
      }

      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Credenciales incorrectas")
      } else if (err.code === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intenta más tarde")
      } else {
        setError("Ocurrió un error al iniciar sesión. Intenta de nuevo")
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setIsAdmin(false)
    } catch (err: any) {
      console.error("Error en logout:", err.message)
      setError(err.message)
      throw err
    }
  }

  // Añadir estas funciones dentro del AuthProvider, antes del return
  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      const result = await firebaseSignInWithGoogle()

      // Si el usuario necesita completar el registro, no actualizamos el estado
      if (result.isNewUser) {
        return result
      }

      // Si el usuario necesita vincular cuentas, manejamos eso
      if (result.needsLinking) {
        // Aquí solo devolvemos el resultado, la vinculación se hará en el componente
        return result
      }

      // Si el usuario ya existe completamente, actualizamos el estado
      await refreshUserData()

      return result
    } catch (err: any) {
      console.error("Error en signInWithGoogle:", err.message)
      setError("Error al iniciar sesión con Google")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const linkGoogleAccount = async () => {
    try {
      setError(null)
      setLoading(true)
      const result = await firebaseLinkGoogleAccount(auth.currentUser)
      await refreshUserData()
      return result
    } catch (err: any) {
      console.error("Error en linkGoogleAccount:", err.message)
      setError("Error al vincular cuenta de Google")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const setPasswordForGoogleUser = async (password: string) => {
    try {
      setError(null)
      setLoading(true)
      const result = await firebaseSetPasswordForGoogleUser(password)
      await refreshUserData()
      return result
    } catch (err: any) {
      console.error("Error en setPasswordForGoogleUser:", err.message)
      setError("Error al establecer contraseña")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const completeGoogleRegistration = async (userData: Partial<User>) => {
    try {
      setError(null)
      setLoading(true)

      if (!auth.currentUser) {
        throw new Error("Usuario no autenticado")
      }

      const firebaseUser = auth.currentUser

      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        firstName: userData.firstName || firebaseUser.displayName?.split(" ")[0] || "",
        lastName: userData.lastName || firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
        phone: userData.phone || "",
        phonePrefix: userData.phonePrefix || "",
        country: userData.country || "",
        documentType: userData.documentType || "",
        documentNumber: userData.documentNumber || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        role: "user",
        preferredCurrency: userData.preferredCurrency || "USD",
        authProvider: "google",
      }

      await setDoc(doc(db, "users", firebaseUser.uid), newUser)
      setUser(newUser)
      setIsAdmin(false)
    } catch (err: any) {
      console.error("Error en completeGoogleRegistration:", err.message)
      setError("Error al completar el registro")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Actualizar el value del AuthContext para incluir las nuevas funciones
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        isAdmin,
        refreshUserData,
        authStatus,
        // Nuevas funciones
        signInWithGoogle,
        linkGoogleAccount,
        setPasswordForGoogleUser,
        completeGoogleRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Agregar estas funciones auxiliares al final del archivo, antes del cierre del componente
// Función para detectar tipo de dispositivo
function getDeviceType(userAgent) {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return "Móvil"
  } else if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(userAgent)) {
    return "Tablet"
  }
  return "Desktop"
}

// Función para obtener información del navegador
function getBrowserInfo(userAgent) {
  const browsers = [
    { name: "Chrome", regex: /Chrome\/([0-9.]+)/ },
    { name: "Firefox", regex: /Firefox\/([0-9.]+)/ },
    { name: "Safari", regex: /Version\/([0-9.]+).*Safari/ },
    { name: "Edge", regex: /Edg\/([0-9.]+)/ },
    { name: "Opera", regex: /OPR\/([0-9.]+)/ },
  ]

  for (const browser of browsers) {
    const match = userAgent.match(browser.regex)
    if (match) {
      return `${browser.name} ${match[1]}`
    }
  }

  return "Navegador desconocido"
}
