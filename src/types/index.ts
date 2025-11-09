// Age groups
export type AgeGroup = '5-6' | '7-8' | '9-12';

// Problem types
export type ProblemType =
  | 'simple-addition'      // Direct addition
  | 'simple-subtraction'   // Direct subtraction
  | 'small-friend-add'     // Use small friends (±5)
  | 'small-friend-sub'
  | 'big-friend-add'       // Use big friends (±10)
  | 'big-friend-sub'
  | 'combo'                // Combination of small and big friends
  | 'flash-anzan';         // Flash calculation

// Difficulty levels
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// Problem interface
export interface Problem {
  id: string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  operand1: number;
  operand2: number;
  operator: '+' | '-';
  correctAnswer: number;
  formula?: string; // e.g., "+5 -3" for small friends
  hint?: string;    // Pedagogical hint
  timeLimit?: number; // milliseconds
}

// User answer interface
export interface UserAnswer {
  problemId: string;
  userAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // milliseconds
  attemptsCount: number;
  timestamp: Date;
}

// Session statistics
export interface SessionStats {
  sessionId: string;
  userId: string;
  ageGroup: AgeGroup;
  startTime: Date;
  endTime?: Date;
  problems: Problem[];
  answers: UserAnswer[];
  correctCount: number;
  totalCount: number;
  averageTime: number;
  accuracy: number; // percentage
  currentLevel: DifficultyLevel;
}

// Student profile
export interface StudentProfile {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  currentLevel: DifficultyLevel;
  currentLesson: number; // 1-12
  totalSessionsCompleted: number;
  badges: Badge[];
  createdAt: Date;
  lastActivity: Date;
  stats: {
    totalProblems: number;
    correctProblems: number;
    averageAccuracy: number;
    averageSpeed: number;
    fastestTime: number;
    currentStreak: number;
    longestStreak: number;
  };
}

// Badge interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

// Firefly hero character
export interface FireflyHero {
  name: string;
  emoji: string;
  color: string;
  isUnlocked?: boolean;
}

// Abacus state
export interface AbacusState {
  columns: ColumnState[];
  displayValue: number;
}

export interface ColumnState {
  position: number; // Column index (rightmost is 0)
  heavenBead: BeadState;
  earthBeads: [BeadState, BeadState, BeadState, BeadState];
}

export interface BeadState {
  isActive: boolean; // Moved to counting position
  position: 'heaven' | 'earth';
}

// Game state
export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  currentProblem: Problem | null;
  problemQueue: Problem[];
  sessionStats: SessionStats;
  showAbacus: boolean; // Toggle virtual/mental mode
  soundEnabled: boolean;
  musicEnabled: boolean;
}

// Lesson curriculum
export interface Lesson {
  lessonNumber: number;
  title: string;
  description: string;
  ageGroup: AgeGroup;
  concepts: string[];
  problemTypes: ProblemType[];
  requiredAccuracy: number; // percentage to pass
  estimatedDuration: number; // minutes
}

// Learning path
export interface LearningPath {
  ageGroup: AgeGroup;
  lessons: Lesson[];
  currentLesson: number;
  completed: number[];
}

// Component props types
export interface AbacusProps {
  columns?: number;
  beadSize?: number;
  showValue?: boolean;
  interactive?: boolean;
  ghostMode?: boolean; // Show faded abacus for mental calculation
  onValueChange?: (value: number) => void;
  targetValue?: number; // For showing correct answer
}

export interface ProblemDisplayProps {
  problem: Problem;
  showHint?: boolean;
  timeRemaining?: number;
}

export interface FireflyCharacterProps {
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  isActive?: boolean;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
}

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}
