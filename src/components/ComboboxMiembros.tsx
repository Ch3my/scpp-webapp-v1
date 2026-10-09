import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useMiembros } from "@/api/hooks"

interface ComboboxMiembrosProps {
  /** 0 means "nadie en particular" */
  value: number;
  onChange: (value: number) => void;
  /**
   * The miembro already on the gasto, as the gasto reports it. /miembros lists active
   * people only, so a since-deactivated one would otherwise render blank.
   */
  current?: { id: number; nombre: string } | null;
  disabled?: boolean;
}

/** "Para quién" picker: the active people in the caller's family. */
export function ComboboxMiembros({ value, onChange, current, disabled }: ComboboxMiembrosProps) {
  const [open, setOpen] = React.useState(false)
  const { data: miembros = [] } = useMiembros()

  const options = React.useMemo(() => {
    const listed = miembros.map((m) => ({ id: m.id, nombre: m.nombre, activo: true }))
    if (current && current.id === value && !listed.some((m) => m.id === current.id)) {
      return [{ ...current, activo: false }, ...listed]
    }
    return listed
  }, [miembros, current, value])

  const selected = options.find((m) => m.id === value) ?? null

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between overflow-hidden font-normal",
            selected && !selected.activo && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selected
              ? `${selected.nombre}${selected.activo ? '' : ' (inactivo)'}`
              : <>&nbsp;</>}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] max-w-[calc(100vw-1.5rem)] p-0" align="start">
        <Command>
          <CommandInput className="h-9" placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>No encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="(Nadie en particular)"
                onSelect={() => {
                  setOpen(false);
                  onChange(0);
                }}
              >
                <span className="text-muted-foreground italic">(Nadie en particular)</span>
                <Check className={cn("ml-auto", value === 0 ? "opacity-100" : "opacity-0")} />
              </CommandItem>
            </CommandGroup>
            <CommandGroup className="max-h-50">
              {options.map((miembro) => (
                <CommandItem
                  key={miembro.id}
                  value={`${miembro.nombre} ${miembro.id}`}
                  onSelect={() => {
                    setOpen(false);
                    onChange(miembro.id === value ? 0 : miembro.id);
                  }}
                >
                  <span className={cn(!miembro.activo && "text-muted-foreground")}>
                    {miembro.nombre}{miembro.activo ? '' : ' (inactivo)'}
                  </span>
                  <Check
                    className={cn("ml-auto", value === miembro.id ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
