"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface ScriptOptimizationProps {
  children?: React.ReactNode
}

export function ScriptOptimization({ children }: ScriptOptimizationProps) {
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  useEffect(() => {
    // Función para cargar scripts no críticos después de que la página esté lista
    const loadNonCriticalScripts = () => {
      // Verificar si los scripts ya se han cargado
      if (scriptsLoaded) return

      // Marcar como cargados para evitar cargas duplicadas
      setScriptsLoaded(true)

      // Esperar a que la página esté completamente cargada y el usuario haya interactuado
      const loadScripts = () => {
        // Aquí cargaríamos scripts de terceros no críticos
        console.log("Cargando scripts no críticos")

        // Ejemplo: Analytics avanzados, chat widgets, etc.
        // const script = document.createElement('script')
        // script.src = 'https://example.com/non-critical-script.js'
        // script.async = true
        // document.body.appendChild(script)
      }

      // Usar requestIdleCallback si está disponible, o setTimeout como fallback
      if ("requestIdleCallback" in window) {
        // @ts-ignore - TypeScript no reconoce requestIdleCallback en todos los entornos
        window.requestIdleCallback(loadScripts, { timeout: 5000 })
      } else {
        setTimeout(loadScripts, 5000)
      }
    }

    // Cargar scripts cuando la página esté lista
    if (document.readyState === "complete") {
      loadNonCriticalScripts()
    } else {
      window.addEventListener("load", loadNonCriticalScripts)
      return () => window.removeEventListener("load", loadNonCriticalScripts)
    }
  }, [scriptsLoaded])

  return <>{children}</>
}
