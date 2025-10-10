import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Function to strip HTML tags and create plain text
const stripHtmlTags = (html: string): string => {
  if (!html || typeof html !== 'string') return ''

  // First, remove script and style tags completely
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags and content
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Replace common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")

  // Clean up extra whitespace and line breaks
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
    .trim()

  // Limit to reasonable length for schema (Google recommends ~160 characters)
  if (text.length > 160) {
    text = text.substring(0, 157) + '...'
  }

  return text
}

async function updateEventDescriptions() {
  try {
    console.log('Starting to update event descriptions...')

    const eventsRef = collection(db, "events")
    const querySnapshot = await getDocs(eventsRef)

    let updatedCount = 0

    for (const document of querySnapshot.docs) {
      const eventData = document.data()
      const eventId = document.id

      // Check if the event has a description but no descriptionText, or if descriptionText contains HTML
      const needsUpdate =
        (eventData.description && !eventData.descriptionText) ||
        (eventData.descriptionText && eventData.descriptionText.includes('<'))

      if (needsUpdate) {
        const descriptionText = eventData.description ? stripHtmlTags(eventData.description) : eventData.shortDescription || ''

        console.log(`Updating event ${eventId}:`)
        console.log(`  Original descriptionText: ${eventData.descriptionText?.substring(0, 100)}...`)
        console.log(`  New descriptionText: ${descriptionText.substring(0, 100)}...`)

        await updateDoc(doc(db, "events", eventId), {
          descriptionText: descriptionText
        })

        updatedCount++
      }
    }

    console.log(`Successfully updated ${updatedCount} events`)

  } catch (error) {
    console.error('Error updating event descriptions:', error)
  }
}

// Run the update
updateEventDescriptions()
  .then(() => {
    console.log('Update completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Update failed:', error)
    process.exit(1)
  })