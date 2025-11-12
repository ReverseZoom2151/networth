// User goal types based on research findings
export type GoalType =
  | 'house'        // 26/60 mentioned
  | 'travel'       // 17/60 mentioned
  | 'family'       // 12/60 mentioned
  | 'wedding'      // 3/60 mentioned
  | 'investment'   // General financial growth
  | 'other';

// Supported currencies
export type Currency = 'USD' | 'GBP' | 'EUR';

// Supported regions with financial products
export type Region = 'US' | 'UK' | 'EU';

export interface RegionConfig {
  region: Region;
  currency: Currency;
  currencySymbol: string;
  locale: string;
  financialProducts: {
    retirementAccounts: string[];  // 401k, ISA, etc.
    savingsAccounts: string[];
    studentLoans: string;
  };
}

export interface UserGoal {
  type: GoalType;
  customGoal?: string;
  targetAmount?: number;
  currentSavings?: number;  // NEW: Track current progress
  timeframe: number; // in years
  monthlyBudget?: number;
  currency: Currency;  // NEW: User's currency
  region: Region;  // NEW: User's region for financial advice
  spendingCategories?: string[];  // NEW: User spending habits
}

export interface ProgressUpdate {
  amount: number;
  date: Date;
  note?: string;
}

export interface Milestone {
  percentage: number;
  reached: boolean;
  dateReached?: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  goal: UserGoal;
  progressHistory: ProgressUpdate[];  // NEW: Track savings over time
  milestones: Milestone[];  // NEW: Achievement tracking
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface CommunityStory {
  id: string;
  userId: string;
  authorName: string;
  goalType: string;
  title: string;
  summary: string;
  story: string;
  tips: string[];
  milestones?: Record<string, unknown> | null;
  region?: string | null;
  targetAmount?: number | null;
  timeframeMonths?: number | null;
  visibility: string;
  status: string;
  likes: number;
  commentCount: number;
  featured: boolean;
  submittedAt: string;
  updatedAt: string;
}

export interface StoryLeaderboard {
  topStories: Array<{
    id: string;
    title: string;
    authorName: string;
    likes: number;
    goalType: string;
    submittedAt: string;
  }>;
  goalTypeTrends: Array<{
    goalType: string;
    stories: number;
  }>;
  recentContributors: Array<{
    authorName: string;
    stories: number;
  }>;
}