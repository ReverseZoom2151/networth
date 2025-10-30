import { UserGoal, Region } from './types';
import { getRegionConfig } from './regions';
import { calculateMonthlyPayment, DEFAULT_RATES } from './calculations';

// Calculate monthly savings needed for goal (with compound interest)
export function calculateMonthlySavings(
  targetAmount: number,
  years: number,
  currentAmount: number = 0,
  annualRate: number = DEFAULT_RATES.highYieldSavings
): number {
  // Use real financial calculations with compound interest
  const monthlyPayment = calculateMonthlyPayment(targetAmount, currentAmount, annualRate, years);
  return Math.round(monthlyPayment);
}

// Format currency with region support
export function formatCurrency(amount: number, region: Region = 'US'): string {
  const config = getRegionConfig(region);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get goal emoji
export function getGoalEmoji(goalType: string): string {
  const emojiMap: Record<string, string> = {
    house: '🏠',
    travel: '✈️',
    family: '👨‍👩‍👧‍👦',
    wedding: '💒',
    investment: '📈',
    other: '🎯',
  };
  return emojiMap[goalType] || '🎯';
}

// Get goal title
export function getGoalTitle(goalType: string, customGoal?: string | null): string {
  if (customGoal) return customGoal;

  const titleMap: Record<string, string> = {
    house: 'House Deposit',
    travel: 'Travel Fund',
    family: 'Family Fund',
    wedding: 'Wedding Fund',
    investment: 'Investment Portfolio',
    other: 'Financial Goal',
  };
  return titleMap[goalType] || 'Financial Goal';
}

// Estimate typical amounts based on research and regional averages
export function getTypicalTargetAmount(goalType: string, region: Region = 'US'): number {
  const amountsByRegion: Record<Region, Record<string, number>> = {
    US: {
      house: 40000,  // Average US down payment (20% of $200k)
      travel: 10000,   // Year of travel
      family: 15000,  // Emergency fund for family
      wedding: 20000, // Average US wedding
      investment: 10000, // Starter investment amount
      other: 10000,
    },
    UK: {
      house: 30000,  // UK house deposit (£30k typical)
      travel: 8000,   // Year of travel
      family: 12000,  // Emergency fund for family
      wedding: 15000, // Average UK wedding
      investment: 8000, // Starter investment amount
      other: 8000,
    },
    EU: {
      house: 35000,  // EU house deposit (€35k typical)
      travel: 9000,   // Year of travel
      family: 13000,  // Emergency fund for family
      wedding: 18000, // Average EU wedding
      investment: 9000, // Starter investment amount
      other: 9000,
    },
  };

  return amountsByRegion[region][goalType] || amountsByRegion[region].other;
}

// Calculate progress percentage
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

// Milestone thresholds
export const MILESTONE_THRESHOLDS = [10, 25, 50, 75, 100];

// Check if a new milestone was reached
export function checkNewMilestone(oldAmount: number, newAmount: number, targetAmount: number): number | null {
  if (targetAmount === 0) return null;

  const oldPercent = (oldAmount / targetAmount) * 100;
  const newPercent = (newAmount / targetAmount) * 100;

  // Find the highest milestone that was just crossed
  for (let i = MILESTONE_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = MILESTONE_THRESHOLDS[i];
    if (newPercent >= threshold && oldPercent < threshold) {
      return threshold;
    }
  }

  return null;
}

// Get milestone message and emoji
export function getMilestoneMessage(percentage: number): { title: string; message: string; emoji: string } {
  switch (percentage) {
    case 10:
      return {
        title: 'Great Start!',
        message: "You've saved 10% of your goal! Every journey begins with a single step, and you're well on your way.",
        emoji: '🌱'
      };
    case 25:
      return {
        title: 'Quarter Way There!',
        message: "Amazing! You've reached 25% of your goal. Your consistency is paying off!",
        emoji: '🎯'
      };
    case 50:
      return {
        title: 'Halfway Champion!',
        message: "Incredible! You're halfway to your goal. The finish line is in sight!",
        emoji: '🏆'
      };
    case 75:
      return {
        title: 'Almost There!',
        message: "You've saved 75% of your goal! You're in the home stretch now!",
        emoji: '🚀'
      };
    case 100:
      return {
        title: 'Goal Achieved!',
        message: "Congratulations! You've reached your savings goal! This is a huge accomplishment!",
        emoji: '🎉'
      };
    default:
      return {
        title: 'Milestone Reached!',
        message: `You've reached ${percentage}% of your goal!`,
        emoji: '⭐'
      };
  }
}

// Time-related utilities
export function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Goal date passed';
  if (days === 0) return 'Today!';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.ceil(days / 30)} months`;

  const years = Math.floor(days / 365);
  const months = Math.ceil((days % 365) / 30);
  return months > 0 ? `${years}y ${months}m` : `${years} years`;
}

// Validate goal input
export function validateGoal(goal: Partial<UserGoal>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!goal.type) {
    errors.push('Please select a goal type');
  }

  if (!goal.timeframe || goal.timeframe < 1 || goal.timeframe > 50) {
    errors.push('Timeframe must be between 1 and 50 years');
  }

  if (goal.targetAmount && (goal.targetAmount < 100 || goal.targetAmount > 10000000)) {
    errors.push('Target amount must be between 100 and 10,000,000');
  }

  if (!goal.currency) {
    errors.push('Please select a currency');
  }

  if (!goal.region) {
    errors.push('Please select your region');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
