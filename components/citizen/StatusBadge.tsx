import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "open" | "in_progress" | "resolved"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    open: "default" as const,
    in_progress: "warning" as const,
    resolved: "success" as const,
  }

  const labels = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
  }

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  )
}
