import { EventForm } from "@/components/admin/event-form"

interface EditEventPageProps {
  params: {
    id: string
  }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8">
      <EventForm eventId={id} />
    </div>
  )
}
