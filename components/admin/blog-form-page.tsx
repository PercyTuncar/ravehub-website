"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { v4 as uuidv4 } from "uuid"
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { getDocs, query, where } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { db, storage } from "@/lib/firebase/config"
import type { BlogPost } from "@/types/blog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Editor } from "@/components/admin/editor"
import { ImageUploader } from "@/components/admin/image-uploader"
import { CategorySelect } from "@/components/admin/category-select"
import { SeoPreview } from "@/components/admin/seo-preview"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PlusCircle, Search, Trash2, Code, AlertCircle, Plus, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { ImageGalleryUploader } from "@/components/admin/image-gallery-uploader"
import Link from "next/link"

// Añadir la importación de la función createSlugRedirect
import { createSlugRedirect, getSlugRedirects, deleteSlugRedirect } from "@/lib/firebase/slug-redirects"

interface BlogFormPageProps {
  postId?: string
  isEditing: boolean
}

interface GalleryImage {
  url: string
  alt: string
  id: string
}

// Define mapeos constantes para mantener la coherencia en todo el código
const CONTENT_TYPE_MAPPINGS = {
  blog: {
    schemaType: "BlogPosting",
    ogType: "article",
  },
  news: {
    schemaType: "NewsArticle",
    ogType: "article",
  },
  event: {
    schemaType: "Event",
    ogType: "event",
  },
  review: {
    schemaType: "Review",
    ogType: "article",
  },
  guide: {
    schemaType: "HowTo",
    ogType: "article",
  },
}

// Función para derivar el tipo de contenido a partir del tipo de esquema
const deriveContentTypeFromSchema = (schemaType: string): string => {
  switch (schemaType) {
    case "NewsArticle":
      return "news"
    case "Event":
      return "event"
    case "Review":
      return "review"
    case "HowTo":
      return "guide"
    case "BlogPosting":
    default:
      return "blog"
  }
}

export default function BlogFormPage({ postId, isEditing }: BlogFormPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const [showJsonLd, setShowJsonLd] = useState(false)
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    author: "",
    authorId: "",
    authorEmail: "",
    authorImageUrl: "",
    coAuthors: [],
    publishDate: new Date().toISOString(),
    status: "draft",
    featured: false,
    featuredOrder: 0,
    featuredImageUrl: "",
    categories: [],
    tags: [], // Will now store full tag objects instead of just names
    readTime: 0,
    videoEmbedUrl: "",
    imageAltTexts: {},
    socialShares: {
      facebook: 0,
      twitter: 0,
      linkedin: 0,
      whatsapp: 0,
    },
    location: {
      city: "",
      country: "",
      venueName: "",
    },
    relatedEventId: "",
    relatedPosts: [],
    relatedEvents: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    ogType: "article", // Default OG type
    twitterCardType: "summary_large_image",
    socialImageUrl: "",
    canonicalUrl: "",
    schemaType: "BlogPosting", // Default Schema type
    contentType: "blog", // Default content type
    focusKeyword: "",
    faq: [],
    translations: [],
    isAccessibleForFree: true,
  })

  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [mode, setMode] = useState<"markdown" | "html">(post.contentFormat === "html" ? "html" : "markdown")

  // State for FAQ management
  const [newFaqQuestion, setNewFaqQuestion] = useState("")
  const [newFaqAnswer, setNewFaqAnswer] = useState("")

  // State for translation management
  const [newTranslationLanguage, setNewTranslationLanguage] = useState("")
  const [newTranslationContent, setNewTranslationContent] = useState("")

  // State for tag management
  const [newTag, setNewTag] = useState("")

  // State for coAuthor management
  const [newCoAuthor, setNewCoAuthor] = useState("")

  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false)
  const tagsDropdownRef = useRef<HTMLDivElement>(null)

  // SEO validation info
  const [seoIssues, setSeoIssues] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState(0)
  const [showSeoIssues, setShowSeoIssues] = useState(false)

  // Añadir estado para las redirecciones existentes
  const [existingRedirects, setExistingRedirects] = useState<any[]>([])
  const [loadingRedirects, setLoadingRedirects] = useState(false)

  // Añadir estos estados para el formulario de redirección manual
  const [manualRedirectSlug, setManualRedirectSlug] = useState("")
  const [isAddingManualRedirect, setIsAddingManualRedirect] = useState(false)

  useEffect(() => {
    if (isEditing && postId) {
      const fetchPost = async () => {
        setLoading(true)
        try {
          const docRef = doc(db, "blog", postId)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const postData = docSnap.data() as BlogPost

            // Si el post ya existe pero no tiene un contentType, derivarlo del schemaType
            if (postData.schemaType && !postData.contentType) {
              postData.contentType = deriveContentTypeFromSchema(postData.schemaType)
            }

            // Asegurar coherencia entre contentType, schemaType y ogType
            if (postData.contentType && CONTENT_TYPE_MAPPINGS[postData.contentType]) {
              const mapping = CONTENT_TYPE_MAPPINGS[postData.contentType]

              // Solo sobrescribir si no están definidos o no coinciden con el mapping
              if (!postData.schemaType || postData.schemaType !== mapping.schemaType) {
                postData.schemaType = mapping.schemaType
              }

              if (!postData.ogType || postData.ogType !== mapping.ogType) {
                postData.ogType = mapping.ogType
              }
            }

            setPost({ id: docSnap.id, ...postData })
          } else {
            toast.error("No se encontró el artículo")
            router.push("/admin/blog")
          }

          if (docSnap.exists() && docSnap.data().imageGalleryPost) {
            // Convert any stored gallery images to our format
            const storedGallery = docSnap.data().imageGalleryPost || []
            const formattedGallery = storedGallery.map((item: any, index: number) => ({
              url: item.url,
              alt: item.alt || "",
              id: item.id || `gallery-${index}-${Date.now()}`,
            }))
            setGalleryImages(formattedGallery)
          }
        } catch (error) {
          console.error("Error al cargar el artículo:", error)
          toast.error("Error al cargar el artículo")
        } finally {
          setLoading(false)
        }
      }

      fetchPost()
    } else if (user) {
      // Set default author information from the current user
      setPost((prev) => ({
        ...prev,
        author: user.displayName || "",
        authorId: user.uid || "",
        authorEmail: user.email || "",
        authorImageUrl: user.photoURL || "",
      }))
    }
  }, [isEditing, postId, router, user])

  // Validación automática de SEO cuando cambian campos relevantes
  useEffect(() => {
    const runValidation = () => {
      const { issues, score } = validateSeoSettings(false)
      setSeoIssues(issues)
      setSeoScore(score)
    }

    // Ejecutar validación cada vez que cambien campos SEO relevantes
    if (post.title || post.seoTitle || post.seoDescription || post.schemaType || post.ogType || post.contentType) {
      runValidation()
    }
  }, [
    post.title,
    post.seoTitle,
    post.seoDescription,
    post.schemaType,
    post.ogType,
    post.featuredImageUrl,
    post.socialImageUrl,
    post.contentType,
  ])

  // Fetch admin users for author selection
  useEffect(() => {
    const fetchAdminUsers = async () => {
      setLoadingUsers(true)
      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("role", "==", "admin"))
        const querySnapshot = await getDocs(q)

        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setAdminUsers(users)
      } catch (error) {
        console.error("Error fetching admin users:", error)
        toast.error("Error al cargar los usuarios administradores")
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchAdminUsers()
  }, [])

  // Calculate read time based on content length
  useEffect(() => {
    if (post.content) {
      // Average reading speed: 200 words per minute
      const wordCount = post.content.trim().split(/\s+/).length
      const readTime = Math.ceil(wordCount / 200)
      setPost((prev) => ({ ...prev, readTime }))
    }
  }, [post.content])

  // Generate canonical URL based on slug
  useEffect(() => {
    if (post.slug && !post.canonicalUrl) {
      const canonicalUrl = `https://ravehub.es/blog/${post.slug}`
      setPost((prev) => ({ ...prev, canonicalUrl }))
    }
  }, [post.slug, post.canonicalUrl])

  // Fetch available tags from Firebase
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsRef = collection(db, "blogTags")
        const querySnapshot = await getDocs(tagsRef)
        const tags = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAvailableTags(tags)
      } catch (error) {
        console.error("Error fetching tags:", error)
        toast.error("Error al cargar las etiquetas")
      }
    }

    fetchTags()
  }, [])

  // Close tags dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagsDropdownRef.current && !tagsDropdownRef.current.contains(event.target as Node)) {
        setIsTagsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Añadir useEffect para cargar redirecciones existentes cuando se edita un post
  useEffect(() => {
    if (isEditing && post.slug) {
      const fetchRedirects = async () => {
        setLoadingRedirects(true)
        try {
          const redirects = await getSlugRedirects(post.slug)
          setExistingRedirects(redirects)
        } catch (error) {
          console.error("Error al cargar redirecciones:", error)
        } finally {
          setLoadingRedirects(false)
        }
      }

      fetchRedirects()
    }
  }, [isEditing, post.slug])

  // Synchronize the editor mode with the post's contentFormat
  useEffect(() => {
    if (post.contentFormat === "html") {
      setMode("html")
    } else if (post.contentFormat === "markdown") {
      setMode("markdown")
    }
  }, [post.contentFormat])

  // Modificar la función handleInputChange para manejar cambios de slug
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "title" && !isEditing) {
      // Generate slug from title
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "-")

      setPost((prev) => ({
        ...prev,
        [name]: value,
        slug,
        seoTitle: prev.seoTitle || value,
      }))
    } else if (name === "slug" && isEditing) {
      // Si estamos editando y se cambia el slug manualmente, guardamos el slug anterior
      if (post.slug && value !== post.slug) {
        setPost((prev) => ({
          ...prev,
          previousSlug: prev.slug, // Guardar el slug anterior para crear la redirección después
          [name]: value,
        }))
      } else {
        setPost((prev) => ({ ...prev, [name]: value }))
      }
    } else if (name.startsWith("seo.")) {
      const seoField = name.split(".")[1]
      setPost((prev) => ({
        ...prev,
        [seoField]: value,
      }))
    } else if (name.startsWith("location.")) {
      const locationField = name.split(".")[1]
      setPost((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }))
    } else {
      setPost((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSwitchChange = (checked: boolean, name: string) => {
    setPost((prev) => ({ ...prev, [name]: checked }))
  }

  const handleContentChange = (content: string) => {
    setPost((prev) => ({ ...prev, content }))
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileId = uuidv4()
    const fileRef = ref(storage, `blog/${fileId}-${file.name}`)
    await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(fileRef)
    return downloadURL
  }

  const handleFeaturedImageUpload = async (file: File) => {
    try {
      const imageUrl = await handleImageUpload(file)
      setPost((prev) => ({
        ...prev,
        featuredImageUrl: imageUrl,
        socialImageUrl: prev.socialImageUrl || imageUrl,
      }))
      toast.success("Imagen destacada subida correctamente")
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      toast.error("Error al subir la imagen")
    }
  }

  const handleSocialImageUpload = async (file: File) => {
    try {
      const imageUrl = await handleImageUpload(file)
      setPost((prev) => ({
        ...prev,
        socialImageUrl: imageUrl,
      }))
      toast.success("Imagen para redes sociales subida correctamente")
    } catch (error) {
      console.error("Error al subir la imagen para redes sociales:", error)
      toast.error("Error al subir la imagen para redes sociales")
    }
  }

  const handleCategoriesChange = (categories: string[]) => {
    setPost((prev) => ({ ...prev, categories }))
  }

  const handleTagsChange = (tags: string[]) => {
    setPost((prev) => ({ ...prev, tags }))
  }

  const addTag = (tagToAdd: string) => {
    // Check if this is a custom tag (not from the database)
    const existingTag = availableTags.find((tag) => tag.name === tagToAdd)

    if (!tagToAdd) return

    // Check if tag is already added (by id or by name for custom tags)
    const isAlreadyAdded = post.tags?.some((tag) =>
      typeof tag === "string" ? tag === tagToAdd : tag.id === existingTag?.id || tag.name === tagToAdd,
    )

    if (isAlreadyAdded) return

    // If it's an existing tag from the database, add the full object
    if (existingTag) {
      setPost((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), existingTag],
      }))
    } else {
      // For custom tags, just add the name as a string
      setPost((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagToAdd],
      }))
    }

    setNewTag("")
  }

  const removeTag = (tagToRemove: any) => {
    setPost((prev) => ({
      ...prev,
      tags:
        prev.tags?.filter((tag) => {
          if (typeof tag === "string" && typeof tagToRemove === "string") {
            return tag !== tagToRemove
          } else if (typeof tag === "object" && typeof tagToRemove === "object") {
            return tag.id !== tagToRemove.id
          } else if (typeof tag === "object" && typeof tagToRemove === "string") {
            return tag.name !== tagToRemove
          } else if (typeof tag === "string" && typeof tagToRemove === "object") {
            return tag !== tagToRemove.name
          }
          return true
        }) || [],
    }))
  }

  const handleAuthorSelect = (userId: string) => {
    const selectedUser = adminUsers.find((user) => user.id === userId)
    if (selectedUser) {
      setPost((prev) => ({
        ...prev,
        author: `${selectedUser.firstName} ${selectedUser.lastName}`.trim(),
        authorId: selectedUser.id,
        authorEmail: selectedUser.email || "",
        authorImageUrl: selectedUser.photoURL || "",
      }))
    }
  }

  const addCoAuthor = () => {
    if (newCoAuthor && !post.coAuthors?.includes(newCoAuthor)) {
      setPost((prev) => ({
        ...prev,
        coAuthors: [...(prev.coAuthors || []), newCoAuthor],
      }))
      setNewCoAuthor("")
    }
  }

  const removeCoAuthor = (coAuthor: string) => {
    setPost((prev) => ({
      ...prev,
      coAuthors: prev.coAuthors?.filter((ca) => ca !== coAuthor) || [],
    }))
  }

  const addFaq = () => {
    if (newFaqQuestion && newFaqAnswer) {
      const newFaq = { question: newFaqQuestion, answer: newFaqAnswer }
      setPost((prev) => ({
        ...prev,
        faq: [...(prev.faq || []), newFaq],
      }))
      setNewFaqQuestion("")
      setNewFaqAnswer("")
    }
  }

  const removeFaq = (index: number) => {
    setPost((prev) => ({
      ...prev,
      faq: prev.faq?.filter((_, i) => i !== index) || [],
    }))
  }

  const addTranslation = () => {
    if (newTranslationLanguage && newTranslationContent) {
      const newTranslation = {
        language: newTranslationLanguage,
        translatedContent: newTranslationContent,
      }
      setPost((prev) => ({
        ...prev,
        translations: [...(prev.translations || []), newTranslation],
      }))
      setNewTranslationLanguage("")
      setNewTranslationContent("")
    }
  }

  const removeTranslation = (index: number) => {
    setPost((prev) => ({
      ...prev,
      translations: prev.translations?.filter((_, i) => i !== index) || [],
    }))
  }

  const validateForm = () => {
    if (!post.title) {
      toast.error("El título es obligatorio")
      return false
    }
    if (!post.slug) {
      toast.error("El slug es obligatorio")
      return false
    }
    if (!post.content) {
      toast.error("El contenido es obligatorio")
      return false
    }
    if (!post.excerpt) {
      toast.error("El extracto es obligatorio")
      return false
    }
    if (!post.featuredImageUrl) {
      toast.error("La imagen destacada es obligatoria")
      return false
    }
    if (!post.categories || post.categories.length === 0) {
      toast.error("Debes seleccionar al menos una categoría")
      return false
    }
    return true
  }

  const handleGalleryImagesChange = (images: GalleryImage[]) => {
    setGalleryImages(images)
  }

  // Modificar la función handleSubmit para crear redirecciones cuando se cambia el slug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Validar configuración SEO
    const { isValid, issues } = validateSeoSettings(true)

    if (!isValid) {
      // Mostrar advertencia pero permitir continuar
      if (
        !confirm(
          "Hay problemas con la configuración SEO: \n\n" + issues.join("\n") + "\n\n¿Desea continuar de todos modos?",
        )
      ) {
        return
      }
    }

    setSaving(true)
    setShowProgress(true)
    setProgress(0)

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Preparar el array de galería para guardar en Firestore
      const imageGalleryPost = galleryImages.map((image, index) => ({
        url: image.url,
        alt: image.alt,
        order: index,
        id: image.id,
      }))

      // Asegurarse de que los tipos contentType, schemaType y ogType son coherentes
      const finalPost = { ...post }

      // Asegurar que contentType existe
      if (!finalPost.contentType) {
        finalPost.contentType = deriveContentTypeFromSchema(finalPost.schemaType || "BlogPosting")
      }

      // Asegurar que los tipos son coherentes según el contentType
      if (CONTENT_TYPE_MAPPINGS[finalPost.contentType]) {
        const mapping = CONTENT_TYPE_MAPPINGS[finalPost.contentType]
        finalPost.schemaType = mapping.schemaType
        finalPost.ogType = mapping.ogType
      }

      if (isEditing && postId) {
        // Update existing post
        const docRef = doc(db, "blog", postId)
        await updateDoc(docRef, {
          ...finalPost,
          imageGalleryPost,
          updatedDate: new Date().toISOString(),
        })

        // Si se cambió el slug, crear una redirección
        if (post.previousSlug && post.slug !== post.previousSlug) {
          try {
            await createSlugRedirect(post.previousSlug, post.slug)
            toast.success("Redirección de slug creada correctamente")
          } catch (redirectError) {
            console.error("Error al crear redirección de slug:", redirectError)
            toast.error("Error al crear redirección de slug")
          }
        }

        clearInterval(progressInterval)
        setProgress(100)
        setTimeout(() => {
          toast.success("Artículo actualizado correctamente")
          router.push("/admin/blog")
        }, 500)
      } else {
        // Create new post
        const newPost = {
          ...finalPost,
          imageGalleryPost,
          createdAt: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          viewCount: 0,
          likes: 0,
          comments: [],
        }

        await addDoc(collection(db, "blog"), newPost)
        clearInterval(progressInterval)
        setProgress(100)
        setTimeout(() => {
          toast.success("Artículo creado correctamente")
          router.push("/admin/blog")
        }, 500)
      }
    } catch (error) {
      console.error("Error al guardar el artículo:", error)
      toast.error("Error al guardar el artículo")
      setShowProgress(false)
    } finally {
      setSaving(false)
    }
  }

  // Añadir función para eliminar una redirección
  const handleDeleteRedirect = async (redirectId: string) => {
    try {
      await deleteSlugRedirect(redirectId)
      // Actualizar la lista de redirecciones
      setExistingRedirects((prev) => prev.filter((redirect) => redirect.id !== redirectId))
      toast.success("Redirección eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar redirección:", error)
      toast.error("Error al eliminar redirección")
    }
  }

  // Función para generar el JSON-LD basado en los datos del post
  const generateJsonLd = () => {
    const baseUrl = "https://ravehub.es"
    const postUrl = `${baseUrl}/blog/${post.slug}`

    // Determinar el tipo de contenido y schema
    const contentType = post.contentType || "blog"
    const schemaType = post.schemaType || (contentType === "news" ? "NewsArticle" : "BlogPosting")

    // Extraer los nombres de las etiquetas si son objetos
    const tagNames = post.tags ? post.tags.map((tag) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean) : []

    // Estructura básica del JSON-LD
    const jsonLd: any = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": schemaType,
          "@id": `${postUrl}#content`,
          headline: post.seoTitle || post.title || "",
          name: post.title || "",
          description: post.seoDescription || post.excerpt || "",
          author: {
            "@type": "Person",
            name: post.author || "",
            email: post.authorEmail || "",
            url: post.authorUrl || `${baseUrl}/autores/${post.authorSlug || "equipo"}`,
          },
          datePublished: post.publishDate || new Date().toISOString(),
          dateModified: post.updatedDate || new Date().toISOString(),
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": post.canonicalUrl || postUrl,
          },
          image: {
            "@type": "ImageObject",
            url: post.featuredImageUrl || "",
            width: 1200,
            height: 630,
            caption: post.imageAltTexts?.featuredImage || post.title || "",
          },
          publisher: {
            "@type": "Organization",
            name: "RaveHub",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/images/logo-full.png`,
              width: 330,
              height: 60,
            },
          },
          keywords: post.seoKeywords ? post.seoKeywords.join(", ") : tagNames.join(", "),
          isAccessibleForFree: post.isAccessibleForFree !== false,
          articleSection: post.categories && post.categories.length > 0 ? post.categories[0] : "",
          inLanguage: "es",
        },
        {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          url: baseUrl,
          name: "RaveHub",
          description: "La plataforma líder en eventos de música electrónica en Latinoamérica",
          publisher: {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`,
          },
          inLanguage: "es",
        },
        {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          name: "RaveHub",
          url: baseUrl,
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/images/logo-full.png`,
            width: 330,
            height: 60,
          },
          sameAs: [
            "https://www.facebook.com/weareravehub",
            "https://www.instagram.com/weareravehub",
            "https://twitter.com/weareravehub",
            "https://www.tiktok.com/@weareravehub",
          ],
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${postUrl}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Inicio",
              item: baseUrl,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${baseUrl}/blog`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: post.title || "",
              item: postUrl,
            },
          ],
        },
      ],
    }

    // Añadir propiedades específicas según el tipo de contenido
    if (schemaType === "NewsArticle") {
      // Propiedades específicas para noticias
      jsonLd["@graph"][0] = {
        ...jsonLd["@graph"][0],
        dateline:
          post.location?.city && post.location?.country ? `${post.location.city}, ${post.location.country}` : undefined,
        printSection: post.categories && post.categories.length > 0 ? post.categories[0] : "Noticias",
        printEdition: "Edición Digital",
        newUpdates: post.updatedDate ? "Actualizado con la información más reciente" : undefined,
        // Propiedades específicas para Google News
        dateCreated: post.publishDate || new Date().toISOString(),
        datePublished: post.publishDate || new Date().toISOString(),
        dateModified: post.updatedDate || post.publishDate || new Date().toISOString(),
        reportingPrinciples: `${baseUrl}/politica-editorial`,
        diversityPolicy: `${baseUrl}/politica-diversidad`,
        ethicsPolicy: `${baseUrl}/codigo-etico`,
        correctionsPolicy: `${baseUrl}/politica-correcciones`,
      }
    } else if (schemaType === "Event") {
      // Propiedades específicas para eventos
      jsonLd["@graph"][0] = {
        "@type": "Event",
        "@id": `${postUrl}#event`,
        name: post.title || "",
        description: post.excerpt || "",
        startDate: post.eventDate || post.publishDate || new Date().toISOString(),
        endDate: post.eventEndDate,
        location: {
          "@type": "Place",
          name: post.location?.venueName || "",
          address: {
            "@type": "PostalAddress",
            addressLocality: post.location?.city || "",
            addressCountry: post.location?.country || "",
          },
        },
        image: post.featuredImageUrl || "",
        organizer: {
          "@type": "Organization",
          name: "RaveHub",
          url: baseUrl,
        },
      }
    } else if (schemaType === "Review") {
      // Propiedades específicas para reseñas
      jsonLd["@graph"][0] = {
        "@type": "Review",
        "@id": `${postUrl}#review`,
        name: post.title || "",
        description: post.excerpt || "",
        author: {
          "@type": "Person",
          name: post.author || "",
        },
        datePublished: post.publishDate || new Date().toISOString(),
        reviewRating: {
          "@type": "Rating",
          ratingValue: post.rating || 5,
          bestRating: 5,
          worstRating: 1,
        },
        itemReviewed: {
          "@type": post.reviewType || "Product",
          name: post.reviewItemName || post.title || "",
        },
      }
    } else if (schemaType === "HowTo") {
      // Propiedades específicas para guías/tutoriales
      jsonLd["@graph"][0] = {
        "@type": "HowTo",
        "@id": `${postUrl}#howto`,
        name: post.title || "",
        description: post.excerpt || "",
        step: post.howToSteps || [],
        tool: post.howToTools || [],
        supply: post.howToSupplies || [],
        totalTime: post.howToDuration || "PT30M",
      }
    }

    // Añadir FAQ si existe
    if (post.faq && post.faq.length > 0) {
      jsonLd["@graph"].push({
        "@type": "FAQPage",
        "@id": `${postUrl}#faq`,
        mainEntity: post.faq.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      })
    }

    // Añadir VideoObject si hay un video embebido
    if (post.videoEmbedUrl) {
      jsonLd["@graph"].push({
        "@type": "VideoObject",
        "@id": `${postUrl}#video`,
        name: post.title || "",
        description: post.excerpt || "",
        thumbnailUrl: post.featuredImageUrl || "",
        uploadDate: post.publishDate || new Date().toISOString(),
        contentUrl: post.videoEmbedUrl,
        embedUrl: post.videoEmbedUrl,
      })
    }

    return JSON.stringify(jsonLd, null, 2)
  }

  // Mejorar la función de validación SEO para devolver un objeto con resultados
  const validateSeoSettings = (showToasts = true) => {
    const issues = []
    let score = 100 // Comienza con 100 puntos
    let isValid = true

    // Validar título SEO
    if (!post.seoTitle) {
      issues.push("El título SEO está vacío")
      score -= 15
      isValid = false
    } else if (post.seoTitle.length > 60) {
      issues.push("El título SEO es demasiado largo (máximo 60 caracteres)")
      score -= 5
      isValid = false
    }

    // Validar descripción SEO
    if (!post.seoDescription) {
      issues.push("La descripción SEO está vacía")
      score -= 15
      isValid = false
    } else if (post.seoDescription.length > 160) {
      issues.push("La descripción SEO es demasiado larga (máximo 160 caracteres)")
      score -= 5
      isValid = false
    }

    // Validar coherencia entre tipos
    // Comprobar que los tipos sean coherentes según los mapeos definidos
    const contentType = post.contentType || "blog"
    if (contentType in CONTENT_TYPE_MAPPINGS) {
      const mapping = CONTENT_TYPE_MAPPINGS[contentType]

      if (post.schemaType !== mapping.schemaType) {
        issues.push(`Para contenido tipo '${contentType}', el tipo Schema.org debería ser '${mapping.schemaType}'`)
        score -= 10
        isValid = false
      }

      if (post.ogType !== mapping.ogType) {
        issues.push(`Para contenido tipo '${contentType}', el tipo Open Graph debería ser '${mapping.ogType}'`)
        score -= 10
        isValid = false
      }
    }

    // Validar imagen para redes sociales
    if (!post.socialImageUrl && !post.featuredImageUrl) {
      issues.push("No hay imagen para redes sociales")
      score -= 10
      isValid = false
    }

    // Validar palabras clave
    if (!post.seoKeywords || post.seoKeywords.length === 0) {
      issues.push("No hay palabras clave SEO definidas")
      score -= 10
      isValid = false
    }

    // Validar slug para SEO
    if (post.slug && post.slug.length > 100) {
      issues.push("El slug es demasiado largo para SEO")
      score -= 5
      isValid = false
    }

    // Limitar score entre 0 y 100
    score = Math.max(0, Math.min(100, score))

    // Mostrar resultados si showToasts es true
    if (showToasts) {
      if (issues.length > 0) {
        toast.error(`Problemas SEO encontrados: ${issues.join(", ")}`)
      } else {
        toast.success("Configuración SEO validada correctamente")
      }
    }

    return {
      isValid,
      issues,
      score,
    }
  }

  // Añadir función para crear redirección manual
  const handleAddManualRedirect = async () => {
    if (!manualRedirectSlug || !post.slug) return

    try {
      setIsAddingManualRedirect(true)
      await createSlugRedirect(manualRedirectSlug, post.slug)

      // Actualizar la lista de redirecciones
      const newRedirects = await getSlugRedirects(post.slug)
      setExistingRedirects(newRedirects)

      // Limpiar el formulario
      setManualRedirectSlug("")
      toast.success("Redirección creada correctamente")
    } catch (error) {
      console.error("Error al crear redirección manual:", error)
      toast.error("Error al crear redirección manual")
    } finally {
      setIsAddingManualRedirect(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? "Editar artículo" : "Crear nuevo artículo"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/blog")}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Publicar"}
          </Button>
        </div>
      </div>

      {showProgress && (
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
        </div>
      )}

      <Tabs defaultValue="basic">
        <TabsList className="mb-6">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="author">Autor</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="media">Multimedia</TabsTrigger>
          <TabsTrigger value="gallery">Galería</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
        </TabsList>

        {/* INFORMACIÓN BÁSICA */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  name="title"
                  value={post.title}
                  onChange={handleInputChange}
                  placeholder="Título del artículo"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={post.slug}
                  onChange={handleInputChange}
                  placeholder="slug-del-articulo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL amigable para el artículo (solo letras, números y guiones)
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Extracto *</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  value={post.excerpt}
                  onChange={handleInputChange}
                  placeholder="Breve descripción del artículo (máx. 160 caracteres)"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">{post.excerpt?.length || 0}/160 caracteres</p>
              </div>

              <div>
                <Label htmlFor="status">Estado *</Label>
                <Select
                  value={post.status}
                  onValueChange={(value) =>
                    setPost((prev) => ({ ...prev, status: value as "draft" | "published" | "archived" }))
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="publishDate">Fecha de publicación</Label>
                <Input
                  id="publishDate"
                  name="publishDate"
                  type="datetime-local"
                  value={post.publishDate ? new Date(post.publishDate).toISOString().slice(0, 16) : ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Imagen destacada *</Label>
                <ImageUploader
                  currentImage={post.featuredImageUrl}
                  onImageUpload={handleFeaturedImageUpload}
                  className="aspect-video"
                />
              </div>

              <div>
                <Label htmlFor="categories">Categorías *</Label>
                <CategorySelect selectedCategories={post.categories || []} onChange={handleCategoriesChange} />
              </div>

              <div className="space-y-2" ref={tagsDropdownRef}>
                <div className="flex justify-between items-center">
                  <Label>Etiquetas</Label>
                  <Link href="/admin/blog/etiquetas/new">
                    <Button type="button" variant="ghost" size="sm" className="h-8">
                      <Plus className="h-4 w-4 mr-1" />
                      Crear etiqueta
                    </Button>
                  </Link>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={tagSearchQuery}
                        onChange={(e) => {
                          setTagSearchQuery(e.target.value)
                          setIsTagsDropdownOpen(true)
                        }}
                        onClick={() => setIsTagsDropdownOpen(true)}
                        placeholder="Buscar o añadir etiqueta"
                        className="pr-8"
                      />
                      <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (tagSearchQuery.trim()) {
                          addTag(tagSearchQuery.trim())
                          setTagSearchQuery("")
                          setIsTagsDropdownOpen(false)
                        }
                      }}
                      size="sm"
                    >
                      Añadir
                    </Button>
                  </div>

                  {isTagsDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {availableTags
                        .filter(
                          (tag) =>
                            tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                            tag.slug.toLowerCase().includes(tagSearchQuery.toLowerCase()),
                        )
                        .map((tag) => {
                          // Check if this tag is already added
                          const isTagAdded = post.tags?.some((t) =>
                            typeof t === "string" ? t === tag.name : t.id === tag.id,
                          )

                          return (
                            <div
                              key={tag.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                                isTagAdded ? "bg-gray-50" : ""
                              }`}
                              onClick={() => {
                                if (!isTagAdded) {
                                  setPost((prev) => ({
                                    ...prev,
                                    tags: [...(prev.tags || []), tag],
                                  }))
                                }
                                setTagSearchQuery("")
                                setIsTagsDropdownOpen(false)
                              }}
                            >
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: tag.color || "#888888" }}
                              />
                              <span>{tag.name}</span>
                              {isTagAdded && <span className="ml-2 text-xs text-gray-500">(ya añadido)</span>}
                            </div>
                          )
                        })}
                      {availableTags.filter(
                        (tag) =>
                          tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                          tag.slug.toLowerCase().includes(tagSearchQuery.toLowerCase()),
                      ).length === 0 &&
                        tagSearchQuery && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No se encontraron etiquetas. Pulse "Añadir" para crear una nueva.
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags?.map((tag, index) => {
                    const tagName = typeof tag === "string" ? tag : tag.name
                    const tagColor =
                      typeof tag === "string"
                        ? availableTags.find((t) => t.name === tag)?.color || "#888888"
                        : tag.color || "#888888"

                    return (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: tagColor }} />
                        <span className="text-sm">{tagName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-1"
                          onClick={() => removeTag(tag)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={post.featured}
                  onCheckedChange={(checked) => handleSwitchChange(checked, "featured")}
                />
                <Label htmlFor="featured">Destacar en portada</Label>
              </div>

              {post.featured && (
                <div>
                  <Label htmlFor="featuredOrder">Orden de destacado</Label>
                  <Input
                    id="featuredOrder"
                    name="featuredOrder"
                    type="number"
                    min="0"
                    value={post.featuredOrder || 0}
                    onChange={(e) => setPost((prev) => ({ ...prev, featuredOrder: Number.parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Menor número = Mayor prioridad</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* INFORMACIÓN DEL AUTOR */}
        <TabsContent value="author" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="author">Nombre del autor *</Label>
              <Select value={post.authorId || ""} onValueChange={handleAuthorSelect} disabled={loadingUsers}>
                <SelectTrigger id="author" className="w-full">
                  <SelectValue placeholder={loadingUsers ? "Cargando autores..." : "Selecciona un autor"} />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.firstName} ${user.lastName}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="authorId">ID del autor</Label>
              <Input
                id="authorId"
                name="authorId"
                value={post.authorId}
                onChange={handleInputChange}
                placeholder="ID del autor"
                readOnly={!!user}
              />
              <p className="text-xs text-gray-500 mt-1">Generado automáticamente al seleccionar el autor</p>
            </div>

            <div>
              <Label htmlFor="authorEmail">Email del autor</Label>
              <Input
                id="authorEmail"
                name="authorEmail"
                value={post.authorEmail}
                onChange={handleInputChange}
                placeholder="Email del autor"
                readOnly={!!user}
              />
            </div>

            <div>
              <Label htmlFor="authorImageUrl">Imagen del autor</Label>
              <Input
                id="authorImageUrl"
                name="authorImageUrl"
                value={post.authorImageUrl}
                onChange={handleInputChange}
                placeholder="URL de la imagen del autor"
                readOnly={!!user}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Coautores</Label>
              <div className="flex gap-2">
                <Select
                  value={newCoAuthor}
                  onValueChange={(value) => {
                    setNewCoAuthor(value)
                    if (value && !post.coAuthors?.includes(value)) {
                      addCoAuthor()
                    }
                  }}
                  disabled={loadingUsers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingUsers ? "Cargando autores..." : "Añadir coautor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers
                      .filter((user) => !post.coAuthors?.includes(user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {`${user.firstName} ${user.lastName}`.trim()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addCoAuthor} size="sm" disabled={!newCoAuthor || loadingUsers}>
                  Añadir
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {post.coAuthors?.map((coAuthorId, index) => {
                  const coAuthorUser = adminUsers.find((user) => user.id === coAuthorId)
                  const displayName = coAuthorUser
                    ? `${coAuthorUser.firstName} ${coAuthorUser.lastName}`.trim()
                    : coAuthorId

                  return (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{displayName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => removeCoAuthor(coAuthorId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CONTENIDO */}
        <TabsContent value="content" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Contenido *</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={post.contentFormat || "markdown"}
                  onValueChange={(value) => {
                    // Update the content format and ensure the Editor knows about it
                    setPost((prev) => ({ ...prev, contentFormat: value }))
                    // Force update the Editor mode based on the selected format
                    if (value === "html") {
                      setMode("html")
                    } else if (value === "markdown") {
                      setMode("markdown")
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="mixed">Mixto (MD + HTML)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const previewWindow = window.open("", "_blank")
                    if (previewWindow) {
                      previewWindow.document.write(`
                        <html>
                          <head>
                            <title>Vista previa - ${post.title || "Artículo"}</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                            <style>
                              body { padding: 2rem; max-width: 800px; margin: 0 auto; }
                              pre { background: #f4f4f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
                              code { font-family: monospace; }
                              img { max-width: 100%; height: auto; }
                              h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 1rem; }
                              p { margin-bottom: 1rem; }
                              .hljs { display: block; overflow-x: auto; padding: 0.5em; background: #282c34; color: #abb2bf; }
                            </style>
                            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
                            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
                            <script>hljs.highlightAll();</script>
                          </head>
                          <body>
                            <div class="prose prose-lg max-w-none">
                              ${post.content || ""}
                            </div>
                            <script>
                              // Procesar bloques de código
                              document.querySelectorAll('pre code').forEach((block) => {
                                hljs.highlightBlock(block);
                              });
                            </script>
                          </body>
                        </html>
                      `)
                      previewWindow.document.close()
                    }
                  }}
                >
                  Vista previa
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Consejos para el contenido:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>
                      Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">\`\`\`html</code> para bloques de
                      código HTML
                    </li>
                    <li>
                      Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">\`\`\`css</code> para bloques de código
                      CSS
                    </li>
                    <li>
                      Usa <code className="bg-muted px-1 py-0.5 rounded text-xs">\`\`\`javascript</code> o{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">\`\`\`js</code> para JavaScript
                    </li>
                    <li>Puedes usar HTML directamente dentro del contenido</li>
                    <li>
                      Para incrustar CSS, usa etiquetas{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;style&gt;</code>
                    </li>
                    <li>
                      Para incrustar JavaScript, usa etiquetas{" "}
                      <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;script&gt;</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Editor
              initialContent={post.content}
              onChange={handleContentChange}
              onImageUpload={handleImageUpload}
              mode={mode}
              onModeChange={setMode}
              editorConfig={{
                placeholder: "Escribe el contenido de tu artículo aquí...",
                height: "500px",
                menubar: "file edit view insert format tools table help",
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "code",
                  "help",
                  "wordcount",
                  "codesample",
                ],
                toolbar:
                  "undo redo | blocks | " +
                  "bold italic forecolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | link image media | codesample code | help",
                codesample_languages: [
                  { text: "HTML/XML", value: "markup" },
                  { text: "JavaScript", value: "javascript" },
                  { text: "CSS", value: "css" },
                  { text: "PHP", value: "php" },
                  { text: "Ruby", value: "ruby" },
                  { text: "Python", value: "python" },
                  { text: "Java", value: "java" },
                  { text: "C", value: "c" },
                  { text: "C#", value: "csharp" },
                  { text: "C++", value: "cpp" },
                ],
                content_style: `
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; }
                  pre { background-color: #f4f4f4; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; }
                  code { font-family: Monaco, Menlo, Consolas, 'Courier New', monospace; }
                  img { max-width: 100%; height: auto; }
                  .mce-content-body [data-mce-selected="inline-boundary"] { background-color: rgba(59, 130, 246, 0.2); }
                `,
              }}
            />

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                {post.content ? `${post.content.length} caracteres` : "0 caracteres"}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Validar el contenido para detectar posibles errores
                    try {
                      // Verificar balance de etiquetas HTML
                      const openTags = (post.content?.match(/<[^/][^>]*>/g) || []).length
                      const closeTags = (post.content?.match(/<\/[^>]*>/g) || []).length

                      if (openTags !== closeTags) {
                        toast.error("Posible error: Las etiquetas HTML no están balanceadas correctamente.")
                        return
                      }

                      // Verificar bloques de código
                      const codeBlocksOpen = (post.content?.match(/```[a-z]*/g) || []).length
                      const codeBlocksClose = (post.content?.match(/```(?!\w)/g) || []).length

                      if (codeBlocksOpen !== codeBlocksClose) {
                        toast.error("Posible error: Los bloques de código no están cerrados correctamente.")
                        return
                      }

                      toast.success("El contenido parece estar correctamente formateado.")
                    } catch (error) {
                      console.error("Error al validar contenido:", error)
                      toast.error("Error al validar el contenido.")
                    }
                  }}
                >
                  Validar contenido
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Formatear el contenido para mejorar la legibilidad
                    try {
                      let formattedContent = post.content || ""

                      // Formatear bloques de código HTML
                      formattedContent = formattedContent.replace(/```html\s*([\s\S]*?)\s*```/g, (_, code) => {
                        try {
                          // Intenta formatear el HTML (versión simple)
                          const formatted = code
                            .replace(/>\s*</g, ">\n<")
                            .replace(/(<[^/].*?>)/g, "$1\n")
                            .replace(/(<\/.*?>)/g, "\n$1\n")
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .join("\n")
                          return "```html\n" + formatted + "\n```"
                        } catch (e) {
                          return "```html\n" + code + "\n```"
                        }
                      })

                      // Formatear bloques de código CSS
                      formattedContent = formattedContent.replace(/```css\s*([\s\S]*?)\s*```/g, (_, code) => {
                        try {
                          // Intenta formatear el CSS (versión simple)
                          const formatted = code
                            .replace(/\{/g, " {\n  ")
                            .replace(/;/g, ";\n  ")
                            .replace(/\}/g, "\n}\n")
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .join("\n")
                          return "```css\n" + formatted + "\n```"
                        } catch (e) {
                          return "```css\n" + code + "\n```"
                        }
                      })

                      // Formatear bloques de código JavaScript
                      formattedContent = formattedContent.replace(
                        /```(js|javascript)\s*([\s\S]*?)\s*```/g,
                        (_, lang, code) => {
                          try {
                            // Intenta formatear el JS (versión simple)
                            const formatted = code
                              .replace(/\{/g, " {\n  ")
                              .replace(/;/g, ";\n  ")
                              .replace(/\}/g, "\n}\n")
                              .split("\n")
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .join("\n")
                            return "```" + lang + "\n" + formatted + "\n```"
                          } catch (e) {
                            return "```" + lang + "\n" + code + "\n```"
                          }
                        },
                      )

                      handleContentChange(formattedContent)
                      toast.success("Contenido formateado correctamente.")
                    } catch (error) {
                      console.error("Error al formatear contenido:", error)
                      toast.error("Error al formatear el contenido.")
                    }
                  }}
                >
                  Formatear contenido
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Label htmlFor="readTime">Tiempo de lectura (minutos)</Label>
              <Input
                id="readTime"
                name="readTime"
                type="number"
                min="1"
                value={post.readTime || 0}
                onChange={handleInputChange}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Calculado automáticamente basado en el contenido</p>
            </div>

            <div>
              <Label htmlFor="videoEmbedUrl">URL de video incrustado</Label>
              <Input
                id="videoEmbedUrl"
                name="videoEmbedUrl"
                value={post.videoEmbedUrl || ""}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
          </div>

          <div className="mt-6">
            <Label>Preguntas frecuentes (FAQ)</Label>
            <Card className="mt-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {post.faq?.map((faq, index) => (
                    <div key={index} className="border p-4 rounded-md relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeFaq(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="font-medium">{faq.question}</div>
                      <div className="mt-2 text-gray-600">{faq.answer}</div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Input
                      placeholder="Pregunta"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                    />
                    <Textarea
                      placeholder="Respuesta"
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      rows={3}
                    />
                    <Button
                      type="button"
                      onClick={addFaq}
                      disabled={!newFaqQuestion || !newFaqAnswer}
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Añadir pregunta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MULTIMEDIA */}
        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Imagen destacada *</Label>
              <ImageUploader
                currentImage={post.featuredImageUrl}
                onImageUpload={handleFeaturedImageUpload}
                className="aspect-video"
              />
            </div>

            <div>
              <Label>Imagen para redes sociales</Label>
              <ImageUploader
                currentImage={post.socialImageUrl || ""}
                onImageUpload={handleSocialImageUpload}
                className="aspect-[1.91/1]"
              />
              <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x630px</p>
            </div>
          </div>

          <div className="mt-6">
            <Label>Textos alternativos para imágenes</Label>
            <p className="text-xs text-gray-500 mb-2">
              Añade textos alternativos para mejorar la accesibilidad y el SEO de tus imágenes
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="alt-texts">
                <AccordionTrigger>Textos alternativos</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {post.featuredImageUrl && (
                      <div className="space-y-2">
                        <Label htmlFor="featuredImageAlt">Imagen destacada</Label>
                        <Input
                          id="featuredImageAlt"
                          value={post.imageAltTexts?.featuredImage || ""}
                          onChange={(e) =>
                            setPost((prev) => ({
                              ...prev,
                              imageAltTexts: {
                                ...(prev.imageAltTexts || {}),
                                featuredImage: e.target.value,
                              },
                            }))
                          }
                          placeholder="Texto alternativo para la imagen destacada"
                        />
                      </div>
                    )}

                    {post.socialImageUrl && (
                      <div className="space-y-2">
                        <Label htmlFor="socialImageAlt">Imagen para redes sociales</Label>
                        <Input
                          id="socialImageAlt"
                          value={post.imageAltTexts?.socialImage || ""}
                          onChange={(e) =>
                            setPost((prev) => ({
                              ...prev,
                              imageAltTexts: {
                                ...(prev.imageAltTexts || {}),
                                socialImage: e.target.value,
                              },
                            }))
                          }
                          placeholder="Texto alternativo para la imagen de redes sociales"
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mt-6">
            <Label htmlFor="videoEmbedUrl">URL de video incrustado</Label>
            <Input
              id="videoEmbedUrl"
              name="videoEmbedUrl"
              value={post.videoEmbedUrl || ""}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/embed/..."
            />
            <p className="text-xs text-gray-500 mt-1">URL de YouTube, Vimeo u otro servicio de video</p>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Galería de imágenes</h3>
            <p className="text-sm text-gray-500">
              Añade múltiples imágenes para mostrar en la galería del artículo. Puedes reordenarlas arrastrándolas.
            </p>

            <ImageGalleryUploader
              images={galleryImages}
              onImagesChange={handleGalleryImagesChange}
              onImageUpload={handleImageUpload}
              className="mt-4"
            />

            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {galleryImages.length === 0
                  ? "No hay imágenes en la galería"
                  : `${galleryImages.length} ${galleryImages.length === 1 ? "imagen" : "imágenes"} en la galería`}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Mostrar puntuación SEO en la parte superior */}
              <div className="w-full bg-gray-100 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-medium">Puntuación SEO</h3>
                  <span
                    className={`text-lg font-bold ${
                      seoScore >= 90 ? "text-green-600" : seoScore >= 70 ? "text-yellow-600" : "text-red-600"
                    }`}
                  >
                    {seoScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      seoScore >= 90 ? "bg-green-600" : seoScore >= 70 ? "bg-yellow-500" : "bg-red-600"
                    }`}
                    style={{ width: `${seoScore}%` }}
                  ></div>
                </div>

                {seoIssues.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowSeoIssues(!showSeoIssues)}
                      className="text-sm text-blue-600 flex items-center"
                    >
                      {showSeoIssues ? "Ocultar problemas" : `Mostrar ${seoIssues.length} problemas`}
                    </button>

                    {showSeoIssues && (
                      <ul className="mt-2 text-sm space-y-1 text-gray-700">
                        {seoIssues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="contentType">Tipo de contenido *</Label>
                <Select
                  value={post.contentType || "blog"}
                  onValueChange={(value: string) => {
                    // Asegurar que contentType es de un tipo aceptado
                    if (!CONTENT_TYPE_MAPPINGS[value]) return

                    // Obtener los tipos correspondientes del mapeo
                    const mapping = CONTENT_TYPE_MAPPINGS[value]

                    // Actualizar todos los tipos al mismo tiempo para mantener coherencia
                    setPost((prev) => ({
                      ...prev,
                      contentType: value,
                      schemaType: mapping.schemaType,
                      ogType: mapping.ogType,
                    }))
                  }}
                >
                  <SelectTrigger id="contentType">
                    <SelectValue placeholder="Selecciona tipo de contenido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Entrada de blog</SelectItem>
                    <SelectItem value="news">Noticia</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="review">Reseña</SelectItem>
                    <SelectItem value="guide">Guía / Tutorial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Establece automáticamente el tipo de Schema.org y Open Graph apropiados
                </p>
              </div>

              <div>
                <Label htmlFor="seoTitle">Título SEO *</Label>
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  value={post.seoTitle || ""}
                  onChange={handleInputChange}
                  placeholder="Título para SEO (máx. 60 caracteres)"
                  maxLength={60}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500 mt-1">{post.seoTitle?.length || 0}/60 caracteres</p>
                  {post.seoTitle && post.seoTitle.length > 0 && post.seoTitle.length <= 60 && (
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Longitud óptima
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="seoDescription">Descripción SEO *</Label>
                <Textarea
                  id="seoDescription"
                  name="seoDescription"
                  value={post.seoDescription || ""}
                  onChange={handleInputChange}
                  placeholder="Descripción para SEO (máx. 160 caracteres)"
                  maxLength={160}
                  rows={3}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500 mt-1">{post.seoDescription?.length || 0}/160 caracteres</p>
                  {post.seoDescription && post.seoDescription.length > 0 && post.seoDescription.length <= 160 && (
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Longitud óptima
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="seoKeywords">Palabras clave SEO *</Label>
                <Input
                  id="seoKeywords"
                  name="seoKeywords"
                  value={post.seoKeywords?.join(", ") || ""}
                  onChange={(e) =>
                    setPost((prev) => ({
                      ...prev,
                      seoKeywords: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Palabras clave separadas por comas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {post.seoKeywords?.length || 0} {post.seoKeywords?.length === 1 ? "palabra clave" : "palabras clave"}
                </p>
              </div>

              <div>
                <Label htmlFor="focusKeyword">Palabra clave principal *</Label>
                <Input
                  id="focusKeyword"
                  name="focusKeyword"
                  value={post.focusKeyword || ""}
                  onChange={handleInputChange}
                  placeholder="Palabra clave principal para SEO"
                />
                {post.focusKeyword &&
                post.title &&
                post.title.toLowerCase().includes(post.focusKeyword.toLowerCase()) ? (
                  <p className="text-xs text-green-500 mt-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Palabra clave incluida en el título
                  </p>
                ) : post.focusKeyword ? (
                  <p className="text-xs text-amber-500 mt-1">
                    Recomendado: incluye la palabra clave principal en el título
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="canonicalUrl">URL canónica</Label>
                <Input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  value={post.canonicalUrl || ""}
                  onChange={handleInputChange}
                  placeholder="https://ravehub.es/blog/..."
                />
                <p className="text-xs text-gray-500 mt-1">URL completa para evitar contenido duplicado</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schemaType">Tipo de Schema.org</Label>
                  <Select
                    value={post.schemaType}
                    onValueChange={(value) => {
                      // Determinar el contentType basado en schemaType
                      const contentType = deriveContentTypeFromSchema(value)

                      // Obtener el tipo OG apropiado
                      const ogType = CONTENT_TYPE_MAPPINGS[contentType]?.ogType || "article"

                      // Actualizar todos los campos relacionados
                      setPost((prev) => ({
                        ...prev,
                        schemaType: value,
                        contentType,
                        ogType,
                      }))
                    }}
                  >
                    <SelectTrigger id="schemaType">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BlogPosting">Publicación de blog</SelectItem>
                      <SelectItem value="NewsArticle">Artículo de noticias</SelectItem>
                      <SelectItem value="Article">Artículo genérico</SelectItem>
                      <SelectItem value="Event">Evento</SelectItem>
                      <SelectItem value="Review">Reseña</SelectItem>
                      <SelectItem value="HowTo">Guía / Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Tipo de datos estructurados para motores de búsqueda</p>
                </div>

                <div>
                  <Label htmlFor="ogType">Tipo Open Graph</Label>
                  <Select
                    value={post.ogType}
                    onValueChange={(value) => setPost((prev) => ({ ...prev, ogType: value }))}
                  >
                    <SelectTrigger id="ogType">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Artículo</SelectItem>
                      <SelectItem value="website">Sitio web</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="profile">Perfil</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Tipo de contenido para redes sociales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twitterCardType">Tipo de tarjeta Twitter</Label>
                  <Select
                    value={post.twitterCardType || "summary_large_image"}
                    onValueChange={(value) => setPost((prev) => ({ ...prev, twitterCardType: value }))}
                  >
                    <SelectTrigger id="twitterCardType">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Resumen</SelectItem>
                      <SelectItem value="summary_large_image">Resumen con imagen grande</SelectItem>
                      <SelectItem value="app">Aplicación</SelectItem>
                      <SelectItem value="player">Reproductor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="isAccessibleForFree">Accesibilidad del contenido</Label>
                  <div className="flex items-center h-10 mt-2 space-x-2">
                    <Switch
                      id="isAccessibleForFree"
                      checked={post.isAccessibleForFree !== false}
                      onCheckedChange={(checked) => handleSwitchChange(checked, "isAccessibleForFree")}
                    />
                    <Label htmlFor="isAccessibleForFree" className="text-sm">
                      Contenido accesible de forma gratuita
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Vista previa JSON-LD</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJsonLd(!showJsonLd)}
                    className="flex items-center gap-1"
                  >
                    <Code className="h-4 w-4" />
                    {showJsonLd ? "Ocultar JSON-LD" : "Mostrar JSON-LD"}
                  </Button>
                </div>

                {showJsonLd && (
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs max-h-96 font-mono">
                      {generateJsonLd()}
                    </pre>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        navigator.clipboard.writeText(generateJsonLd())
                        toast.success("JSON-LD copiado al portapapeles")
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Imagen para redes sociales *</Label>
                <ImageUploader
                  currentImage={post.socialImageUrl || ""}
                  onImageUpload={handleSocialImageUpload}
                  className="aspect-[1.91/1]"
                />
                <p className="text-xs text-gray-500 mt-1">Recomendado: 1200x630px</p>
              </div>

              <div className="mt-6">
                <Label>Vista previa en Google</Label>
                <SeoPreview
                  title={post.seoTitle || post.title || ""}
                  description={post.seoDescription || post.excerpt || ""}
                  url={`https://ravehub.es/blog/${post.slug || "titulo-del-articulo"}`}
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Recomendaciones SEO por tipo</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>
                      <strong>Blog:</strong> Usa <strong>BlogPosting</strong> schema y <strong>article</strong> Open
                      Graph
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>
                      <strong>Noticias:</strong> Usa <strong>NewsArticle</strong> schema y <strong>article</strong> Open
                      Graph
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>
                      <strong>Eventos:</strong> Usa <strong>Event</strong> schema y <strong>event</strong> Open Graph
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>
                      <strong>Reseñas:</strong> Usa <strong>Review</strong> schema y <strong>article</strong> Open Graph
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>
                      <strong>Guías:</strong> Usa <strong>HowTo</strong> schema y <strong>article</strong> Open Graph
                    </span>
                  </li>
                </ul>
                <p className="text-xs text-blue-700 mt-3 italic">
                  Consejo: Usa el selector "Tipo de contenido" para establecer automáticamente los tipos correctos
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const { issues, score, isValid } = validateSeoSettings(true)
              setSeoIssues(issues)
              setSeoScore(score)
              setShowSeoIssues(true)
            }}
            className="mt-4"
          >
            Validar configuración SEO
          </Button>
        </TabsContent>

        {/* AVANZADO */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ubicación</h3>
              <div>
                <Label htmlFor="location.city">Ciudad</Label>
                <Input
                  id="location.city"
                  name="location.city"
                  value={post.location?.city || ""}
                  onChange={handleInputChange}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="location.country">País</Label>
                <Input
                  id="location.country"
                  name="location.country"
                  value={post.location?.country || ""}
                  onChange={handleInputChange}
                  placeholder="País"
                />
              </div>
              <div>
                <Label htmlFor="location.venueName">Nombre del lugar</Label>
                <Input
                  id="location.venueName"
                  name="location.venueName"
                  value={post.location?.venueName || ""}
                  onChange={handleInputChange}
                  placeholder="Nombre del lugar"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Relaciones</h3>
              <div>
                <Label htmlFor="relatedEventId">ID de evento relacionado</Label>
                <Input
                  id="relatedEventId"
                  name="relatedEventId"
                  value={post.relatedEventId || ""}
                  onChange={handleInputChange}
                  placeholder="ID del evento relacionado"
                />
              </div>
              <div>
                <Label htmlFor="relatedPosts">IDs de posts relacionados</Label>
                <Input
                  id="relatedPosts"
                  name="relatedPosts"
                  value={post.relatedPosts?.join(", ") || ""}
                  onChange={(e) =>
                    setPost((prev) => ({
                      ...prev,
                      relatedPosts: e.target.value
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="IDs separados por comas"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Traducciones</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {post.translations?.map((translation, index) => (
                    <div key={index} className="border p-4 rounded-md relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeTranslation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="font-medium">{translation.language}</div>
                      <div className="mt-2 text-gray-600 line-clamp-2">{translation.translatedContent}</div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Input
                      placeholder="Idioma (ej: en, fr, de)"
                      value={newTranslationLanguage}
                      onChange={(e) => setNewTranslationLanguage(e.target.value)}
                    />
                    <Textarea
                      placeholder="Contenido traducido"
                      value={newTranslationContent}
                      onChange={(e) => setNewTranslationContent(e.target.value)}
                      rows={3}
                    />
                    <Button
                      type="button"
                      onClick={addTranslation}
                      disabled={!newTranslationLanguage || !newTranslationContent}
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Añadir traducción
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Redirecciones de URL</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {loadingRedirects ? (
                    <p className="text-sm text-gray-500">Cargando redirecciones...</p>
                  ) : existingRedirects.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-500 mb-2">
                        Las siguientes URLs antiguas redirigen a este artículo:
                      </p>
                      {existingRedirects.map((redirect) => (
                        <div key={redirect.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">/blog/{redirect.oldSlug}</code>
                            <span className="mx-2 text-gray-400">→</span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">/blog/{redirect.newSlug}</code>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRedirect(redirect.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No hay redirecciones configuradas para este artículo.</p>
                  )}

                  {isEditing && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Si cambias el slug de este artículo, se creará automáticamente una redirección desde el slug
                        anterior.
                      </p>
                      {post.previousSlug && post.previousSlug !== post.slug && (
                        <div className="p-3 bg-blue-50 rounded-md mt-2">
                          <p className="text-sm">
                            Se creará una redirección desde{" "}
                            <code className="bg-blue-100 px-2 py-1 rounded">/blog/{post.previousSlug}</code> a{" "}
                            <code className="bg-blue-100 px-2 py-1 rounded">/blog/{post.slug}</code>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Añadir redirección manual</h4>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">/blog/</span>
                          <Input
                            value={manualRedirectSlug}
                            onChange={(e) => setManualRedirectSlug(e.target.value)}
                            placeholder="slug-antiguo"
                            disabled={!isEditing || isAddingManualRedirect}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddManualRedirect}
                        disabled={!manualRedirectSlug || !isEditing || isAddingManualRedirect}
                        size="sm"
                      >
                        {isAddingManualRedirect ? "Añadiendo..." : "Añadir"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Esto creará una redirección desde <code>/blog/{manualRedirectSlug || "slug-antiguo"}</code> a{" "}
                      <code>/blog/{post.slug || "slug-actual"}</code>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
