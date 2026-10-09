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
 * Dashboard "para" filter, as an icon-only trigger so it fits any toolbar. The icon
 * turns primary while a person is selected, and the tooltip names them. Renders
 * nothing while the family has a single person, because then there is nobody to
 * filter by.
 */
export function MiembroFilterSelect({ value, onChange, className }: MiembroFilterSelectProps) {
  const { data: miembros = [] } = useMiembros()
  if (miembros.length < 2) return null

  const selected = miembros.find((m) => m.id === value)
  const label = selected ? `Para: ${selected.nombre}` : "Para: todos"

  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger
        aria-label={label}
        title={label}
        className={cn("w-auto shrink-0 gap-1 px-2.5", selected && "border-primary text-primary", className)}
      >
        {/* Explicit colour: the trigger otherwise mutes any icon without one, and it
            should read like the white icons on the buttons beside it */}
        <User className={cn(selected ? "text-primary" : "text-foreground")} />
        {/* Radix needs the value rendered to track the selection; it stays off screen */}
        <span className="sr-only">
          <SelectValue />
        </span>
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

/**
 * Who entered a gasto, as a quiet outline tag - deliberately less prominent than the
 * "para" badge, which is the information people act on. With `abreviatura` it shows
 * that instead of the name (the desktop column); the full name is always the tooltip.
 * The abbreviation comes from the server, which owns the fallback rule.
 */
export function AutorBadge({
  nombre,
  abreviatura,
  className,
}: {
  nombre: string
  abreviatura?: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      title={`Registrado por ${nombre}`}
      className={cn("text-muted-foreground min-w-0 border-border/70 px-1.5 py-0 font-normal", className)}
    >
      <span className="truncate">{abreviatura ?? nombre}</span>
    </Badge>
  )
}
