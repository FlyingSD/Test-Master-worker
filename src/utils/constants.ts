// Age groups
export const AGE_GROUPS = {
  LITTLE_FIREFLIES: '5-6',
  BIG_FIREFLIES: '7-8',
  MASTERS: '9-12',
} as const;

// Lesson configuration per age group
export const LESSON_CONFIG = {
  '5-6': {
    duration: 10 * 60 * 1000, // 10 minutes
    problemsPerSession: 5,
    attentionSpan: 7 * 60 * 1000, // 7 minutes before break
    beadSize: 40, // pixels
    targetTime: 15000, // 15 seconds per problem
  },
  '7-8': {
    duration: 15 * 60 * 1000, // 15 minutes
    problemsPerSession: 10,
    attentionSpan: 12 * 60 * 1000, // 12 minutes
    beadSize: 32,
    targetTime: 10000, // 10 seconds
  },
  '9-12': {
    duration: 20 * 60 * 1000, // 20 minutes
    problemsPerSession: 15,
    attentionSpan: 18 * 60 * 1000, // 18 minutes
    beadSize: 28,
    targetTime: 5000, // 5 seconds
  },
} as const;

// Firefly characters (numbers 1-9)
export const FIREFLY_HEROES = {
  1: { name: 'Светло', emoji: '🔥', color: '#FABA29' },
  2: { name: 'Двоя', emoji: '✨', color: '#FABA29' },
  3: { name: 'Трио', emoji: '🌟', color: '#46B19D' },
  4: { name: 'Четка', emoji: '💫', color: '#6FDBCF' },
  5: { name: 'Петра', emoji: '⭐', color: '#FABA29' }, // Special!
  6: { name: 'Шесто', emoji: '🔆', color: '#E5A820' },
  7: { name: 'Седмо', emoji: '✴️', color: '#3A9B8A' },
  8: { name: 'Осмо', emoji: '💥', color: '#2E7A6D' },
  9: { name: 'Девето', emoji: '🌠', color: '#FFE5B4' },
  10: { name: 'Десето', emoji: '⭐⭐', color: '#FABA29' }, // Double star!
} as const;

// Small Friends pairs (add up to 5)
export const SMALL_FRIENDS = {
  1: 4,
  2: 3,
  3: 2,
  4: 1,
} as const;

// Big Friends pairs (add up to 10)
export const BIG_FRIENDS = {
  1: 9,
  2: 8,
  3: 7,
  4: 6,
  5: 5,
  6: 4,
  7: 3,
  8: 2,
  9: 1,
} as const;

// Small Friends formulas
export const SMALL_FRIEND_FORMULAS = {
  add: {
    1: { formula: '+5 -4', description: 'Добави 5, извади 4' },
    2: { formula: '+5 -3', description: 'Добави 5, извади 3' },
    3: { formula: '+5 -2', description: 'Добави 5, извади 2' },
    4: { formula: '+5 -1', description: 'Добави 5, извади 1' },
  },
  subtract: {
    1: { formula: '+4 -5', description: 'Добави 4, извади 5' },
    2: { formula: '+3 -5', description: 'Добави 3, извади 5' },
    3: { formula: '+2 -5', description: 'Добави 2, извади 5' },
    4: { formula: '+1 -5', description: 'Добави 1, извади 5' },
  },
} as const;

// Big Friends formulas
export const BIG_FRIEND_FORMULAS = {
  add: {
    1: { formula: '+10 -9', description: 'Добави 10, извади 9' },
    2: { formula: '+10 -8', description: 'Добави 10, извади 8' },
    3: { formula: '+10 -7', description: 'Добави 10, извади 7' },
    4: { formula: '+10 -6', description: 'Добави 10, извади 6' },
    5: { formula: '+10 -5', description: 'Добави 10, извади 5' },
    6: { formula: '+10 -4', description: 'Добави 10, извади 4' },
    7: { formula: '+10 -3', description: 'Добави 10, извади 3' },
    8: { formula: '+10 -2', description: 'Добави 10, извади 2' },
    9: { formula: '+10 -1', description: 'Добави 10, извади 1' },
  },
  subtract: {
    1: { formula: '+9 -10', description: 'Добави 9, извади 10' },
    2: { formula: '+8 -10', description: 'Добави 8, извади 10' },
    3: { formula: '+7 -10', description: 'Добави 7, извади 10' },
    4: { formula: '+6 -10', description: 'Добави 6, извади 10' },
    5: { formula: '+5 -10', description: 'Добави 5, извади 10' },
    6: { formula: '+4 -10', description: 'Добави 4, извади 10' },
    7: { formula: '+3 -10', description: 'Добави 3, извади 10' },
    8: { formula: '+2 -10', description: 'Добави 2, извади 10' },
    9: { formula: '+1 -10', description: 'Добави 1, извади 10' },
  },
} as const;

// Achievement badges
export const BADGES = {
  BRONZE_FIREFLY: {
    id: 'bronze_firefly',
    name: 'Бронзова светулка',
    description: 'Завърши Ниво 1',
    icon: '🥉',
  },
  SILVER_FIREFLY: {
    id: 'silver_firefly',
    name: 'Сребърна светулка',
    description: 'Завърши Ниво 2',
    icon: '🥈',
  },
  GOLD_FIREFLY: {
    id: 'gold_firefly',
    name: 'Златна светулка',
    description: 'Завърши Ниво 3',
    icon: '🥇',
  },
  DIAMOND_STAR: {
    id: 'diamond_star',
    name: 'Диамантена звезда',
    description: 'Топ 10% в класацията',
    icon: '💎',
  },
  FLASH_MASTER: {
    id: 'flash_master',
    name: 'Flash Майстор',
    description: 'Flash Anzan < 2 сек',
    icon: '⚡',
  },
  SWARM_LEADER: {
    id: 'swarm_leader',
    name: 'Рой Майстор',
    description: 'Поведе 10+ приятели',
    icon: '🔥',
  },
} as const;

// Sound effects
export const SOUNDS = {
  BEAD_CLICK: 'bead_click.mp3',
  CORRECT: 'correct.mp3',
  WRONG: 'wrong.mp3',
  FIREFLY_GLOW: 'firefly_glow.mp3',
  LEVEL_UP: 'level_up.mp3',
  BADGE_EARNED: 'badge_earned.mp3',
  BACKGROUND_MUSIC: 'forest_night.mp3',
} as const;

export type AgeGroup = typeof AGE_GROUPS[keyof typeof AGE_GROUPS];
export type FireflyHero = typeof FIREFLY_HEROES[keyof typeof FIREFLY_HEROES];
export type Badge = typeof BADGES[keyof typeof BADGES];
