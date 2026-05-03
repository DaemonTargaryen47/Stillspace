import DOMPurify from 'isomorphic-dompurify'

export const sanitize = (str) => {
  if (!str || typeof str !== 'string') return ''
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

export const sanitizeStatus = (str) => {
  if (!str) return ''
  return sanitize(str).slice(0, 50)
}

export const sanitizeDisplayName = (str) => {
  if (!str) return ''
  return sanitize(str).slice(0, 30)
}

export const sanitizeMessage = (str) => {
  if (!str) return ''
  return sanitize(str).slice(0, 5000)
}

export const sanitizeFeedback = (str) => {
  if (!str) return ''
  return sanitize(str).slice(0, 2000)
}
