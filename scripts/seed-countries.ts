import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

const countries = [
  // América del Sur
  { name: "Argentina", code: "AR", region: "América del Sur", flag: "🇦🇷" },
  { name: "Bolivia", code: "BO", region: "América del Sur", flag: "🇧🇴" },
  { name: "Brasil", code: "BR", region: "América del Sur", flag: "🇧🇷" },
  { name: "Chile", code: "CL", region: "América del Sur", flag: "🇨🇱" },
  { name: "Colombia", code: "CO", region: "América del Sur", flag: "🇨🇴" },
  { name: "Ecuador", code: "EC", region: "América del Sur", flag: "🇪🇨" },
  { name: "Guyana", code: "GY", region: "América del Sur", flag: "🇬🇾" },
  { name: "Paraguay", code: "PY", region: "América del Sur", flag: "🇵🇾" },
  { name: "Perú", code: "PE", region: "América del Sur", flag: "🇵🇪" },
  { name: "Surinam", code: "SR", region: "América del Sur", flag: "🇸🇷" },
  { name: "Uruguay", code: "UY", region: "América del Sur", flag: "🇺🇾" },
  { name: "Venezuela", code: "VE", region: "América del Sur", flag: "🇻🇪" },

  // América Central
  { name: "Belice", code: "BZ", region: "América Central", flag: "🇧🇿" },
  { name: "Costa Rica", code: "CR", region: "América Central", flag: "🇨🇷" },
  { name: "El Salvador", code: "SV", region: "América Central", flag: "🇸🇻" },
  { name: "Guatemala", code: "GT", region: "América Central", flag: "🇬🇹" },
  { name: "Honduras", code: "HN", region: "América Central", flag: "🇭🇳" },
  { name: "Nicaragua", code: "NI", region: "América Central", flag: "🇳🇮" },
  { name: "Panamá", code: "PA", region: "América Central", flag: "🇵🇦" },

  // América del Norte
  { name: "Canadá", code: "CA", region: "América del Norte", flag: "🇨🇦" },
  { name: "Estados Unidos", code: "US", region: "América del Norte", flag: "🇺🇸" },
  { name: "México", code: "MX", region: "América del Norte", flag: "🇲🇽" },

  // Europa
  { name: "Alemania", code: "DE", region: "Europa", flag: "🇩🇪" },
  { name: "España", code: "ES", region: "Europa", flag: "🇪🇸" },
  { name: "Francia", code: "FR", region: "Europa", flag: "🇫🇷" },
  { name: "Italia", code: "IT", region: "Europa", flag: "🇮🇹" },
  { name: "Reino Unido", code: "GB", region: "Europa", flag: "🇬🇧" },
  { name: "Portugal", code: "PT", region: "Europa", flag: "🇵🇹" },
  { name: "Países Bajos", code: "NL", region: "Europa", flag: "🇳🇱" },
  { name: "Bélgica", code: "BE", region: "Europa", flag: "🇧🇪" },
  { name: "Suecia", code: "SE", region: "Europa", flag: "🇸🇪" },
  { name: "Noruega", code: "NO", region: "Europa", flag: "🇳🇴" },
  { name: "Dinamarca", code: "DK", region: "Europa", flag: "🇩🇰" },
  { name: "Finlandia", code: "FI", region: "Europa", flag: "🇫🇮" },
  { name: "Irlanda", code: "IE", region: "Europa", flag: "🇮🇪" },
  { name: "Austria", code: "AT", region: "Europa", flag: "🇦🇹" },
  { name: "Suiza", code: "CH", region: "Europa", flag: "🇨🇭" },
  { name: "Polonia", code: "PL", region: "Europa", flag: "🇵🇱" },
  { name: "Rumania", code: "RO", region: "Europa", flag: "🇷🇴" },
  { name: "Grecia", code: "GR", region: "Europa", flag: "🇬🇷" },
  { name: "Turquía", code: "TR", region: "Europa", flag: "🇹🇷" },
  { name: "Croacia", code: "HR", region: "Europa", flag: "🇭🇷" },
  { name: "Serbia", code: "RS", region: "Europa", flag: "🇷🇸" },
  { name: "Bulgaria", code: "BG", region: "Europa", flag: "🇧🇬" },
  { name: "Hungría", code: "HU", region: "Europa", flag: "🇭🇺" },
  { name: "República Checa", code: "CZ", region: "Europa", flag: "🇨🇿" },
  { name: "Eslovaquia", code: "SK", region: "Europa", flag: "🇸🇰" },
  { name: "Eslovenia", code: "SI", region: "Europa", flag: "🇸🇮" },
  { name: "Estonia", code: "EE", region: "Europa", flag: "🇪🇪" },
  { name: "Letonia", code: "LV", region: "Europa", flag: "🇱🇻" },
  { name: "Lituania", code: "LT", region: "Europa", flag: "🇱🇹" },
  { name: "Islandia", code: "IS", region: "Europa", flag: "🇮🇸" },
  { name: "Malta", code: "MT", region: "Europa", flag: "🇲🇹" },
  { name: "Chipre", code: "CY", region: "Europa", flag: "🇨🇾" },
  { name: "Luxemburgo", code: "LU", region: "Europa", flag: "🇱🇺" },
  { name: "Mónaco", code: "MC", region: "Europa", flag: "🇲🇨" },
  { name: "Liechtenstein", code: "LI", region: "Europa", flag: "🇱🇮" },
  { name: "San Marino", code: "SM", region: "Europa", flag: "🇸🇲" },
  { name: "Andorra", code: "AD", region: "Europa", flag: "🇦🇩" },
  { name: "Albania", code: "AL", region: "Europa", flag: "🇦🇱" },
  { name: "Macedonia del Norte", code: "MK", region: "Europa", flag: "🇲🇰" },
  { name: "Montenegro", code: "ME", region: "Europa", flag: "🇲🇪" },
  { name: "Bosnia y Herzegovina", code: "BA", region: "Europa", flag: "🇧🇦" },
  { name: "Kosovo", code: "XK", region: "Europa", flag: "🇽🇰" },

  // Asia
  { name: "China", code: "CN", region: "Asia", flag: "🇨🇳" },
  { name: "Japón", code: "JP", region: "Asia", flag: "🇯🇵" },
  { name: "Corea del Sur", code: "KR", region: "Asia", flag: "🇰🇷" },
  { name: "India", code: "IN", region: "Asia", flag: "🇮🇳" },
  { name: "Tailandia", code: "TH", region: "Asia", flag: "🇹🇭" },
  { name: "Vietnam", code: "VN", region: "Asia", flag: "🇻🇳" },
  { name: "Indonesia", code: "ID", region: "Asia", flag: "🇮🇩" },
  { name: "Malasia", code: "MY", region: "Asia", flag: "🇲🇾" },
  { name: "Singapur", code: "SG", region: "Asia", flag: "🇸🇬" },
  { name: "Filipinas", code: "PH", region: "Asia", flag: "🇵🇭" },
  { name: "Rusia", code: "RU", region: "Asia", flag: "🇷🇺" },
  { name: "Arabia Saudita", code: "SA", region: "Asia", flag: "🇸🇦" },
  { name: "Emiratos Árabes Unidos", code: "AE", region: "Asia", flag: "🇦🇪" },
  { name: "Israel", code: "IL", region: "Asia", flag: "🇮🇱" },
  { name: "Corea del Norte", code: "KP", region: "Asia", flag: "🇰🇵" },
  { name: "Taiwán", code: "TW", region: "Asia", flag: "🇹🇼" },
  { name: "Bangladés", code: "BD", region: "Asia", flag: "🇧🇩" },
  { name: "Pakistán", code: "PK", region: "Asia", flag: "🇵🇰" },
  { name: "Sri Lanka", code: "LK", region: "Asia", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", region: "Asia", flag: "🇳🇵" },
  { name: "Bután", code: "BT", region: "Asia", flag: "🇧🇹" },
  { name: "Maldivas", code: "MV", region: "Asia", flag: "🇲🇻" },
  { name: "Irán", code: "IR", region: "Asia", flag: "🇮🇷" },
  { name: "Irak", code: "IQ", region: "Asia", flag: "🇶" },
  { name: "Jordania", code: "JO", region: "Asia", flag: "🇯🇴" },
  { name: "Líbano", code: "LB", region: "Asia", flag: "🇧" },
  { name: "Siria", code: "SY", region: "Asia", flag: "🇸🇾" },
  { name: "Kuwait", code: "KW", region: "Asia", flag: "🇰🇼" },
  { name: "Baréin", code: "BH", region: "Asia", flag: "🇧🇭" },
  { name: "Catar", code: "QA", region: "Asia", flag: "🇶🇦" },
  { name: "Omán", code: "OM", region: "Asia", flag: "🇴🇲" },
  { name: "Yemen", code: "YE", region: "Asia", flag: "🇾🇪" },
  { name: "Georgia", code: "GE", region: "Asia", flag: "🇬🇪" },
  { name: "Armenia", code: "AM", region: "Asia", flag: "🇦🇲" },
  { name: "Azerbaiyán", code: "AZ", region: "Asia", flag: "🇦🇿" },
  { name: "Kazajistán", code: "KZ", region: "Asia", flag: "🇰🇿" },
  { name: "Kirguistán", code: "KG", region: "Asia", flag: "🇰🇬" },
  { name: "Tayikistán", code: "TJ", region: "Asia", flag: "🇹🇯" },
  { name: "Turkmenistán", code: "TM", region: "Asia", flag: "🇹🇲" },
  { name: "Uzbekistán", code: "UZ", region: "Asia", flag: "🇺🇿" },
  { name: "Mongolia", code: "MN", region: "Asia", flag: "🇲🇳" },
  { name: "Afganistán", code: "AF", region: "Asia", flag: "🇦🇫" },
  { name: "Laos", code: "LA", region: "Asia", flag: "🇱🇦" },
  { name: "Camboya", code: "KH", region: "Asia", flag: "🇰🇭" },
  { name: "Myanmar", code: "MM", region: "Asia", flag: "🇲🇲" },
  { name: "Brunéi", code: "BN", region: "Asia", flag: "🇧🇳" },
  { name: "Timor Oriental", code: "TL", region: "Asia", flag: "🇹🇱" },

  // África
  { name: "Egipto", code: "EG", region: "África", flag: "🇪🇬" },
  { name: "Marruecos", code: "MA", region: "África", flag: "🇲🇦" },
  { name: "Sudáfrica", code: "ZA", region: "África", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", region: "África", flag: "🇳🇬" },
  { name: "Kenia", code: "KE", region: "África", flag: "🇰🇪" },
  { name: "Ghana", code: "GH", region: "África", flag: "🇬🇭" },
  { name: "Senegal", code: "SN", region: "África", flag: "🇸🇳" },
  { name: "Tanzania", code: "TZ", region: "África", flag: "🇹🇿" },
  { name: "Argelia", code: "DZ", region: "África", flag: "🇩🇿" },
  { name: "Túnez", code: "TN", region: "África", flag: "🇹🇳" },
  { name: "Libia", code: "LY", region: "África", flag: "🇱🇾" },
  { name: "Etiopía", code: "ET", region: "África", flag: "🇪" },
  { name: "Sudán", code: "SD", region: "África", flag: "🇸🇩" },
  { name: "Uganda", code: "UG", region: "África", flag: "🇺🇬" },
  { name: "Ruanda", code: "RW", region: "África", flag: "🇷🇼" },
  { name: "Burundi", code: "BI", region: "África", flag: "🇧🇮" },
  { name: "Zimbabue", code: "ZW", region: "África", flag: "�🇼" },
  { name: "Zambia", code: "ZM", region: "África", flag: "🇿🇲" },
  { name: "Malaui", code: "MW", region: "África", flag: "🇲🇼" },
  { name: "Mozambique", code: "MZ", region: "África", flag: "🇲🇿" },
  { name: "Angola", code: "AO", region: "África", flag: "🇦🇴" },
  { name: "Namibia", code: "NA", region: "África", flag: "🇳🇦" },
  { name: "Botsuana", code: "BW", region: "África", flag: "🇧🇼" },
  { name: "Suazilandia", code: "SZ", region: "África", flag: "🇸🇿" },
  { name: "Lesoto", code: "LS", region: "África", flag: "🇱🇸" },
  { name: "Costa de Marfil", code: "CI", region: "África", flag: "🇨🇮" },
  { name: "Camerún", code: "CM", region: "África", flag: "🇨🇲" },
  { name: "República del Congo", code: "CG", region: "África", flag: "🇨🇬" },
  { name: "República Democrática del Congo", code: "CD", region: "África", flag: "🇨🇩" },
  { name: "Gabón", code: "GA", region: "África", flag: "🇬🇦" },
  { name: "Guinea Ecuatorial", code: "GQ", region: "África", flag: "🇬🇶" },
  { name: "Chad", code: "TD", region: "África", flag: "🇹🇩" },
  { name: "República Centroafricana", code: "CF", region: "África", flag: "🇨🇫" },
  { name: "Sudán del Sur", code: "SS", region: "África", flag: "🇸🇸" },
  { name: "Somalia", code: "SO", region: "África", flag: "🇸🇴" },
  { name: "Yibuti", code: "DJ", region: "África", flag: "🇩🇯" },
  { name: "Eritrea", code: "ER", region: "África", flag: "🇪🇷" },
  { name: "Mali", code: "ML", region: "África", flag: "🇲🇱" },
  { name: "Níger", code: "NE", region: "África", flag: "🇳🇪" },
  { name: "Burkina Faso", code: "BF", region: "África", flag: "🇧🇫" },
  { name: "Guinea", code: "GN", region: "África", flag: "🇬🇳" },
  { name: "Sierra Leona", code: "SL", region: "África", flag: "🇸🇱" },
  { name: "Liberia", code: "LR", region: "África", flag: "🇱🇷" },
  { name: "Mauritania", code: "MR", region: "África", flag: "🇲🇷" },
  { name: "Gambia", code: "GM", region: "África", flag: "🇬🇲" },
  { name: "Guinea-Bisáu", code: "GW", region: "África", flag: "🇬🇼" },
  { name: "Cabo Verde", code: "CV", region: "África", flag: "🇨🇻" },
  { name: "Santo Tomé y Príncipe", code: "ST", region: "África", flag: "🇸🇹" },
  { name: "Seychelles", code: "SC", region: "África", flag: "🇸🇨" },
  { name: "Comoras", code: "KM", region: "África", flag: "🇰🇲" },
  { name: "Mauricio", code: "MU", region: "África", flag: "🇲🇺" },
  { name: "Madagascar", code: "MG", region: "África", flag: "🇲🇬" },
  { name: "Zanzíbar", code: "ZZ", region: "África", flag: "🇹🇿" },

  // Oceanía
  { name: "Australia", code: "AU", region: "Oceanía", flag: "🇦🇺" },
  { name: "Nueva Zelanda", code: "NZ", region: "Oceanía", flag: "🇳🇿" },
  { name: "Fiji", code: "FJ", region: "Oceanía", flag: "🇫🇯" },
  { name: "Samoa", code: "WS", region: "Oceanía", flag: "🇼🇸" },
  { name: "Tonga", code: "TO", region: "Oceanía", flag: "🇹🇴" },
  { name: "Vanuatu", code: "VU", region: "Oceanía", flag: "🇻🇺" },
  { name: "Islas Salomón", code: "SB", region: "Oceanía", flag: "🇸🇧" },
  { name: "Kiribati", code: "KI", region: "Oceanía", flag: "🇰🇮" },
  { name: "Tuvalu", code: "TV", region: "Oceanía", flag: "🇹🇻" },
  { name: "Nauru", code: "NR", region: "Oceanía", flag: "🇳🇷" },
  { name: "Palaos", code: "PW", region: "Oceanía", flag: "🇵🇼" },
  { name: "Estados Federados de Micronesia", code: "FM", region: "Oceanía", flag: "🇫🇲" },
  { name: "Islas Marshall", code: "MH", region: "Oceanía", flag: "🇲🇭" },
  { name: "Papúa Nueva Guinea", code: "PG", region: "Oceanía", flag: "🇵🇬" },

  // Caribe
  { name: "Cuba", code: "CU", region: "Caribe", flag: "🇨🇺" },
  { name: "Jamaica", code: "JM", region: "Caribe", flag: "🇯🇲" },
  { name: "Haití", code: "HT", region: "Caribe", flag: "🇭🇹" },
  { name: "República Dominicana", code: "DO", region: "Caribe", flag: "🇩🇴" },
  { name: "Puerto Rico", code: "PR", region: "Caribe", flag: "🇵🇷" },
  { name: "Trinidad y Tobago", code: "TT", region: "Caribe", flag: "🇹🇹" },
  { name: "Barbados", code: "BB", region: "Caribe", flag: "🇧🇧" },
  { name: "Bahamas", code: "BS", region: "Caribe", flag: "🇧🇸" },
  { name: "Santa Lucía", code: "LC", region: "Caribe", flag: "🇱🇨" },
  { name: "San Vicente y las Granadinas", code: "VC", region: "Caribe", flag: "🇻🇨" },
  { name: "Granada", code: "GD", region: "Caribe", flag: "🇬🇩" },
  { name: "Antigua y Barbuda", code: "AG", region: "Caribe", flag: "🇦🇬" },
  { name: "San Cristóbal y Nieves", code: "KN", region: "Caribe", flag: "🇰🇳" },
  { name: "Dominica", code: "DM", region: "Caribe", flag: "🇩🇲" },
  { name: "San Martín", code: "MF", region: "Caribe", flag: "🇲🇫" },
  { name: "Guadalupe", code: "GP", region: "Caribe", flag: "🇬🇵" },
  { name: "Martinica", code: "MQ", region: "Caribe", flag: "🇲🇶" },
  { name: "Aruba", code: "AW", region: "Caribe", flag: "🇦🇼" },
  { name: "Curazao", code: "CW", region: "Caribe", flag: "🇨🇼" },
  { name: "Bonaire", code: "BQ", region: "Caribe", flag: "🇧🇶" },
  { name: "Saba", code: "BQ", region: "Caribe", flag: "🇧🇶" },
  { name: "San Eustaquio", code: "BQ", region: "Caribe", flag: "🇧🇶" },
  { name: "Islas Vírgenes Británicas", code: "VG", region: "Caribe", flag: "🇻🇬" },
  { name: "Islas Vírgenes de los Estados Unidos", code: "VI", region: "Caribe", flag: "🇻🇮" },
  { name: "Islas Caimán", code: "KY", region: "Caribe", flag: "🇰🇾" },
  { name: "Islas Turcas y Caicos", code: "TC", region: "Caribe", flag: "🇹🇨" },
  { name: "Bermudas", code: "BM", region: "Caribe", flag: "🇧🇲" },
  { name: "Anguila", code: "AI", region: "Caribe", flag: "🇦🇮" },
  { name: "Montserrat", code: "MS", region: "Caribe", flag: "🇲�" },
]

async function seedCountries() {
  console.log("🌍 Iniciando seed de países...")

  try {
    const countriesRef = collection(db, "countries")

    for (const country of countries) {
      // Check if country already exists
      const existingQuery = query(countriesRef, where("code", "==", country.code))
      const existingSnapshot = await getDocs(existingQuery)

      if (!existingSnapshot.empty) {
        console.log(`⏭️  País ${country.name} ya existe, saltando...`)
        continue
      }

      console.log(`Agregando ${country.name}...`)
      await addDoc(countriesRef, {
        ...country,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    console.log("✅ Seed de países completado exitosamente!")
  } catch (error) {
    console.error("❌ Error durante el seed de países:", error)
    throw error
  }
}

// Ejecutar el seed
seedCountries()
  .then(() => {
    console.log("🎉 Proceso completado!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error)
    process.exit(1)
  })