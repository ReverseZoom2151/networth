'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Region } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultAmount: Record<Region, number>;
  defaultTimeframe: number;
  category: string;
  tips: string[];
}

interface GoalTemplatesProps {
  region: Region;
  onSelectTemplate?: (template: GoalTemplate, amount: number, timeframe: number) => void;
}

// Fallback templates if database is unavailable
const FALLBACK_TEMPLATES: GoalTemplate[] = [
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: '3-6 months of living expenses for unexpected situations',
    icon: '🛡️',
    defaultAmount: { US: 5000, UK: 4000, EU: 4500 },
    defaultTimeframe: 1,
    category: 'Security',
    tips: [
      'Start with $1,000 as a mini emergency fund',
      'Keep it in a high-yield savings account',
      'Aim for 3-6 months of expenses',
      'Only use for true emergencies',
    ],
  },
  {
    id: 'study-abroad',
    name: 'Study Abroad',
    description: 'Experience a semester or year in another country',
    icon: '✈️',
    defaultAmount: { US: 8000, UK: 6500, EU: 7000 },
    defaultTimeframe: 2,
    category: 'Education',
    tips: [
      'Research scholarship opportunities',
      'Consider exchange programs for lower costs',
      'Factor in travel, housing, and living expenses',
      'Apply for financial aid early',
    ],
  },
  {
    id: 'graduation-trip',
    name: 'Graduation Trip',
    description: 'Celebrate your achievement with an unforgettable trip',
    icon: '🎓',
    defaultAmount: { US: 3000, UK: 2500, EU: 2700 },
    defaultTimeframe: 1.5,
    category: 'Lifestyle',
    tips: [
      'Book flights and accommodation early',
      'Travel during off-peak seasons',
      'Look for group discounts',
      'Use student travel discounts',
    ],
  },
  {
    id: 'car-down-payment',
    name: 'Car Down Payment',
    description: 'Save for a reliable vehicle for work and life',
    icon: '🚗',
    defaultAmount: { US: 5000, UK: 4000, EU: 4500 },
    defaultTimeframe: 2,
    category: 'Transportation',
    tips: [
      'Aim for 20% down payment to avoid being underwater',
      'Consider certified pre-owned vehicles',
      'Factor in insurance, gas, and maintenance',
      'Research reliability ratings',
    ],
  },
  {
    id: 'first-apartment',
    name: 'First Apartment',
    description: 'First month + security deposit + furnishings',
    icon: '🏠',
    defaultAmount: { US: 4000, UK: 3200, EU: 3600 },
    defaultTimeframe: 1,
    category: 'Housing',
    tips: [
      'Budget for first month rent + security deposit',
      'Look for furnished apartments to save',
      'Check for utilities included',
      'Save for basic furniture and kitchen items',
    ],
  },
  {
    id: 'wedding-fund',
    name: 'Wedding Fund',
    description: 'Start saving for your future wedding',
    icon: '💍',
    defaultAmount: { US: 10000, UK: 8000, EU: 9000 },
    defaultTimeframe: 3,
    category: 'Life Events',
    tips: [
      'Average wedding costs vary widely by location',
      'Consider intimate celebrations for lower costs',
      'DIY decorations can save thousands',
      'Off-season dates are more affordable',
    ],
  },
  {
    id: 'business-startup',
    name: 'Start a Business',
    description: 'Seed money for your entrepreneurial dreams',
    icon: '💼',
    defaultAmount: { US: 7000, UK: 5500, EU: 6000 },
    defaultTimeframe: 2,
    category: 'Career',
    tips: [
      'Start small and validate your idea first',
      'Use free tools and resources when possible',
      'Network and find mentors',
      'Consider business competitions for funding',
    ],
  },
  {
    id: 'laptop-upgrade',
    name: 'New Laptop',
    description: 'Invest in a quality laptop for school/work',
    icon: '💻',
    defaultAmount: { US: 1500, UK: 1200, EU: 1300 },
    defaultTimeframe: 0.5,
    category: 'Technology',
    tips: [
      'Wait for back-to-school sales',
      'Check for student discounts',
      'Consider refurbished from manufacturers',
      'Evaluate your actual needs vs wants',
    ],
  },
  {
    id: 'investment-start',
    name: 'Start Investing',
    description: 'Build your investment portfolio',
    icon: '📈',
    defaultAmount: { US: 2000, UK: 1600, EU: 1800 },
    defaultTimeframe: 1,
    category: 'Wealth Building',
    tips: [
      'Start with low-cost index funds',
      'Many brokers have no minimum',
      'Consider a Roth IRA for tax advantages',
      'Time in market beats timing the market',
    ],
  },
  {
    id: 'concert-festival',
    name: 'Concert/Festival',
    description: 'Save for tickets and travel to your favorite events',
    icon: '🎵',
    defaultAmount: { US: 800, UK: 650, EU: 700 },
    defaultTimeframe: 0.5,
    category: 'Entertainment',
    tips: [
      'Follow artists for presale codes',
      'Consider payment plans if available',
      'Budget for travel and accommodation',
      'Split costs with friends',
    ],
  },
];

const roundToNearest50 = (value: number) => Math.max(0, Math.round(value / 50) * 50);

const formatTimeframeLabel = (years: number) => {
  if (years < 1) {
    const months = Math.round(years * 12);
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${years} year${years === 1 ? '' : 's'}`;
};

const parsePositiveNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
};

export function GoalTemplates({ region, onSelectTemplate }: GoalTemplatesProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<GoalTemplate[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(FALLBACK_TEMPLATES[0]?.category ?? '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(FALLBACK_TEMPLATES[0]?.id ?? '');
  const [amountOption, setAmountOption] = useState<string>('default');
  const [timeframeOption, setTimeframeOption] = useState<string>('default');
  const [customAmount, setCustomAmount] = useState('');
  const [customTimeframe, setCustomTimeframe] = useState('');

  // Fetch templates from database on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/content/templates');
        const data = await response.json();

        if (data.templates && data.templates.length > 0 && data.source === 'database') {
          const dbTemplates: GoalTemplate[] = data.templates.map((t: any) => ({
            id: t.slug,
            name: t.name,
            description: t.description,
            icon: t.icon,
            defaultAmount: t.defaultAmounts as Record<Region, number>,
            defaultTimeframe: t.defaultTimeframe,
            category: t.category,
            tips: t.tips as string[],
          }));
          setTemplates(dbTemplates);
        }
      } catch (error) {
        console.error('[GoalTemplates] Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(templates.map(t => t.category))).sort(),
    [templates],
  );

  const templatesForCategory = useMemo(
    () => templates.filter(template => template.category === selectedCategory),
    [templates, selectedCategory],
  );

  useEffect(() => {
    if (categories.length === 0) return;
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (templatesForCategory.length === 0) {
      setSelectedTemplateId('');
      return;
    }

    if (!templatesForCategory.some(template => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templatesForCategory[0].id);
    }
  }, [templatesForCategory, selectedTemplateId]);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setAmountOption('default');
    setTimeframeOption('default');
    setCustomAmount('');
    setCustomTimeframe('');
  }, [selectedTemplate, region]);

  const amountOptions = useMemo(() => {
    if (!selectedTemplate) return [];

    const base = selectedTemplate.defaultAmount[region];
    const options = [
      {
        id: 'lean',
        amount: roundToNearest50(base * 0.8),
        label: `Lean • ${formatCurrency(roundToNearest50(base * 0.8), region)}`,
      },
      {
        id: 'default',
        amount: roundToNearest50(base),
        label: `Standard • ${formatCurrency(roundToNearest50(base), region)}`,
      },
      {
        id: 'stretch',
        amount: roundToNearest50(base * 1.2),
        label: `Stretch • ${formatCurrency(roundToNearest50(base * 1.2), region)}`,
      },
      {
        id: 'ambitious',
        amount: roundToNearest50(base * 1.5),
        label: `Ambitious • ${formatCurrency(roundToNearest50(base * 1.5), region)}`,
      },
    ];

    const unique = options.filter(
      (option, index, self) => index === self.findIndex(item => item.amount === option.amount),
    );

    return [
      ...unique,
      { id: 'custom', amount: null, label: 'Custom amount…' },
    ];
  }, [selectedTemplate, region]);

  const timeframeOptions = useMemo(() => {
    if (!selectedTemplate) return [];

    const base = selectedTemplate.defaultTimeframe;
    const candidates = new Set<number>();
    candidates.add(Number(Math.max(0.25, base - 1).toFixed(2)));
    candidates.add(Number(Math.max(0.25, base - 0.5).toFixed(2)));
    candidates.add(Number(base.toFixed(2)));
    candidates.add(Number((base + 0.5).toFixed(2)));
    candidates.add(Number((base + 1).toFixed(2)));

    const sorted = Array.from(candidates)
      .filter(value => value > 0)
      .sort((a, b) => a - b);

    const options = sorted.map(value => ({
      id: value.toString(),
      years: value,
      label: formatTimeframeLabel(value),
    }));

    return [
      ...options,
      { id: 'custom', years: null, label: 'Custom timeframe…' },
    ];
  }, [selectedTemplate]);

  const resolvedAmount = useMemo(() => {
    if (!selectedTemplate) return 0;

    if (amountOption === 'custom') {
      const parsed = parsePositiveNumber(customAmount);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    const preset = amountOptions.find(option => option.id === amountOption);
    return preset?.amount ?? selectedTemplate.defaultAmount[region];
  }, [amountOption, customAmount, amountOptions, selectedTemplate, region]);

  const resolvedTimeframe = useMemo(() => {
    if (!selectedTemplate) return 0;

    if (timeframeOption === 'custom') {
      const parsed = parsePositiveNumber(customTimeframe);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    const preset = timeframeOptions.find(option => option.id === timeframeOption);
    return preset?.years ?? selectedTemplate.defaultTimeframe;
  }, [timeframeOption, customTimeframe, timeframeOptions, selectedTemplate]);

  const monthlySavings =
    resolvedAmount > 0 && resolvedTimeframe > 0
      ? Math.round((resolvedAmount / (resolvedTimeframe * 12)) * 100) / 100
      : 0;

  const handleCreateGoal = () => {
    if (!selectedTemplate) return;
    if (resolvedAmount <= 0 || resolvedTimeframe <= 0) {
      alert('Please provide a valid goal amount and timeframe.');
      return;
    }

    if (onSelectTemplate) {
      onSelectTemplate(selectedTemplate, resolvedAmount, resolvedTimeframe);
      return;
    }

    const goal = {
      id: Date.now().toString(),
      name: selectedTemplate.name,
      targetAmount: resolvedAmount,
      currentAmount: 0,
      timeframe: resolvedTimeframe,
      category: selectedTemplate.category,
      icon: selectedTemplate.icon,
      createdAt: new Date().toISOString(),
    };

    const existingGoals = JSON.parse(localStorage.getItem('financialGoals') || '[]');
    localStorage.setItem('financialGoals', JSON.stringify([...existingGoals, goal]));
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        No goal templates available for this category yet. Please choose a different category.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Goal Templates</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choose a template, adjust the amount and timeframe, and save it to your dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            disabled={templatesForCategory.length === 0}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
          >
            {templatesForCategory.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {templatesForCategory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
          No templates available for this category yet. Try selecting another category.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{selectedTemplate.description}</p>
                  <dl className="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-gray-900">Default amount</dt>
                      <dd>{formatCurrency(selectedTemplate.defaultAmount[region], region)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-gray-900">Default timeframe</dt>
                      <dd>{formatTimeframeLabel(selectedTemplate.defaultTimeframe)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <h4 className="mb-3 font-semibold text-gray-900">Pro tips</h4>
              <ul className="space-y-2">
                {selectedTemplate.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-gray-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal amount</label>
              <select
                value={amountOption}
                onChange={(e) => setAmountOption(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                {amountOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {amountOption === 'custom' && (
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter goal amount"
                  className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <select
                value={timeframeOption}
                onChange={(e) => setTimeframeOption(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              >
                {timeframeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {timeframeOption === 'custom' && (
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={customTimeframe}
                  onChange={(e) => setCustomTimeframe(e.target.value)}
                  placeholder="Enter timeframe in years"
                  className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Goal amount</span>
                <span className="font-semibold text-gray-900">
                  {resolvedAmount > 0 ? formatCurrency(resolvedAmount, region) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timeframe</span>
                <span className="font-semibold text-gray-900">
                  {resolvedTimeframe > 0 ? formatTimeframeLabel(Number(resolvedTimeframe.toFixed(2))) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Monthly savings needed</span>
                <span className="font-semibold text-gray-900">
                  {monthlySavings > 0 ? formatCurrency(monthlySavings, region) : '—'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateGoal}
              className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-900"
            >
              Create goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
