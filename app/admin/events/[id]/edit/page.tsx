import { EventForm } from "@/components/admin/event-form"

interface EditEventPageProps {
  params: {
    id: string
  }
}

export default function EditEventPage({ params }: EditEventPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <EventForm eventId={params.id} />
    </div>
  )
}
