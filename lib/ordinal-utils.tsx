/**
 * Converts a number to its ordinal representation with proper suffix
 * @param num - The number to convert
 * @returns Object with number and suffix for professional display
 */
export function getOrdinalParts(num: number | undefined | null): { number: string; suffix: string } {
  // Handle undefined or null values
  if (num === undefined || num === null) {
    return {
      number: "0",
      suffix: "th",
    }
  }

  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  let suffix: string

  // Special cases for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = "th"
  } else {
    switch (lastDigit) {
      case 1:
        suffix = "st"
        break
      case 2:
        suffix = "nd"
        break
      case 3:
        suffix = "rd"
        break
      default:
        suffix = "th"
        break
    }
  }

  return {
    number: num.toString(),
    suffix: suffix,
  }
}

/**
 * Formats a number as an ordinal string (e.g., "51st", "23rd")
 * @param num - The number to format
 * @returns Formatted ordinal string
 */
export function formatOrdinal(num: number): string {
  const { number, suffix } = getOrdinalParts(num)
  return `${number}${suffix}`
}

/**
 * Component for displaying ordinal numbers with professional styling
 */
export function OrdinalDisplay({
  number,
  className = "",
  size = "normal",
}: {
  number: number
  className?: string
  size?: "small" | "normal" | "large"
}) {
  const { number: numStr, suffix } = getOrdinalParts(number)

  const sizeClasses = {
    small: "text-sm",
    normal: "text-base",
    large: "text-lg",
  }

  const suffixSizeClasses = {
    small: "text-xs",
    normal: "text-sm",
    large: "text-base",
  }

  return (
    <span className={`inline-flex items-start ${sizeClasses[size]} ${className}`}>
      <span className="font-bold">{numStr}</span>
      <sup className={`${suffixSizeClasses[size]} font-medium ml-0.5 -mt-1`}>{suffix}</sup>
    </span>
  )
}
