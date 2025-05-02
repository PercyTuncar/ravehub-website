// Este script es solo para referencia, no se ejecutará en el proyecto
// Muestra cómo se generarían los íconos a partir de una imagen base

const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputFile = "logo-source.png"
const outputDir = path.join(__dirname, "../public/icons")

// Asegurarse de que el directorio existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generar íconos para cada tamaño
sizes.forEach((size) => {
  sharp(inputFile)
    .resize(size, size)
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => console.log(`Generado ícono de ${size}x${size}`))
    .catch((err) => console.error(`Error generando ícono de ${size}x${size}:`, err))
})

// Generar ícono para notificaciones
sharp(inputFile)
  .resize(48, 48)
  .toFile(path.join(outputDir, "badge-icon.png"))
  .then(() => console.log("Generado ícono para notificaciones"))
  .catch((err) => console.error("Error generando ícono para notificaciones:", err))

// Generar íconos para accesos directos
;["calendar-icon.png", "shop-icon.png"].forEach((icon) => {
  sharp(icon)
    .resize(192, 192)
    .toFile(path.join(outputDir, icon))
    .then(() => console.log(`Generado ícono de acceso directo ${icon}`))
    .catch((err) => console.error(`Error generando ícono de acceso directo ${icon}:`, err))
})
