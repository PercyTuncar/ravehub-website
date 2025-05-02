import * as React from "react"

import { cn } from "@/lib/utils"

const Pre = React.forwardRef<HTMLPreElement, React.HTMLAttributes<HTMLPreElement>>(({ className, ...props }, ref) => {
  return <pre className={cn("relative rounded-md border bg-muted/50 overflow-auto", className)} ref={ref} {...props} />
})

Pre.displayName = "Pre"

export { Pre }
