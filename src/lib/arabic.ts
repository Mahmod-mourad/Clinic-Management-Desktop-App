// Normalize Arabic text for search
// Handles: أإآا → ا, ة → ه, ى → ي, ؤ → و, ئ → ي
export function normalizeArabic(text: string): string {
  if (!text) return ''
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim()
    .toLowerCase()
}

// Check if text matches query (Arabic-aware)
export function arabicMatch(text: string, query: string): boolean {
  return normalizeArabic(text).includes(normalizeArabic(query))
}

// Arabic numerals (Eastern Arabic)
export function toArabicNumerals(num: number | string): string {
  return String(num).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])
}
