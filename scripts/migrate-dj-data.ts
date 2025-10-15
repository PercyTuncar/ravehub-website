import { getAllDJSuggestions } from "@/lib/firebase/dj-suggestions"
import { getApprovedDJs } from "@/lib/firebase/dj"
import { createEventDJ, getAllApprovedEventDJs } from "@/lib/firebase/event-djs"
import type { DJSuggestion } from "@/types/dj-ranking"
import type { DJ } from "@/types/dj-ranking"

/**
 * Script para migrar datos de djSuggestions y djs a la nueva colección eventDjs
 * Ejecutar una sola vez para migrar datos existentes
 */
export async function migrateDJData() {
  console.log("🚀 Iniciando migración de datos DJ...")

  try {
    // Verificar si ya hay datos en eventDjs
    const existingDJs = await getAllApprovedEventDJs(1)
    if (existingDJs.length > 0) {
      console.log("⚠️  Ya existen datos en eventDjs. La migración ya fue ejecutada.")
      return
    }

    // 1. Migrar datos de djSuggestions
    console.log("📥 Migrando datos de djSuggestions...")
    const suggestions = await getAllDJSuggestions()

    for (const suggestion of suggestions) {
      try {
        await createEventDJ({
          name: suggestion.name,
          imageUrl: "", // Las sugerencias no tienen imagen
          description: "",
          instagramHandle: suggestion.instagram,
          spotifyUrl: "",
          soundcloudUrl: "",
          genres: [],
          country: suggestion.country,
          bio: "",
          socialLinks: {},
          approved: suggestion.approved,
          createdBy: "system-migration",
        })
        console.log(`✅ Migrado DJ suggestion: ${suggestion.name}`)
      } catch (error) {
        console.error(`❌ Error migrando suggestion ${suggestion.name}:`, error)
      }
    }

    // 2. Migrar datos de djs
    console.log("📥 Migrando datos de djs...")
    const djs = await getApprovedDJs()

    for (const dj of djs) {
      try {
        await createEventDJ({
          name: dj.name,
          imageUrl: dj.photoUrl || "",
          description: dj.bio || "",
          instagramHandle: dj.instagram,
          spotifyUrl: dj.socialLinks?.spotify || "",
          soundcloudUrl: dj.socialLinks?.soundcloud || "",
          genres: dj.genres || [],
          country: dj.country,
          bio: dj.bio || "",
          socialLinks: dj.socialLinks || {},
          approved: dj.approved,
          createdBy: dj.createdBy,
        })
        console.log(`✅ Migrado DJ: ${dj.name}`)
      } catch (error) {
        console.error(`❌ Error migrando DJ ${dj.name}:`, error)
      }
    }

    console.log("🎉 Migración completada exitosamente!")

  } catch (error) {
    console.error("💥 Error durante la migración:", error)
    throw error
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateDJData()
    .then(() => {
      console.log("✅ Migración finalizada")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Error en migración:", error)
      process.exit(1)
    })
}