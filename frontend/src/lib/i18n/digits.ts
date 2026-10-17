const NE_DIGITS = '०१२३४५६७८९'

/** 2026 → २०२६ */
export const neDigits = (n: number | string) =>
  String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)])
