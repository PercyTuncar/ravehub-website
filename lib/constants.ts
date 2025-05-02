// Currency data
export const currencies = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$", flag: "🇺🇸" },
  { code: "PEN", name: "Sol peruano", symbol: "S/", flag: "🇵🇪" },
  { code: "CLP", name: "Peso chileno", symbol: "$", flag: "🇨🇱" },
  { code: "MXN", name: "Peso mexicano", symbol: "$", flag: "🇲🇽" },
  { code: "ARS", name: "Peso argentino", symbol: "$", flag: "🇦🇷" },
  { code: "BRL", name: "Real brasileño", symbol: "R$", flag: "🇧🇷" },
  { code: "COP", name: "Peso colombiano", symbol: "$", flag: "🇨🇴" },
]

// Map country codes to currency codes
export const countryToCurrency: Record<string, string> = {
  US: "USD", // Estados Unidos -> USD
  PE: "PEN", // Perú -> PEN
  CL: "CLP", // Chile -> CLP
  MX: "MXN", // México -> MXN
  AR: "ARS", // Argentina -> ARS
  BR: "BRL", // Brasil -> BRL
  CO: "COP", // Colombia -> COP
  // Añadir más países según sea necesario
}

// Latin American countries
export const latinAmericanCountries = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "WORLD", name: "Fuera de Latinoamérica", flag: "🌎" },
]

// Document types by country
export const documentTypesByCountry: Record<string, { code: string; name: string }[]> = {
  PE: [
    { code: "DNI", name: "DNI" },
    { code: "CE", name: "Carnet de Extranjería" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
  CL: [
    { code: "RUT", name: "RUT" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
  MX: [
    { code: "INE", name: "INE/IFE" },
    { code: "CURP", name: "CURP" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
  AR: [
    { code: "DNI", name: "DNI" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
  CO: [
    { code: "CC", name: "Cédula de Ciudadanía" },
    { code: "CE", name: "Cédula de Extranjería" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
  DEFAULT: [
    { code: "ID", name: "Documento de Identidad" },
    { code: "PASSPORT", name: "Pasaporte" },
  ],
}

// Payment methods
export const offlinePaymentMethods = [
  { code: "yape", name: "Yape", icon: "💸" },
  { code: "plin", name: "Plin", icon: "💰" },
  { code: "transfer", name: "Transferencia bancaria", icon: "🏦" },
]

// Installment frequencies
export const installmentFrequencies = [
  { code: "weekly", name: "Semanal" },
  { code: "biweekly", name: "Quincenal" },
  { code: "monthly", name: "Mensual" },
]
