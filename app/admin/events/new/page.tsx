import { EventForm } from "@/components/admin/event-form"

export const viewport = {
  themeColor: "#000000",
}

export default function NewEventPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EventForm />
    </div>
  )
}
