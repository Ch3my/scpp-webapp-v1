import * as React from "react"
import { Input } from "./ui/input"

interface NumberInputProps {
  /** The numeric value to display (may be negative or decimal). */
  value: number
  /** Callback returning the updated numeric value (NaN if invalid). */
  onChange: (updatedValue: number) => void
  /**
   * How many decimal places to allow in formatting.
   *   e.g. 0 => integer only, 2 => "1,234.56", etc.
   */
  decimalPlaces?: number
  /** Character used as the thousands grouping separator, e.g. "." or "," */
  thousandsSeparator?: string
  /** Character used as the decimal separator, e.g. "," or "." */
  decimalSeparator?: string
}

/**
 * A flexible number input component that:
 *  - Restricts user input to digits, an optional leading '-', multiple thousands separators, and a single decimal separator
 *  - Removes thousands separators and replaces the decimal separator for correct parsing
 *  - Formats the value with a manual approach, inserting the given thousands and decimal separators
 *  - Preserves "-0" if explicitly typed
 *  - Calls onChange with either a valid numeric or NaN
 */
export function NumberInput({
  value,
  onChange,
  decimalPlaces = 2,
  thousandsSeparator = ",",
  decimalSeparator = ".",
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")

  //
  // 1) Whenever `value` (from the parent) changes, we re-format the display
  //
  React.useEffect(() => {
    if (Number.isNaN(value) || value === null || value === undefined) {
      setDisplayValue("")
    } else {
      // If you want to detect negative zero from the parent, you'd do so here.
      // By default, we just treat numeric -0 as 0.
      setDisplayValue(
        formatNumber(value, thousandsSeparator, decimalSeparator, decimalPlaces)
      )
    }
  }, [value, thousandsSeparator, decimalSeparator, decimalPlaces])

  //
  // 2) Restrict user keystrokes:
  //    - Digits [0-9]
  //    - an optional leading '-'
  //    - multiple thousands separators
  //    - one decimal separator
  //    - typical navigation keys
  //
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { key, currentTarget, ctrlKey, metaKey } = e

    // Typical navigation & editing keys we should allow
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Tab",
      "Enter",
    ]
    if (allowedKeys.includes(key) || ctrlKey || metaKey) {
      return
    }

    // If user pressed '-', only allow if it's the first character
    // and hasn't already typed one.
    if (key === "-") {
      if (currentTarget.selectionStart === 0 && !currentTarget.value.includes("-")) {
        return
      }
      e.preventDefault()
      return
    }

    // If user pressed the decimal separator (e.g. comma), only allow one
    if (key === decimalSeparator) {
      if (currentTarget.value.includes(decimalSeparator)) {
        e.preventDefault()
        return
      }
      return
    }

    // Thousands separators can appear multiple times (the user may type them manually).
    // We'll remove them before parse, so we do NOT limit them here.
    if (key === thousandsSeparator) {
      return
    }

    // If it's a digit, let it pass
    if (/^\d$/.test(key)) {
      return
    }

    // Block anything else
    e.preventDefault()
  }

  //
  // 3) OnChange => parse & format
  //
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value

    // If empty => pass NaN to parent, clear display
    if (userInput.trim() === "") {
      onChange(NaN)
      setDisplayValue("")
      return
    }

    // If user explicitly typed "-0", preserve it visually
    if (userInput === "-0") {
      // Numerically, parseFloat("-0") is -0 => 0 in most JS operations
      onChange(0)
      setDisplayValue("-0")
      return
    }

    // 1) Remove all thousands separators
    //    (e.g. "1.234.567,89" => "1234567,89" if thousandsSeparator='.' & decimalSeparator=',')
    const noThousands = userInput.split(thousandsSeparator).join("")

    // 2) Convert the custom decimal separator to a standard '.' for parseFloat
    //    (e.g. "1234567,89" => "1234567.89" if decimalSeparator=',')
    const normalized = noThousands.replace(decimalSeparator, ".")

    // 3) Parse
    const numericValue = parseFloat(normalized)

    // If parse fails => NaN
    if (Number.isNaN(numericValue)) {
      onChange(NaN)
      setDisplayValue(userInput) // keep raw so user can fix it
      return
    }

    // If valid => update parent
    onChange(numericValue)

    // 4) Format for display
    const formatted = formatNumber(
      numericValue,
      thousandsSeparator,
      decimalSeparator,
      decimalPlaces
    )
    setDisplayValue(formatted)
  }

  return (
    <Input
      value={displayValue}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
    />
  )
}

/**
 * Manually format a number using given thousandsSeparator, decimalSeparator,
 * and a fixed decimalPlaces count (rounding if needed).
 *
 * Example:
 *   formatNumber(1234567.89123, ".", ",", 2) => "1.234.567,89"
 *   formatNumber(-9876543.21, " ", ",", 0) => "-9 876 543"
 */
function formatNumber(
  value: number,
  thousandsSeparator: string,
  decimalSeparator: string,
  decimalPlaces: number
): string {
  // Round to the specified number of decimal places
  const roundedValue = decimalPlaces >= 0
    ? parseFloat(value.toFixed(decimalPlaces))
    : value

  // Convert to string with that many decimals
  const baseString = decimalPlaces >= 0
    ? roundedValue.toFixed(decimalPlaces)
    : String(roundedValue)

  // Handle negative zero => "-0.00"
  // If we specifically want to show "-0.00" instead of "0.00", do:
  if (Object.is(roundedValue, -0)) {
    // If decimalPlaces=0, just show "-0"
    if (decimalPlaces === 0) {
      return "-0"
    } else {
      // e.g. decimalPlaces=2 => "-0.00"
      return "-" + "0" + decimalSeparator + "0".repeat(decimalPlaces)
    }
  }

  // Split integer & fraction
  const [integerPart, fractionPart = ""] = baseString.split(".")

  // Insert thousands separators into the integer part
  const withThousands = addThousandsSeparators(integerPart, thousandsSeparator)

  // If there are no decimals (decimalPlaces=0), return just the integer part
  if (decimalPlaces === 0) {
    return withThousands
  }

  // Otherwise, combine integerPart + fractionPart
  return withThousands + decimalSeparator + fractionPart
}

/** Insert thousands separators into the integer part manually */
function addThousandsSeparators(valueStr: string, sep: string): string {
  // e.g. "1234567" with sep="." => "1.234.567"
  // We can do a simple RegEx approach:
  // Reverse the string, group digits in sets of 3, join with sep, then reverse back
  const isNegative = valueStr.startsWith("-")
  const raw = isNegative ? valueStr.slice(1) : valueStr

  // Reverse the digits => "7654321"
  const reversed = raw.split("").reverse()

  // Insert separator every 3 digits
  const groups: string[] = []
  for (let i = 0; i < reversed.length; i += 3) {
    groups.push(reversed.slice(i, i + 3).join(""))
  }
  // groups => ["765", "432", "1"]

  const joined = groups.join(sep) // => "765.432.1"

  // Reverse again => "1.234.567"
  const finalStr = joined.split("").reverse().join("")
  return isNegative ? "-" + finalStr : finalStr
}
