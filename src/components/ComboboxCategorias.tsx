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
import { useCategorias } from "@/api/hooks"

interface ComboboxCategoriasProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ComboboxCategorias({ value, onChange, disabled }: ComboboxCategoriasProps) {
  const [open, setOpen] = React.useState(false)
  const { data: categorias = [] } = useCategorias()

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between overflow-hidden font-normal"
          disabled={disabled}
        >
          <span className="truncate">
            {value
              ? categorias.find((categoria) => categoria.id === value)?.descripcion
              : <>&nbsp;</>}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] max-w-[calc(100vw-1.5rem)] p-0" align="start">
        <Command>
          <CommandInput className="h-9" />
          <CommandList>
            <CommandEmpty>No encontrado</CommandEmpty>
            <CommandGroup className="max-h-40">
              {categorias.map((categoria) => (
                <CommandItem
                  key={categoria.id}
                  value={categoria.descripcion}
                  onSelect={(currentValue) => {
                    const selectedCategory = categorias.find(
                      (cat) => cat.descripcion.toLowerCase() === currentValue.toLowerCase()
                    );
                    if (selectedCategory) {
                      onChange(selectedCategory.id === value ? 0 : selectedCategory.id);
                    }
                    setOpen(false);
                  }}
                >
                  {categoria.descripcion}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === categoria.id ? "opacity-100" : "opacity-0"
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