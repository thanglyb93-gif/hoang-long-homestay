export function roundToNearestHundredThousand(price: number): number {
  const remainder = price % 100000
  return remainder >= 50000
    ? price - remainder + 100000
    : price - remainder
}
