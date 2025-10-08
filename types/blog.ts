import { Timestamp } from "firebase/firestore"

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
  tags?: BlogTag[]
  author?: Author | string
  publishDate: Date | Timestamp
  updatedDate?: Date | Timestamp
  status: "draft" | "published" | "archived"
  isFeatured?: boolean
  viewCount?: number
  featuredImage?: string
  featuredImageUrl?: string
  mainImageUrl?: string
  category?: BlogCategory
  categoryId?: string
  categoryName?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  relatedPosts?: string[]
  comments?: BlogComment[]
  ratings?: BlogRating[]
  averageRating?: number
  ratingCount?: number
  reactions?: PostReactionsSummary
  socialShares?: SocialShares
  isNewsArticle?: boolean
  schemaType?: "BlogPosting" | "NewsArticle" | "Event" | "Review" | "HowTo"
  contentType?: "blog" | "news" | "event" | "review" | "guide"
  ogType?: "article" | "event"
  twitterCardType?: "summary" | "summary_large_image"
  twitterCreator?: string;
  canonicalUrl?: string
  authorName?: string
  authorSlug?: string
  authorUrl?: string
  authorImageUrl?: string
  authorJobTitle?: string
  faqItems?: { question: string; answer: string }[]
  videoUrl?: string
  videoTitle?: string
  videoDescription?: string
  videoThumbnail?: string
  videoEmbedUrl?: string
  videoDuration?: string
  isEventPost?: boolean
  eventDetails?: EventDetails
  imageGalleryPost?: any[];
  imageAltTexts?: {[key: string]: string};
}

export interface EventDetails {
  name: string
  description: string
  startDate: Date | Timestamp
  endDate?: Date | Timestamp
  venueName: string
  city: string
  region?: string
  country: string
  imageUrl?: string
  performer?: string
  organizer?: string
  organizerUrl?: string
  price?: string
  currency?: string
  ticketUrl?: string
}

export interface SocialShares {
  total: number
  facebook?: number
  twitter?: number
  linkedin?: number
  whatsapp?: number
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

/**
 * Model for comment reactions
 */
export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  userName: string
  userImageUrl?: string
  reactionType: CommentReactionType
  createdAt: Date
}

/**
 * Tipos de reacciones disponibles para los comentarios
 */
export type CommentReactionType =
  | "like" // Me gusta 👍
  | "love" // Me encanta ❤️
  | "haha" // Me divierte 😂
  | "wow" // Me sorprende 😮
  | "sad" // Me entristece 😢
  | "angry" // Me enoja 😡

export interface Author {
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: string
}
