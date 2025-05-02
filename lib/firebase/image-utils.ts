/**
 * Filtra URLs de blob de una matriz de URLs de imágenes
 * @param imageUrls Array de URLs de imágenes
 * @returns Array filtrado sin URLs de blob
 */
export function filterBlobUrls(imageUrls?: string[]): string[] {
  if (!imageUrls) return []

  return imageUrls.filter((url) => {
    // Filtrar URLs de blob que son temporales
    return url && !url.startsWith("blob:")
  })
}

/**
 * Limpia textos alternativos para imágenes, eliminando entradas para URLs de blob
 * @param altTexts Objeto con URLs como claves y textos alternativos como valores
 * @returns Objeto limpio sin entradas para URLs de blob
 */
export function cleanAltTexts(altTexts?: { [key: string]: string }): { [key: string]: string } {
  if (!altTexts) return {}

  const cleanedAltTexts: { [key: string]: string } = {}

  for (const [url, alt] of Object.entries(altTexts)) {
    // Solo mantener textos alternativos para URLs que no sean blob
    if (url && !url.startsWith("blob:")) {
      cleanedAltTexts[url] = alt
    }
  }

  return cleanedAltTexts
}
