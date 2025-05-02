export interface Event {
  id: string
  name: string
  slug: string
  shortDescription: string
  description: string
  startDate: Date
  startTime: string
  endDate?: Date
  endTime?: string
  isMultiDay: boolean
  categories: string[]
  tags: string[]
  mainImageUrl: string
  bannerImageUrl?: string
  location: {
    venueName: string
    address: string
    streetAddress?: string
    city: string
    region?: string
    country: string
    postalCode?: string
    latitude: number
    longitude: number
    additionalInfo?: string
  }
  artistLineup: Artist[]
  zones: Zone[]
  salesPhases: SalesPhase[]
  status: "draft" | "published" | "cancelled" | "completed"
  sellTicketsOnPlatform: boolean
  externalTicketUrl?: string
  allowOfflinePayments: boolean
  allowInstallmentPayments: boolean
  isHighlighted: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string
  specifications?: { name: string; value: string }[]
  reviews?: { userName: string; rating: number; comment: string; date: Date }[]
  // New fields for JSON-LD
  inLanguage?: string
  datePublished?: Date
  dateModified?: Date
  eventStatus?: string
  eventAttendanceMode?: string
  organizer?: {
    name: string
    url: string
  }
  subEvents?: SubEvent[]
  offers?: Offer[]
  faqSection?: {
    question: string
    answer: string
  }[]
  [key: string]: any
}

export interface SubEvent {
  name: string
  description: string
  startDate: Date
  endDate: Date
}

export interface Offer {
  name: string
  price: number
  url: string
  availability: string
  priceCurrency: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  phonePrefix: string
  country: string
  documentType: string
  documentNumber: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  role: "user" | "admin"
  avatar?: string
  preferredCurrency: string
  authProvider?: "email" | "google" | "facebook" | "apple" // Nuevo campo para el proveedor de autenticación
  [key: string]: any
}

export interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string
  description: string
  categoryId: string
  price: number
  currency: string
  discountPercentage?: number
  stock: number
  images: string[]
  // Nuevos campos para gestión de medios
  videos?: ProductVideo[]
  mediaOrder?: string[] // Array de IDs de imágenes y videos para controlar el orden
  hasVariants: boolean
  variants: ProductVariant[]
  gender: "male" | "female" | "unisex"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  sku?: string
  specifications?: { name: string; value: string }[]
  reviews?: { userName: string; rating: number; comment: string; date: Date }[]
  imagesAltTexts?: Record<string, string>
  isHighlighted?: boolean
  // New fields
  eligibleRegions?: string[]
  videoUrl?: string
  shippingDetails?: {
    shippingRate: number
    shippingCurrency: string
    eligibleRegion: string
  }
  brand?: string
  [key: string]: any
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  imageAltText?: string
  order: number
  isActive: boolean
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  createdAt?: Date
  updatedAt?: Date
  isSubcategory?: boolean
  parentCategoryId?: string
  subcategories?: string[] // Array of subcategory IDs
  [key: string]: any
}

export interface Order {
  id: string
  userId: string
  orderDate: Date
  totalAmount: number
  currency: string
  status: "pending" | "approved" | "shipping" | "delivered" | "cancelled"
  paymentMethod: "online" | "offline"
  offlinePaymentMethod?: "yape" | "plin" | "transfer"
  paymentProofUrl?: string
  shippingAddress: Address
  shippingCost: number
  notes?: string
  orderItems: OrderItem[]
  paymentStatus: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewedAt?: Date
  ticketsDownloadAvailableDate?: Date
  trackingNumber?: string
  expectedDeliveryDate?: Date
  isCourtesy?: boolean
  numberOfInstallments?: number
  installmentFrequency?: "weekly" | "biweekly" | "monthly"
  allInstallmentsPaid?: boolean
  [key: string]: any
}

export interface TicketTransaction {
  id: string
  userId: string
  eventId: string
  createdAt: Date
  totalAmount: number
  currency: string
  paymentMethod: "online" | "offline"
  paymentStatus: "pending" | "approved" | "rejected"
  paymentType: "full" | "installment"
  offlinePaymentMethod?: "yape" | "plin" | "transfer"
  paymentProofUrl?: string
  ticketItems: TicketItem[]
  numberOfInstallments?: number
  installmentFrequency?: "weekly" | "biweekly" | "monthly"
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: Date
  ticketsDownloadAvailableDate?: Date
  isCourtesy?: boolean
  installments?: PaymentInstallment[]
  user?: User
  event?: Event
  [key: string]: any
}

export interface Artist {
  id: string
  name: string
  imageUrl: string
  description: string
  instagramHandle?: string
  spotifyUrl?: string
  soundcloudUrl?: string
  order: number
  [key: string]: any
}

export interface Zone {
  id: string
  eventId: string
  name: string
  capacity: number
  description?: string
  isActive: boolean
  [key: string]: any
}

export interface SalesPhase {
  id: string
  eventId: string
  name: string
  isActive: boolean
  startDate: Date
  endDate: Date
  zonesPricing: ZonePricing[]
  [key: string]: any
}

export interface PaymentInstallment {
  id: string
  transactionId: string
  installmentNumber: number
  amount: number
  currency: string
  dueDate: Date
  status: "pending" | "paid" | "overdue" | "cancelled"
  paymentProofUrl?: string
  paymentDate?: Date
  adminApproved: boolean
  approvedBy?: string
  approvedAt?: Date
  notes?: string
  transaction?: TicketTransaction
  user?: User
  [key: string]: any
}

export interface ProductVariant {
  id: string
  productId: string
  type: "size" | "color" | "style"
  name: string
  additionalPrice: number
  stock: number
  sku: string
  imageUrl?: string
  isActive: boolean
  [key: string]: any
}

export interface ZonePricing {
  zoneId: string
  phaseId: string
  price: number
  available: number
  sold: number
  [key: string]: any
}

export interface TicketItem {
  id: string
  transactionId: string
  eventId: string
  zoneId: string
  phaseId: string
  price: number
  currency: string
  status: "pending" | "approved" | "rejected" | "cancelled" | "used"
  isNominated: boolean
  nomineeFirstName?: string
  nomineeLastName?: string
  nomineeDocType?: string
  nomineeDocNumber?: string
  createdAt: Date
  updatedAt: Date
  ticketPdfUrl?: string
  zone?: Zone
  [key: string]: any
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId?: string
  quantity: number
  pricePerUnit: number
  currency: string
  subtotal: number
  product?: Product
  [key: string]: any
}

export interface Address {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
  [key: string]: any
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  featuredImage?: string
  publishDate?: any // Puede ser Date, string, timestamp de Firestore, etc.
  updatedAt?: any
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
}

// Nueva interfaz para las reseñas de productos
export interface ProductReview {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment?: string
  approved: boolean
  createdAt: Date
  approvedBy?: string
  approvedAt?: Date
  title?: string
  purchaseVerified?: boolean
  helpfulCount?: number
  reportCount?: number
  [key: string]: any
}

// Añadir esta nueva interfaz después de las demás
export interface ProductVideo {
  id: string
  url: string // URL del video (YouTube, Vimeo, etc.)
  thumbnailUrl: string // URL de la miniatura
  isExternal: boolean // Indica si es un enlace externo o un video subido
  provider?: string // 'youtube', 'vimeo', 'local', etc.
  videoId?: string // ID del video en la plataforma (para YouTube, Vimeo)
  title?: string // Título del video
  description?: string // Descripción del video
  order?: number // Orden de aparición
}

// Añadir la interfaz StoreBanner después de las demás interfaces
export interface StoreBanner {
  id: string
  title: string
  description: string
  linkUrl: string
  price: number
  hasDiscount: boolean
  discountPercentage?: number
  mediaType: "image" | "video"
  mediaUrl: string
  videoProvider?: "youtube" | "vimeo" | "other"
  videoId?: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  [key: string]: any
}

// Nueva interfaz para los CTAs personalizados
export interface EventCTA {
  id: string
  title: string
  description: string
  eventId: string
  contactType: "whatsapp" | "link"
  contactValue: string
  hasCountdown: boolean
  countdownEndDate?: Date
  isActive: boolean
  styles: {
    backgroundColor: string
    backgroundGradient?: string
    titleColor: string
    descriptionColor: string
    buttonColor: string
    buttonTextColor: string
    countdownColor?: string
    countdownNumbersColor?: string
    countdownLabelsColor?: string
  }
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy?: string
}
