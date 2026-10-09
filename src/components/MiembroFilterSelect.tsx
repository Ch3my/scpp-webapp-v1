import { User } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMiembros } from "@/api/hooks"

interface MiembroFilterSelectProps {
  /** 0 means everyone */
  value: number
  onChange: (value: number) => void
  className?: string
}

/**
 * Dashboard "para" filter. Renders nothing while the family has a single person,
 * because then there is nobody to filter by.
 */
export function MiembroFilterSelect({ value, onChange, className }: MiembroFilterSelectProps) {
  const { data: miembros = [] } = useMiembros()
  if (miembros.length < 2) return null

  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className={className} aria-label="Para">
        <User className="opacity-60" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Para</SelectLabel>
          <SelectItem value="0">Todos</SelectItem>
          {miembros.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>
              {m.nombre}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/**
 * Who a gasto is "para", as a small tag. Shared by the desktop table and the mobile
 * cards so the two never drift apart.
 */
export function MiembroBadge({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-chart-2/10 text-chart-2 min-w-0 gap-1 border-transparent px-2 py-0 font-normal",
        className
      )}
    >
      <User className="size-3 shrink-0" />
      <span className="truncate">{nombre}</span>
    </Badge>
  )
}
