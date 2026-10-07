import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useQuery } from '@tanstack/react-query';

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
import { Proyecto } from "@/models/Proyecto"
import api from "@/lib/api";

interface ComboboxProyectosProps {
  /** 0 means "sin proyecto" */
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ComboboxProyectos({ value, onChange, disabled }: ComboboxProyectosProps) {
  const [open, setOpen] = React.useState(false)

  // Own query key so a picker inside a dialog never fights the Proyectos screen's list query
  const { data: proyectos = [] } = useQuery<Proyecto[]>({
    queryKey: ['proyectosCombobox'],
    queryFn: async () => {
      const { data } = await api.get("/proyectos");
      return data;
    }
  });

  const selected = proyectos.find((p) => p.id === value) ?? null;

  const options = React.useMemo(() => {
    const activos = proyectos.filter((p) => p.activo);
    // Keep the current assignment selectable even if it has since been deactivated,
    // otherwise the trigger would render blank and an unrelated edit would silently
    // save fk_proyecto: null.
    return selected && !selected.activo ? [selected, ...activos] : activos;
  }, [proyectos, selected]);

  const handleSelect = (proyecto: Proyecto) => {
    setOpen(false);
    onChange(proyecto.id === value ? 0 : proyecto.id);
  };

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
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput className="h-9" placeholder="Buscar proyecto..." />
          <CommandList>
            <CommandEmpty>No encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="(Sin proyecto)"
                onSelect={() => {
                  setOpen(false);
                  onChange(0);
                }}
              >
                <span className="text-muted-foreground italic">(Sin proyecto)</span>
                <Check
                  className={cn("ml-auto", value === 0 ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
            </CommandGroup>
            <CommandGroup className="max-h-50">
              {options.map((proyecto) => (
                <CommandItem
                  key={proyecto.id}
                  value={proyecto.nombre}
                  onSelect={() => handleSelect(proyecto)}
                >
                  <span className={cn(!proyecto.activo && "text-muted-foreground")}>
                    {proyecto.nombre}{proyecto.activo ? '' : ' (inactivo)'}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto",
                      value === proyecto.id ? "opacity-100" : "opacity-0"
                    )}
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
