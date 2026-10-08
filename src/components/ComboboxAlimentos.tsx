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
import { Food } from "@/models/Food"
import { useFoodItemQuantity } from "@/api/hooks";

interface ComboboxAlimentosProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  hideTodos?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ComboboxAlimentos({
  value,
  onChange,
  disabled,
  hideTodos,
  open: controlledOpen,
  onOpenChange
}: ComboboxAlimentosProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Shares FoodSummary's cache entry - this used to be a second request for
  // the same endpoint under a separate key.
  const { data: foods = [] } = useFoodItemQuantity();

  const allFoods = hideTodos ? foods : [{ id: 0, name: "(Todos)" } as Food, ...foods];

  // Simplified display logic
  const getDisplayText = () => {
    const selectedFood = allFoods.find(food => food.id === value);

    if (selectedFood) {
      return selectedFood.name;
    }

    // When no selection and hideTodos is true, show nbsp
    if (hideTodos) {
      return "\u00A0"; // Unicode non-breaking space
    }

    // Default fallback
    return "(Todos)";
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          // w-full below sm so it shrinks into a phone-width row; desktop keeps 300px
          className="justify-between overflow-hidden font-normal w-full sm:w-75"
          disabled={disabled}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {/* max-w cap so the 300px panel cannot overflow a narrow phone */}
      <PopoverContent className="w-75 max-w-[calc(100vw-1.5rem)] p-0" align="start">
        <Command>
          <CommandInput className="h-9" />
          <CommandList>
            <CommandEmpty>No encontrado</CommandEmpty>
            <CommandGroup className="max-h-50">
              {allFoods.map((food) => (
                <CommandItem
                  key={food.id}
                  value={food.name}
                  onSelect={(currentValue) => {
                    const selectedFood = allFoods.find(
                      (f) => f.name.toLowerCase() === currentValue.toLowerCase()
                    );

                    setOpen(false);
                    if (selectedFood && selectedFood.id !== value) {
                      setTimeout(()=> {
                        // Apparently shadcn Problem caused freeze, we bypass using setTimeout
                        onChange(selectedFood.id);
                      },0)
                    }
                  }}
                >
                  {food.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === food.id ? "opacity-100" : "opacity-0"
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