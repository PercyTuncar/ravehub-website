export interface Album {
  id: string
  name: string
  date: string
  description: string
  slug: string
  createdAt: number
  updatedAt: number
  imageCount?: number
  coverImage?: string
}

export interface GalleryImage {
  id: string
  albumId: string
  url: string
  name: string
  slug: string
  alt: string
  width: number
  height: number
  uploadedAt: number
  order: number
}

export interface AlbumWithImages extends Album {
  images: GalleryImage[]
}
