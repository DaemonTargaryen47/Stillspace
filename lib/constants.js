export const STATUSES = [
  { id: 'okay', label: "I'm okay", color: '#8a9e8c', bg: '#f0f5f0' },
  { id: 'space', label: "I need space today", color: '#a09080', bg: '#f5f0eb' },
  { id: 'overwhelmed', label: "I feel overwhelmed", color: '#9a8aaa', bg: '#f2eef7' },
  { id: 'engaging', label: "I feel like engaging today", color: '#7a9aaa', bg: '#eef3f7' },
  { id: 'lonely', label: "I feel lonely today", color: '#a08090', bg: '#f5eef2' },
  { id: 'distant', label: "I'm emotionally distant today", color: '#909090', bg: '#f0f0f0' },
  { id: 'present', label: "I'm quiet but present", color: '#8aaa90', bg: '#eef5f0' },
  { id: 'good', label: "I feel good today", color: '#7aaa7a', bg: '#ecf5ec' },
]

export const ACKNOWLEDGEMENTS = [
  { id: 'seen', label: 'seen', icon: 'o' },
  { id: 'thinking', label: 'thinking of you', icon: '<>' },
  { id: 'silent', label: 'silent support', icon: '^' },
  { id: 'here', label: "I'm here if needed", icon: '[]' },
]

export const MOCK_CIRCLE = [
  { id: 'm1', initials: 'A', status: 'okay' },
  { id: 'm2', initials: 'J', status: 'space' },
  { id: 'm3', initials: 'S', status: 'present' },
  { id: 'm4', initials: 'M', status: 'overwhelmed' },
  { id: 'm5', initials: 'R', status: 'good' },
  { id: 'm6', initials: 'T', status: 'engaging' },
  { id: 'm7', initials: 'L', status: 'lonely' },
  { id: 'm8', initials: 'K', status: 'distant' },
  { id: 'm9', initials: 'P', status: 'space' },
  { id: 'm10', initials: 'E', status: 'okay' },
]

export const EMOTIONAL_REFLECTIONS = {
  tired: "That sounds like a heavy day.",
  sad: "It is okay to feel that way. You are not alone.",
  overwhelmed: "Take a breath. You do not have to hold everything at once.",
  anxious: "Your feelings make sense. You are allowed to feel unsettled.",
  okay: "Okay is enough. Really.",
  good: "That is gentle and good.",
  lonely: "Loneliness is real. Your presence here matters.",
  happy: "Let that stay with you for a moment.",
  confused: "Uncertainty is hard to carry. That is valid.",
  numb: "Sometimes quiet is where we go when we need rest.",
  default: "Thank you for sharing that. It takes something to say it out loud.",
}

export const getReflection = (text) => {
  const t = text.toLowerCase()
  for (const [key, val] of Object.entries(EMOTIONAL_REFLECTIONS)) {
    if (key !== 'default' && t.includes(key)) return val
  }
  return EMOTIONAL_REFLECTIONS.default
}

export const getStatus = (id) => STATUSES.find(s => s.id === id)