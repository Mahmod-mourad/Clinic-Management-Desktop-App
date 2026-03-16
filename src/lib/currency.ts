// ALL money in DB is stored as INTEGER piasters (1 pound = 100 piasters)
// NEVER use floats for money

export function poundsToPiasters(pounds: number): number {
  return Math.round(pounds * 100)
}

export function piastersToPounds(piasters: number): number {
  return piasters / 100
}

export function formatEGP(piasters: number): string {
  const pounds = piastersToPounds(piasters)
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds) + ' ج.م'
}

export function formatEGPSimple(piasters: number): string {
  return (piasters / 100).toFixed(2) + ' ج.م'
}
