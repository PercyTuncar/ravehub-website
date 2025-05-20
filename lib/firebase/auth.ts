import { auth } from "./firebase"
import { onAuthStateChanged, signOut, getAuth } from "firebase/auth"
import { getUserById } from "./users"
import type { User } from "@/types"
import {
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { getUserByEmail } from "./users"
import { db } from "./firebase"
import { doc, updateDoc, Timestamp } from "firebase/firestore"

// Función para obtener el estado actual de autenticación
export function getAuthStatus() {
  const currentAuth = getAuth()
  const currentUser = currentAuth.currentUser

  return {
    isAuthenticated: !!currentUser,
    // No incluir información sensible en el objeto de retorno
    authStateReady: !currentAuth.authStateReady,
  }
}

// Optimizar la función getCurrentUser para reducir operaciones innecesarias
export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    // Primero verificar si ya tenemos el usuario en memoria
    const currentAuth = getAuth()
    if (currentAuth.currentUser) {
      resolve(currentAuth.currentUser)

      // Actualizar el timestamp en segundo plano sin bloquear la resolución
      try {
        const userRef = doc(db, "users", currentAuth.currentUser.uid)
        const now = Timestamp.now()
        updateDoc(userRef, {
          lastLoginAt: now,
          lastLogin: now,
        }).catch((err) => console.error("Error al actualizar timestamp de acceso en segundo plano:", err))
      } catch (updateError) {
        console.error("Error al actualizar timestamp de acceso:", updateError)
      }

      return
    }

    // Si no tenemos el usuario en memoria, usar onAuthStateChanged
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        unsubscribe()

        if (user) {
          // No verificar token aquí, solo resolver con el usuario
          resolve(user)

          // Actualizar el timestamp en segundo plano
          try {
            const userRef = doc(db, "users", user.uid)
            const now = Timestamp.now()
            updateDoc(userRef, {
              lastLoginAt: now,
              lastLogin: now,
            }).catch((err) => console.error("Error al actualizar timestamp de acceso en segundo plano:", err))
          } catch (updateError) {
            console.error("Error al actualizar timestamp de acceso:", updateError)
          }
        } else {
          resolve(null)
        }
      },
      (error) => {
        console.error("Error en onAuthStateChanged:", error)
        reject(error)
      },
    )
  })
}

// Cerrar sesión
export async function signOutUser() {
  try {
    await signOut(auth)
    // Eliminado console.log por seguridad
    return true
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return false
  }
}

// Optimizar getCurrentUserData para usar caché local
export async function getCurrentUserData(retryCount = 3): Promise<User | null> {
  try {
    // Verificar si tenemos datos en caché local
    if (typeof window !== "undefined") {
      const cachedUserData = localStorage.getItem("userData")
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData) as User
          // Verificar si los datos en caché son recientes (menos de 5 minutos)
          const cacheTime = localStorage.getItem("userDataTimestamp")
          if (cacheTime && Date.now() - Number.parseInt(cacheTime) < 5 * 60 * 1000) {
            // Usar datos en caché y actualizar en segundo plano
            setTimeout(() => refreshUserDataInBackground(), 0)
            return userData
          }
        } catch (e) {
          console.error("Error al parsear datos de usuario en caché:", e)
          localStorage.removeItem("userData")
          localStorage.removeItem("userDataTimestamp")
        }
      }
    }

    const user = await getCurrentUser()
    if (!user) {
      return null
    }

    let userData = await getUserById(user.uid)

    // Implementar reintentos si no se encuentra el usuario
    let attempts = 0
    while (!userData && attempts < retryCount) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempts + 1))) // Esperar con backoff
      userData = await getUserById(user.uid)
      attempts++
    }

    if (!userData) {
      return null
    }

    // Guardar en caché local
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("userData", JSON.stringify(userData))
        localStorage.setItem("userDataTimestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar datos de usuario en caché:", e)
      }
    }

    return userData
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error)
    return null
  }
}

// Función para actualizar datos de usuario en segundo plano
async function refreshUserDataInBackground() {
  try {
    const user = await getCurrentUser()
    if (!user) return

    const userData = await getUserById(user.uid)
    if (!userData) return

    // Actualizar caché local
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("userData", JSON.stringify(userData))
        localStorage.setItem("userDataTimestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al actualizar caché de usuario en segundo plano:", e)
      }
    }
  } catch (error) {
    console.error("Error al actualizar datos de usuario en segundo plano:", error)
  }
}

// Optimizar verifyAuthConsistency para ser más eficiente
export async function verifyAuthConsistency(): Promise<{
  isAuthenticated: boolean
  hasFirestoreData: boolean
  isConsistent: boolean
}> {
  try {
    // Verificar si tenemos resultado en caché
    if (typeof window !== "undefined") {
      const cachedResult = localStorage.getItem("authConsistency")
      const cacheTime = localStorage.getItem("authConsistencyTimestamp")

      if (cachedResult && cacheTime && Date.now() - Number.parseInt(cacheTime) < 30 * 60 * 1000) {
        // Usar resultado en caché si tiene menos de 30 minutos
        return JSON.parse(cachedResult)
      }
    }

    const firebaseUser = await getCurrentUser()
    const isAuthenticated = !!firebaseUser

    let hasFirestoreData = false
    let isConsistent = true

    if (isAuthenticated && firebaseUser) {
      const userData = await getUserById(firebaseUser.uid)
      hasFirestoreData = !!userData
      isConsistent = isAuthenticated === hasFirestoreData
    }

    const result = { isAuthenticated, hasFirestoreData, isConsistent }

    // Guardar resultado en caché
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("authConsistency", JSON.stringify(result))
        localStorage.setItem("authConsistencyTimestamp", Date.now().toString())
      } catch (e) {
        console.error("Error al guardar consistencia de autenticación en caché:", e)
      }
    }

    return result
  } catch (error) {
    console.error("Error verificando consistencia de autenticación:", error)
    return { isAuthenticated: false, hasFirestoreData: false, isConsistent: false }
  }
}

// Función para iniciar sesión con Google
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    // Solicitar el perfil del usuario y el email
    provider.addScope("profile")
    provider.addScope("email")

    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const credential = GoogleAuthProvider.credentialFromResult(result)

    // Verificar si el email ya existe en otro método de autenticación
    if (user.email) {
      const methods = await fetchSignInMethodsForEmail(auth, user.email)

      // Si el usuario existe con email/password pero no con Google
      if (methods.includes("password") && !methods.includes("google.com")) {
        // El usuario ya existe con email/password, debemos vincular la cuenta de Google
        return {
          user,
          credential,
          isNewUser: false,
          needsLinking: true,
          methods,
        }
      }

      // Verificar si el usuario existe en Firestore
      const firestoreUser = await getUserByEmail(user.email)

      if (!firestoreUser) {
        // El usuario no existe en Firestore, necesita completar el registro
        return {
          user,
          credential,
          isNewUser: true,
          needsLinking: false,
          methods,
        }
      }
    }

    return {
      user,
      credential,
      isNewUser: false,
      needsLinking: false,
      methods: [],
    }
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error)
    throw error
  }
}

// Función para vincular cuenta de Google a una cuenta existente
export async function linkGoogleAccount(currentUser: any) {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)

    if (credential && currentUser) {
      await linkWithCredential(currentUser, credential)
      return true
    }
    return false
  } catch (error) {
    console.error("Error al vincular cuenta de Google:", error)
    throw error
  }
}

// Función para establecer contraseña en cuenta de Google
export async function setPasswordForGoogleUser(password: string) {
  try {
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error("Usuario no autenticado o sin email")
    }

    // Crear credencial de email/contraseña
    const credential = EmailAuthProvider.credential(user.email, password)

    // Vincular la credencial al usuario actual
    await linkWithCredential(user, credential)
    return true
  } catch (error) {
    console.error("Error al establecer contraseña:", error)
    throw error
  }
}

// Función para verificar si un email ya existe
export async function checkIfEmailExists(email: string) {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email)
    return methods.length > 0
  } catch (error) {
    console.error("Error al verificar email:", error)
    return false
  }
}
