// Widget Registry - Defines all available widget types and configurations
export type WidgetType =
  | 'net_worth_summary'
  | 'spending_this_month'
  | 'budget_progress'
  | 'savings_goal'
  | 'recent_transactions'
  | 'guilty_pleasures'
  | 'active_streaks'
  | 'spending_by_category'
  | 'upcoming_bills'
  | 'monthly_comparison'
  | 'quick_actions';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetConfig {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  availableSizes: WidgetSize[];
  defaultSettings: Record<string, any>;
  category: 'overview' | 'spending' | 'savings' | 'insights' | 'actions';
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
  net_worth_summary: {
    type: 'net_worth_summary',
    name: 'Net Worth Summary',
    description: 'Overview of your total net worth and monthly change',
    icon: '💰',
    defaultSize: 'medium',
    availableSizes: ['medium', 'large'],
    defaultSettings: {
      showChart: true,
      timeframe: '6months',
    },
    category: 'overview',
  },
  spending_this_month: {
    type: 'spending_this_month',
    name: 'Spending This Month',
    description: 'Current month spending vs budget',
    icon: '📊',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    defaultSettings: {
      showBreakdown: true,
    },
    category: 'spending',
  },
  budget_progress: {
    type: 'budget_progress',
    name: 'Budget Progress',
    description: 'Track your budget categories and spending',
    icon: '🎯',
    defaultSize: 'large',
    availableSizes: ['medium', 'large'],
    defaultSettings: {
      showAllCategories: false,
      maxCategories: 5,
    },
    category: 'spending',
  },
  savings_goal: {
    type: 'savings_goal',
    name: 'Savings Goal',
    description: 'Progress towards your savings goals',
    icon: '🏆',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    defaultSettings: {
      showProjection: true,
    },
    category: 'savings',
  },
  recent_transactions: {
    type: 'recent_transactions',
    name: 'Recent Transactions',
    description: 'Your latest transactions',
    icon: '📝',
    defaultSize: 'large',
    availableSizes: ['medium', 'large', 'full'],
    defaultSettings: {
      limit: 10,
      showPending: true,
    },
    category: 'overview',
  },
  guilty_pleasures: {
    type: 'guilty_pleasures',
    name: 'Guilty Pleasures',
    description: 'Track your guilt-free spending allowances',
    icon: '☕',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    defaultSettings: {
      maxDisplay: 3,
    },
    category: 'spending',
  },
  active_streaks: {
    type: 'active_streaks',
    name: 'Active Streaks',
    description: 'Your current financial habit streaks',
    icon: '🔥',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    defaultSettings: {
      maxDisplay: 3,
      showProgress: true,
    },
    category: 'insights',
  },
  spending_by_category: {
    type: 'spending_by_category',
    name: 'Spending by Category',
    description: 'Breakdown of spending across categories',
    icon: '🥧',
    defaultSize: 'large',
    availableSizes: ['medium', 'large'],
    defaultSettings: {
      chartType: 'pie',
      timeframe: 'month',
    },
    category: 'insights',
  },
  upcoming_bills: {
    type: 'upcoming_bills',
    name: 'Upcoming Bills',
    description: 'Bills due in the next 30 days',
    icon: '📅',
    defaultSize: 'medium',
    availableSizes: ['small', 'medium', 'large'],
    defaultSettings: {
      daysAhead: 30,
    },
    category: 'overview',
  },
  monthly_comparison: {
    type: 'monthly_comparison',
    name: 'Monthly Comparison',
    description: 'Compare current month to previous months',
    icon: '📈',
    defaultSize: 'large',
    availableSizes: ['medium', 'large'],
    defaultSettings: {
      compareMonths: 3,
    },
    category: 'insights',
  },
  quick_actions: {
    type: 'quick_actions',
    name: 'Quick Actions',
    description: 'Shortcuts to common tasks',
    icon: '⚡',
    defaultSize: 'small',
    availableSizes: ['small', 'medium'],
    defaultSettings: {
      actions: ['add_transaction', 'sync_bank', 'add_goal'],
    },
    category: 'actions',
  },
};

export function getWidgetConfig(type: WidgetType): WidgetConfig | undefined {
  return WIDGET_REGISTRY[type];
}

export function getAllWidgetConfigs(): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY);
}

export function getWidgetsByCategory(category: string): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY).filter((w) => w.category === category);
}

export const DEFAULT_DASHBOARD_WIDGETS: Array<{
  type: WidgetType;
  size: WidgetSize;
  position: number;
}> = [
  { type: 'net_worth_summary', size: 'medium', position: 0 },
  { type: 'spending_this_month', size: 'medium', position: 1 },
  { type: 'active_streaks', size: 'medium', position: 2 },
  { type: 'recent_transactions', size: 'large', position: 3 },
  { type: 'quick_actions', size: 'small', position: 4 },
];
