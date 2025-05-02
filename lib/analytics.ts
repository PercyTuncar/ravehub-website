// Analytics event tracking
type EventProps = {
  action: string
  category: string
  label?: string
  value?: number
}

export const event = ({ action, category, label, value }: EventProps) => {
  if (typeof window !== "undefined" && typeof window.gtag !== "undefined") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}
