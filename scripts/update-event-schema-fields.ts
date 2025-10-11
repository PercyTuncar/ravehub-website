import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Function to strip HTML tags and create plain text (reuse from existing script)
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

async function updateExistingEventsWithSchemaFields() {
  try {
    console.log('Starting to update event schema fields...')

    const eventsRef = collection(db, "events")
    const querySnapshot = await getDocs(eventsRef)

    let updatedCount = 0

    for (const document of querySnapshot.docs) {
      const eventData = document.data()
      const eventId = document.id

      const updates: any = {}

      // Check and add missing organizer
      if (!eventData.organizer) {
        updates.organizer = {
          name: "RAVEHUB",
          url: "https://ravehublatam.com"
        }
        console.log(`Adding organizer to event ${eventId}`)
      }

      // Check and add missing eventStatus
      if (!eventData.eventStatus) {
        updates.eventStatus = "https://schema.org/EventScheduled"
        console.log(`Adding eventStatus to event ${eventId}`)
      }

      // Check and add missing eventAttendanceMode
      if (!eventData.eventAttendanceMode) {
        updates.eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode"
        console.log(`Adding eventAttendanceMode to event ${eventId}`)
      }

      // Check and add missing inLanguage
      if (!eventData.inLanguage) {
        updates.inLanguage = "es"
        console.log(`Adding inLanguage to event ${eventId}`)
      }

      // Check and add missing descriptionText
      if (!eventData.descriptionText && eventData.description) {
        updates.descriptionText = stripHtmlTags(eventData.description)
        console.log(`Adding descriptionText to event ${eventId}`)
      }

      // Check and add missing endTime
      if (!eventData.endTime) {
        updates.endTime = "23:00"
        console.log(`Adding endTime to event ${eventId}`)
      }

      // Check and add missing isMultiDay
      if (eventData.isMultiDay === undefined) {
        updates.isMultiDay = false
        console.log(`Adding isMultiDay to event ${eventId}`)
      }

      // Note: startTime is handled dynamically in the schema, no default needed

      // If there are updates, apply them
      if (Object.keys(updates).length > 0) {
        console.log(`Updating event ${eventId} with:`, updates)
        await updateDoc(doc(db, "events", eventId), updates)
        updatedCount++
      }
    }

    console.log(`Successfully updated ${updatedCount} events`)

    return {
      success: true,
      updatedCount
    }

  } catch (error) {
    console.error('Error updating event schema fields:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// For backward compatibility when running as a script
if (require.main === module) {
  updateExistingEventsWithSchemaFields()
    .then((result) => {
      if (result.success) {
        console.log('Update completed successfully')
        process.exit(0)
      } else {
        console.error('Update failed:', result.error)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('Update failed:', error)
      process.exit(1)
    })
}