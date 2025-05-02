import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { Album, GalleryImage } from "@/types/gallery"
import { slugify } from "@/lib/utils"

// Colecciones
const ALBUMS_COLLECTION = "albums"
const GALLERY_IMAGES_COLLECTION = "galleryImages"

// Define the AlbumWithImages type
export type AlbumWithImages = Album & {
  images: GalleryImage[]
}

// Funciones para álbumes
export async function createAlbum(album: Omit<Album, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // Generar slug si no existe
    if (!album.slug) {
      album.slug = slugify(album.name)
    }

    const docRef = await addDoc(collection(db, ALBUMS_COLLECTION), {
      ...album,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating album:", error)
    throw error
  }
}

export async function updateAlbum(
  id: string,
  album: Partial<Omit<Album, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  try {
    // Generar slug si se actualizó el nombre y no se proporcionó un slug
    if (album.name && !album.slug) {
      album.slug = slugify(album.name)
    }

    const albumRef = doc(db, ALBUMS_COLLECTION, id)
    await updateDoc(albumRef, {
      ...album,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating album:", error)
    throw error
  }
}

export async function deleteAlbum(id: string): Promise<void> {
  try {
    // Primero, obtener todas las imágenes del álbum
    const imagesQuery = query(collection(db, GALLERY_IMAGES_COLLECTION), where("albumId", "==", id))
    const imagesSnapshot = await getDocs(imagesQuery)

    // Eliminar cada imagen (tanto de Firestore como de Storage)
    const deletePromises = imagesSnapshot.docs.map(async (imageDoc) => {
      const imageData = imageDoc.data() as GalleryImage
      // Eliminar de Storage
      const imageRef = ref(storage, imageData.url)
      try {
        await deleteObject(imageRef)
      } catch (error) {
        console.error("Error deleting image from storage:", error)
      }
      // Eliminar de Firestore
      await deleteDoc(doc(db, GALLERY_IMAGES_COLLECTION, imageDoc.id))
    })

    await Promise.all(deletePromises)

    // Finalmente, eliminar el álbum
    await deleteDoc(doc(db, ALBUMS_COLLECTION, id))
  } catch (error) {
    console.error("Error deleting album:", error)
    throw error
  }
}

export async function getAlbum(id: string): Promise<Album | null> {
  try {
    const albumDoc = await getDoc(doc(db, ALBUMS_COLLECTION, id))

    if (!albumDoc.exists()) {
      return null
    }

    const albumData = albumDoc.data()

    // Convertir Timestamp a número
    const createdAt = albumData.createdAt instanceof Timestamp ? albumData.createdAt.toMillis() : albumData.createdAt

    const updatedAt = albumData.updatedAt instanceof Timestamp ? albumData.updatedAt.toMillis() : albumData.updatedAt

    return {
      id: albumDoc.id,
      ...albumData,
      createdAt,
      updatedAt,
    } as Album
  } catch (error) {
    console.error("Error getting album:", error)
    throw error
  }
}

export async function getAlbumBySlug(slug: string): Promise<Album | null> {
  try {
    const albumsQuery = query(collection(db, ALBUMS_COLLECTION), where("slug", "==", slug), limit(1))
    const albumsSnapshot = await getDocs(albumsQuery)

    if (albumsSnapshot.empty) {
      return null
    }

    const albumDoc = albumsSnapshot.docs[0]
    const albumData = albumDoc.data()

    // Convertir Timestamp a número
    const createdAt = albumData.createdAt instanceof Timestamp ? albumData.createdAt.toMillis() : albumData.createdAt

    const updatedAt = albumData.updatedAt instanceof Timestamp ? albumData.updatedAt.toMillis() : albumData.updatedAt

    return {
      id: albumDoc.id,
      ...albumData,
      createdAt,
      updatedAt,
    } as Album
  } catch (error) {
    console.error("Error getting album by slug:", error)
    throw error
  }
}

export async function getAllAlbums(): Promise<Album[]> {
  try {
    const albumsQuery = query(collection(db, ALBUMS_COLLECTION), orderBy("date", "desc"))
    const albumsSnapshot = await getDocs(albumsQuery)

    const albums = await Promise.all(
      albumsSnapshot.docs.map(async (albumDoc) => {
        const albumData = albumDoc.data()

        // Obtener el conteo de imágenes
        const imagesQuery = query(collection(db, GALLERY_IMAGES_COLLECTION), where("albumId", "==", albumDoc.id))
        const imagesSnapshot = await getDocs(imagesQuery)
        const imageCount = imagesSnapshot.size

        // Obtener la imagen de portada (primera imagen)
        let coverImage = undefined
        if (imageCount > 0) {
          const firstImage = imagesSnapshot.docs[0].data() as GalleryImage
          coverImage = firstImage.url
        }

        // Convertir Timestamp a número
        const createdAt =
          albumData.createdAt instanceof Timestamp ? albumData.createdAt.toMillis() : albumData.createdAt

        const updatedAt =
          albumData.updatedAt instanceof Timestamp ? albumData.updatedAt.toMillis() : albumData.updatedAt

        return {
          id: albumDoc.id,
          ...albumData,
          createdAt,
          updatedAt,
          imageCount,
          coverImage,
        } as Album
      }),
    )

    return albums
  } catch (error) {
    console.error("Error getting all albums:", error)
    throw error
  }
}

// Funciones para imágenes
export async function uploadImage(
  file: File,
  albumId: string,
  albumSlug: string,
  name?: string,
  slug?: string,
): Promise<GalleryImage> {
  try {
    // Generar nombre y slug si no se proporcionan
    const fileName = name || file.name.split(".")[0]
    const fileSlug = slug || slugify(fileName)

    // Crear ruta en Storage
    const fileExtension = file.name.split(".").pop()
    const storagePath = `gallery/${albumSlug}/${fileSlug}.${fileExtension}`
    const storageRef = ref(storage, storagePath)

    // Subir archivo
    await uploadBytes(storageRef, file)

    // Obtener URL pública
    const downloadURL = await getDownloadURL(storageRef)

    // Crear objeto Image para guardar en Firestore
    const image: Omit<GalleryImage, "id"> = {
      albumId,
      url: downloadURL,
      name: fileName,
      slug: fileSlug,
      alt: `Imagen de ${fileName} en evento ${albumSlug}`,
      width: 0, // Se actualizará después
      height: 0, // Se actualizará después
      uploadedAt: Date.now(),
      order: 0, // Se actualizará después
    }

    // Obtener dimensiones reales de la imagen
    const img = new Image()
    img.src = downloadURL
    await new Promise((resolve) => {
      img.onload = resolve
    })

    image.width = img.width
    image.height = img.height

    // Obtener el orden más alto actual
    const imagesQuery = query(
      collection(db, GALLERY_IMAGES_COLLECTION),
      where("albumId", "==", albumId),
      orderBy("order", "desc"),
      limit(1),
    )
    const imagesSnapshot = await getDocs(imagesQuery)

    if (!imagesSnapshot.empty) {
      const highestOrder = (imagesSnapshot.docs[0].data() as GalleryImage).order
      image.order = highestOrder + 1
    }

    // Guardar en Firestore
    const docRef = await addDoc(collection(db, GALLERY_IMAGES_COLLECTION), image)

    return {
      id: docRef.id,
      ...image,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

export async function updateImage(
  id: string,
  image: Partial<Omit<GalleryImage, "id" | "url" | "uploadedAt">>,
): Promise<void> {
  try {
    const imageRef = doc(db, GALLERY_IMAGES_COLLECTION, id)
    await updateDoc(imageRef, image)
  } catch (error) {
    console.error("Error updating image:", error)
    throw error
  }
}

export async function deleteImage(id: string): Promise<void> {
  try {
    // Obtener datos de la imagen
    const imageDoc = await getDoc(doc(db, GALLERY_IMAGES_COLLECTION, id))

    if (!imageDoc.exists()) {
      throw new Error("Image not found")
    }

    const imageData = imageDoc.data() as GalleryImage

    // Eliminar de Storage
    try {
      const imageRef = ref(storage, imageData.url)
      await deleteObject(imageRef)
    } catch (error) {
      console.error("Error deleting image from storage:", error)
    }

    // Eliminar de Firestore
    await deleteDoc(doc(db, GALLERY_IMAGES_COLLECTION, id))
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

export async function getImagesForAlbum(albumId: string, orderByField = "order"): Promise<GalleryImage[]> {
  try {
    const imagesQuery = query(
      collection(db, GALLERY_IMAGES_COLLECTION),
      where("albumId", "==", albumId),
      orderBy(orderByField, "asc"),
    )
    const imagesSnapshot = await getDocs(imagesQuery)

    return imagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GalleryImage[]
  } catch (error) {
    console.error("Error getting images for album:", error)
    throw error
  }
}

export async function getAlbumWithImages(albumId: string): Promise<AlbumWithImages | null> {
  try {
    const album = await getAlbum(albumId)

    if (!album) {
      return null
    }

    const images = await getImagesForAlbum(albumId)

    return {
      ...album,
      images,
    }
  } catch (error) {
    console.error("Error getting album with images:", error)
    throw error
  }
}

export async function getAlbumWithImagesBySlug(slug: string): Promise<AlbumWithImages | null> {
  try {
    const album = await getAlbumBySlug(slug)

    if (!album) {
      return null
    }

    const images = await getImagesForAlbum(album.id)

    return {
      ...album,
      images,
    }
  } catch (error) {
    console.error("Error getting album with images by slug:", error)
    throw error
  }
}

export async function updateImageOrder(imageId: string, newOrder: number): Promise<void> {
  try {
    const imageRef = doc(db, GALLERY_IMAGES_COLLECTION, imageId)
    await updateDoc(imageRef, { order: newOrder })
  } catch (error) {
    console.error("Error updating image order:", error)
    throw error
  }
}

export async function getPaginatedImages(
  albumId: string,
  pageSize = 12,
  lastDoc?: DocumentSnapshot,
): Promise<{ images: GalleryImage[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let imagesQuery

    if (lastDoc) {
      imagesQuery = query(
        collection(db, GALLERY_IMAGES_COLLECTION),
        where("albumId", "==", albumId),
        orderBy("order", "asc"),
        startAfter(lastDoc),
        limit(pageSize),
      )
    } else {
      imagesQuery = query(
        collection(db, GALLERY_IMAGES_COLLECTION),
        where("albumId", "==", albumId),
        orderBy("order", "asc"),
        limit(pageSize),
      )
    }

    const imagesSnapshot = await getDocs(imagesQuery)

    const images = imagesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GalleryImage[]

    const newLastDoc = imagesSnapshot.docs.length > 0 ? imagesSnapshot.docs[imagesSnapshot.docs.length - 1] : null

    return {
      images,
      lastDoc: newLastDoc,
    }
  } catch (error) {
    console.error("Error getting paginated images:", error)
    throw error
  }
}

export async function getAlbumsByYear(year: number): Promise<Album[]> {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const albumsQuery = query(
      collection(db, ALBUMS_COLLECTION),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc"),
    )

    const albumsSnapshot = await getDocs(albumsQuery)

    return albumsSnapshot.docs.map((doc) => {
      const data = doc.data()

      // Convertir Timestamp a número
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt

      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
      } as Album
    })
  } catch (error) {
    console.error("Error getting albums by year:", error)
    throw error
  }
}

export async function getAvailableYears(): Promise<number[]> {
  try {
    const albumsQuery = query(collection(db, ALBUMS_COLLECTION), orderBy("date", "desc"))
    const albumsSnapshot = await getDocs(albumsQuery)

    const years = new Set<number>()

    albumsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const year = new Date(data.date).getFullYear()
      years.add(year)
    })

    return Array.from(years).sort((a, b) => b - a) // Ordenar de más reciente a más antiguo
  } catch (error) {
    console.error("Error getting available years:", error)
    throw error
  }
}
