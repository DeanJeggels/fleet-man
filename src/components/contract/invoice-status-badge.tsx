import { Badge } from "@/components/ui/badge"

const VARIANTS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 line-through" },
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const v = VARIANTS[status] ?? VARIANTS.draft
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
  )
}
