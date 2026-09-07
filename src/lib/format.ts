export function usd(n: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n)
}

export function usdRange(min: number, max: number) {
  return `${usd(min)}–${usd(max)}`
}
