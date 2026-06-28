/**
 * lang.js — Language switcher utility
 * Bahasa: Indonesia (id) | Basa Jawa (jw) | Basa Madura (md)
 */

export const LANG_KEY    = 'rajasa-lang'
export const LANGS       = ['id', 'jw', 'md']
export const LANG_LABELS = { id: 'ID', jw: 'JW', md: 'MD' }
export const LANG_NAMES  = { id: 'Indonesia', jw: 'Basa Jawa', md: 'Basa Madura' }

export function getLang() {
  return localStorage.getItem(LANG_KEY) || 'id'
}

export function nextLang(current) {
  const idx = LANGS.indexOf(current)
  return LANGS[(idx + 1) % LANGS.length]
}

export function setStoredLang(lang) {
  localStorage.setItem(LANG_KEY, lang)
  // Broadcast ke komponen lain yang mungkin listen
  window.dispatchEvent(new CustomEvent('rajasa-lang-change', { detail: lang }))
}
