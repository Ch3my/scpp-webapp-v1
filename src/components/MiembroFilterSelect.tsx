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
 * Dashboard person filter, as an icon-only trigger so it fits any toolbar. The icon
 * turns primary while a person is selected, and the tooltip names them. Renders
 * nothing while the family has a single person, because then there is nobody to
 * filter by.
 */
export function MiembroFilterSelect({ value, onChange, className }: MiembroFilterSelectProps) {
  const { data: miembros = [] } = useMiembros()
  if (miembros.length < 2) return null

  const selected = miembros.find((m) => m.id === value)
  const label = selected ? `Persona: ${selected.nombre}` : "Persona: todos"

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
          <SelectLabel>Persona</SelectLabel>
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
 * Whose a gasto is, as a quiet outline tag. With `abreviatura` it shows that instead of
 * the name (the narrow desktop column); the full name is always the tooltip. Shared by
 * the desktop table and the mobile cards so the two never drift apart. The
 * abbreviation comes from the server, which owns the fallback rule.
 */
export function PersonaBadge({
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
      title={nombre}
      className={cn("text-muted-foreground min-w-0 border-border/70 px-1.5 py-0 font-normal", className)}
    >
      <span className="truncate">{abreviatura ?? nombre}</span>
    </Badge>
  )
}
