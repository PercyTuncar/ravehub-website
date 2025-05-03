// ========================
// BLOG MODELS (Added as requested)
// ========================

/**
 * Blog post model optimizado para SEO
 */
export interface BlogPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  featuredImage?: string
  publishDate?: any
  updatedDate?: any
  author?:
    | {
        id?: string
        firstName?: string
        lastName?: string
        name?: string
        avatar?: string
      }
    | string
  category?: {
    id: string
    name: string
    slug: string
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
  readTime?: number
  status?: "draft" | "published"
  seo?: {
    title?: string
    description?: string
    keywords?: string
  }
  imageAltTexts?: { [key: string]: string }
  socialShares?: {
    facebook?: number
    twitter?: number
    linkedin?: number
    whatsapp?: number
    total?: number
  }
  location?: {
    venueName: string
    address: string
    city: string
    region: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
    additionalInfo?: string
  }
  relatedEventId?: string
  relatedPosts?: string[]
  relatedEvents?: string[]
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
  ogType: string
  twitterCardType: string
  canonicalUrl: string
  schemaType: "NewsArticle" | "BlogPosting"
  focusKeyword?: string
  faq?: {
    question: string
    answer: string
  }[]
  translations?: {
    language: string
    translatedContent: string
  }[]
  isAccessibleForFree?: boolean
  categories?: string[]
  categoryName?: string
  mainImageUrl?: string
  authorName?: string
  authorEmail?: string
  authorImageUrl?: string
  videoEmbedUrl?: string
  featured: boolean // Indica si el post es destacado. Seleccionado manualmente.
  featuredOrder?: number // Orden de prioridad para posts destacados. Seleccionado manualmente.
  featuredImageUrl: string // URL de la imagen principal del post. Debe ser ingresada manualmente.
  imageGalleryPost?: Array<{
    url: string
    alt: string
    order: number
    id: string
  }> // Galería de imágenes del post. Se guarda como un array de objetos con URL, texto alternativo y orden.
  commentCount?: number // Número de comentarios en el post. Se genera automáticamente en base a interacciones.
  averageRating?: number // Calificación promedio del post. Se genera automáticamente en base a calificaciones de usuarios.
  viewCount?: number // Número de vistas del post. Se genera automáticamente en base a interacciones.

  // Referencia a comentarios
  comments?: BlogComment[] // Lista de comentarios relacionados con el post.

  // Nuevo campo para reacciones
  reactions?: {
    total: number
    types: {
      [key in ReactionType]?: number
    }
  }
}

/**
 * Blog category model
 */
export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  imageUrl?: string
  order?: string | number
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
  parentCategoryId?: string
  seoTitle?: string
  seoDescription?: string
  metaKeywords?: string[]
}

/**
 * Modelo para los comentarios relacionados con un post.
 */
export interface BlogComment {
  id: string // Identificador único del comentario.
  postId: string // ID del post al que pertenece el comentario.
  parentCommentId?: string // ID del comentario padre (si es una respuesta a otro comentario).
  name: string // Nombre del autor del comentario.
  email: string // Email del autor del comentario.
  content: string // Contenido del comentario.
  createdAt: Date // Fecha de creación del comentario.
  updatedAt?: Date // Fecha de última actualización (si el comentario fue editado).
  likes: number // Número total de likes en el comentario.
  likedBy?: string[] // Lista de IDs de usuarios que han dado like al comentario.
  replies?: BlogComment[] // Lista de respuestas asociadas al comentario.
  isEditable: boolean // Indica si el comentario puede ser editado por el autor.
  isDeletable: boolean // Indica si el comentario puede ser eliminado por el autor o un administrador.
  userCommentCount: number // Número de comentarios realizados por el usuario en este post.
  userReplyCount: number // Número de respuestas realizadas por el usuario en este post.
  isPinned: boolean // Indica si el comentario está fijado en la parte superior.
}

/**
 * Tipos de reacciones disponibles para los posts
 */
export type ReactionType =
  | "hot" // Me calienta 🥵
  | "crazy" // Me aloca 🤪
  | "somos" // ¡Somos, Gente! 👌
  | "excited" // Me excita 😈
  | "scream" // Me hace gritar ¡Aaaahhh! 🌈
  | "ono" // Oño 🌸
  | "like" // Me gusta 👍
  | "love" // Me encanta ❤️
  | "haha" // Me divierte 😂
  | "wow" // Me sorprende 😮
  | "sad" // Me entristece 😢
  | "angry" // Me enoja 😡

/**
 * Modelo para las reacciones de los usuarios a los posts
 */
export interface PostReaction {
  id: string
  postId: string
  userId: string
  userName: string
  userImageUrl?: string
  reactionType: ReactionType
  createdAt: Date
}

/**
 * Información de reacciones para un post
 */
export interface PostReactionsSummary {
  total: number
  types: {
    [key in ReactionType]?: number
  }
  topReactions: ReactionType[]
  userReaction?: ReactionType
}

/**
 * Información detallada de reacciones para un post
 */
export interface PostReactionsDetail {
  summary: PostReactionsSummary
  reactions: PostReaction[]
}

/**
 * Modelo para etiquetas del blog optimizado para SEO
 */
export interface BlogTag {
  id: string // Identificador único de la etiqueta
  name: string // Nombre de la etiqueta
  slug: string // Versión amigable del nombre para URLs
  description?: string // Descripción detallada de la etiqueta
  imageUrl?: string // Imagen representativa de la etiqueta
  color?: string // Color asociado a la etiqueta (para UI)
  postCount: number // Número de posts que usan esta etiqueta
  createdAt: Date // Fecha de creación
  updatedAt: Date // Fecha de última actualización
  isActive: boolean // Si la etiqueta está activa o no

  // SEO fields
  seoTitle?: string // Título optimizado para SEO
  seoDescription?: string // Descripción optimizada para SEO
  metaKeywords?: string[] // Palabras clave adicionales para SEO

  // Relaciones
  relatedTags?: string[] // IDs de etiquetas relacionadas
  parentTagId?: string // ID de la etiqueta padre (para jerarquías)

  // Campos adicionales
  icon?: string // Ícono asociado a la etiqueta
  featured?: boolean // Si la etiqueta debe destacarse en la UI
  featuredOrder?: number // Orden de prioridad si es destacada
}

/**
 * Modelo para calificaciones de posts
 */
export interface BlogRating {
  id: string
  postId: string
  userId: string
  userName: string
  rating: number // 1-5
  comment?: string
  createdAt: Date
  updatedAt?: Date
}
