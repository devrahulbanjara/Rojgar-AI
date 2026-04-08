export type CompanyAccent = {
  logo: string
  color: string
  background: string
}

const COMPANY_ACCENT_TONES = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-accent)',
  'var(--color-text-muted)',
] as const

export function getCompanyAccent(name: string): CompanyAccent {
  const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const color = COMPANY_ACCENT_TONES[seed % COMPANY_ACCENT_TONES.length]

  return {
    logo: name.trim().charAt(0).toUpperCase() || 'C',
    color,
    background: `color-mix(in srgb, ${color} 12%, white)`,
  }
}
