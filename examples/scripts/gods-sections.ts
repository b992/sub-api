/**
 * The Gods & Monsters - Section Configuration
 * Publication: https://thegodsandmonsters.substack.com/
 */

export const GODS_SECTIONS = {
  // Asian mythology and legends
  JOURNEY_TO_EAST: 176210,
  
  // Greek, Roman, and ancient mythologies
  MYTHS_OF_ANCIENTS: 176211,
  
  // Unusual and fascinating historical events
  CURIOUS_HISTORIES: 176365,
  
  // Stories from the Middle Ages
  MEDIEVAL_TALES: 176624,
  
  // Creatures and monsters from various mythologies
  MONSTER_MANUAL: 176629,
  
  // Norse mythology and Viking tales
  VIKING_MYTHS: 179896,
  
  // Death rituals, afterlife beliefs, and related topics
  BEYOND_GRAVE: 179897, // NOTE: Please verify - was listed same as Viking
  
  // Strange and unusual occupations throughout history
  WEIRD_JOBS: 191903
} as const

// Reverse mapping: ID to section name
export const SECTION_NAMES: Record<number, string> = {
  176210: "Journey to the East",
  176211: "Myths of the Ancients",
  176365: "Curious Histories",
  176624: "Medieval Tales",
  176629: "The Monster Manual",
  179896: "Viking Myths and Legends",
  179897: "Beyond the Grave",
  191903: "Weird Jobs of History"
}

// Name to ID mapping (for AI usage)
export const SECTION_MAP: Record<string, number> = {
  "Journey to the East": 176210,
  "Myths of the Ancients": 176211,
  "Curious Histories": 176365,
  "Medieval Tales": 176624,
  "The Monster Manual": 176629,
  "Viking Myths and Legends": 179896,
  "Beyond the Grave": 179897,
  "Weird Jobs of History": 191903
}

// Section descriptions for AI context
export const SECTION_INFO = {
  176210: {
    name: "Journey to the East",
    emoji: "🐉",
    keywords: ["asian", "chinese", "japanese", "korean", "hindu", "dragon", "yokai", "buddha"],
    description: "Asian mythology and legends"
  },
  176211: {
    name: "Myths of the Ancients",
    emoji: "⚡️",
    keywords: ["greek", "roman", "zeus", "apollo", "athena", "olympus", "titan", "ancient"],
    description: "Greek, Roman, and ancient mythologies"
  },
  176365: {
    name: "Curious Histories",
    emoji: "🔎",
    keywords: ["strange", "unusual", "curious", "weird", "bizarre", "historical fact"],
    description: "Unusual and fascinating historical events"
  },
  176624: {
    name: "Medieval Tales",
    emoji: "🏰",
    keywords: ["medieval", "middle ages", "knight", "castle", "feudal", "crusade"],
    description: "Stories from the Middle Ages"
  },
  176629: {
    name: "The Monster Manual",
    emoji: "🐺",
    keywords: ["monster", "creature", "beast", "vampire", "werewolf", "demon"],
    description: "Creatures and monsters from various mythologies"
  },
  179896: {
    name: "Viking Myths and Legends",
    emoji: "❄️",
    keywords: ["viking", "norse", "odin", "thor", "loki", "valhalla", "ragnarok"],
    description: "Norse mythology and Viking tales"
  },
  179897: {
    name: "Beyond the Grave",
    emoji: "💀",
    keywords: ["death", "afterlife", "grave", "funeral", "burial", "ghost", "spirit"],
    description: "Death rituals, afterlife beliefs, and related topics"
  },
  191903: {
    name: "Weird Jobs of History",
    emoji: "🤢",
    keywords: ["job", "occupation", "profession", "work", "trade", "gong farmer"],
    description: "Strange and unusual occupations throughout history"
  }
}

/**
 * Get section ID from section name
 */
export function getSectionId(sectionName: string): number | undefined {
  return SECTION_MAP[sectionName]
}

/**
 * Get section name from ID
 */
export function getSectionName(sectionId: number): string | undefined {
  return SECTION_NAMES[sectionId]
}

/**
 * Categorize content to appropriate section based on keywords
 */
export function categorizeContent(title: string, content: string): number {
  const text = (title + ' ' + content).toLowerCase()
  
  let bestMatch = 176365 // Default to Curious Histories
  let highestScore = 0
  
  for (const [idStr, info] of Object.entries(SECTION_INFO)) {
    const id = parseInt(idStr)
    let score = 0
    
    for (const keyword of info.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++
      }
    }
    
    if (score > highestScore) {
      highestScore = score
      bestMatch = id
    }
  }
  
  return bestMatch
}

