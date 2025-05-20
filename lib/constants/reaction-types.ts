import type { ReactionType } from "@/types/blog"

// Tipos de reacciones válidos
export const VALID_REACTION_TYPES: ReactionType[] = [
  "like",
  "love",
  "haha",
  "wow",
  "sad",
  "angry",
  "hot",
  "crazy",
  "somos",
  "excited",
  "scream",
  "ono",
]

// Mapa para normalizar los tipos de reacciones
export const REACTION_TYPE_MAP: Record<string, ReactionType> = {
  // Variantes básicas
  like: "like",
  Like: "like",
  "👍": "like",
  "like ": "like",
  " like": "like",
  " like ": "like",

  love: "love",
  Love: "love",
  "❤️": "love",
  "love ": "love",
  " love": "love",
  " love ": "love",

  haha: "haha",
  Haha: "haha",
  "😂": "haha",
  "haha ": "haha",
  " haha": "haha",
  " haha ": "haha",

  wow: "wow",
  Wow: "wow",
  "😮": "wow",
  "wow ": "wow",
  " wow": "wow",
  " wow ": "wow",

  sad: "sad",
  Sad: "sad",
  "😢": "sad",
  "sad ": "sad",
  " sad": "sad",
  " sad ": "sad",

  angry: "angry",
  Angry: "angry",
  "😡": "angry",
  "angry ": "angry",
  " angry": "angry",
  " angry ": "angry",

  hot: "hot",
  Hot: "hot",
  "🥵": "hot",
  "hot ": "hot",
  " hot": "hot",
  " hot ": "hot",

  crazy: "crazy",
  Crazy: "crazy",
  "🤪": "crazy",
  "crazy ": "crazy",
  " crazy": "crazy",
  " crazy ": "crazy",

  somos: "somos",
  Somos: "somos",
  "👌": "somos",
  "somos ": "somos",
  " somos": "somos",
  " somos ": "somos",

  excited: "excited",
  Excited: "excited",
  "😈": "excited",
  "excited ": "excited",
  " excited": "excited",
  " excited ": "excited",

  scream: "scream",
  Scream: "scream",
  "🌈": "scream",
  "scream ": "scream",
  " scream": "scream",
  " scream ": "scream",

  ono: "ono",
  Ono: "ono",
  "🌸": "ono",
  "ono ": "ono",
  " ono": "ono",
  " ono ": "ono",
}

// Información de cada tipo de reacción
export const REACTION_INFO = [
  { type: "like" as ReactionType, emoji: "👍", label: "Me gusta" },
  { type: "love" as ReactionType, emoji: "❤️", label: "Me encanta" },
  { type: "haha" as ReactionType, emoji: "😂", label: "Me divierte" },
  { type: "wow" as ReactionType, emoji: "😮", label: "Me sorprende" },
  { type: "sad" as ReactionType, emoji: "😢", label: "Me entristece" },
  { type: "angry" as ReactionType, emoji: "😡", label: "Me enoja" },
  { type: "hot" as ReactionType, emoji: "🥵", label: "Me calienta" },
  { type: "crazy" as ReactionType, emoji: "🤪", label: "Me aloca" },
  { type: "somos" as ReactionType, emoji: "👌", label: "¡Somos, Gente!" },
  { type: "excited" as ReactionType, emoji: "😈", label: "Me excita" },
  { type: "scream" as ReactionType, emoji: "🌈", label: "Me hace gritar ¡Aaaahhh!" },
  { type: "ono" as ReactionType, emoji: "🌸", label: "Oño" },
]

// Función para obtener información de una reacción por su tipo
export function getReactionInfo(type: ReactionType | undefined) {
  if (!type) {
    return REACTION_INFO[0] // Devolver "like" por defecto
  }
  return REACTION_INFO.find((r) => r.type === type) || REACTION_INFO[0]
}
