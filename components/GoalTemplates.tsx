'use client';

import { useState, useEffect } from 'react';
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

export function GoalTemplates({ region, onSelectTemplate }: GoalTemplatesProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [templates, setTemplates] = useState<GoalTemplate[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);

  // Fetch templates from database on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/content/templates');
        const data = await response.json();

        if (data.templates && data.templates.length > 0 && data.source === 'database') {
          // Convert database format to component format
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
          console.log('[GoalTemplates] Loaded from database:', dbTemplates.length);
        } else {
          console.log('[GoalTemplates] Using fallback templates');
        }
      } catch (error) {
        console.error('[GoalTemplates] Error fetching templates:', error);
        // Keep using fallback templates
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setCustomAmount(template.defaultAmount[region].toString());
    setCustomTimeframe(template.defaultTimeframe.toString());
  };

  const handleCreateGoal = () => {
    if (!selectedTemplate) return;

    const amount = parseFloat(customAmount) || selectedTemplate.defaultAmount[region];
    const timeframe = parseFloat(customTimeframe) || selectedTemplate.defaultTimeframe;

    if (onSelectTemplate) {
      onSelectTemplate(selectedTemplate, amount, timeframe);
    } else {
      // If no callback provided, save to localStorage and redirect
      const goal = {
        id: Date.now().toString(),
        name: selectedTemplate.name,
        targetAmount: amount,
        currentAmount: 0,
        timeframe,
        category: selectedTemplate.category,
        icon: selectedTemplate.icon,
        createdAt: new Date().toISOString(),
      };

      const existingGoals = JSON.parse(localStorage.getItem('financialGoals') || '[]');
      localStorage.setItem('financialGoals', JSON.stringify([...existingGoals, goal]));
      router.push('/dashboard');
    }

    setSelectedTemplate(null);
    setCustomAmount('');
    setCustomTimeframe('');
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Goal Templates</h2>
        <p className="text-sm text-gray-600 mt-1">
          Choose a pre-made template or customize your own
        </p>
      </div>

      {/* Templates Grid */}
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter((t) => t.category === category)
              .map((template) => (
                <button
                  key={`${category}-${template.id}`}
                  onClick={() => handleSelectTemplate(template)}
                  className="text-left p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{template.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(template.defaultAmount[region], region)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.defaultTimeframe} {template.defaultTimeframe === 1 ? 'year' : 'years'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}

      {/* Template Configuration Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-6xl">{selectedTemplate.icon}</span>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
            </div>

            {/* Customization */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe (years)
                </label>
                <input
                  type="number"
                  min="0.25"
                  max="10"
                  step="0.25"
                  value={customTimeframe}
                  onChange={(e) => setCustomTimeframe(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-semibold"
                />
              </div>

              {/* Monthly savings calculation */}
              {customAmount && customTimeframe && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <p className="text-sm text-primary-700 mb-1">Monthly Savings Needed</p>
                  <p className="text-3xl font-bold text-primary-900">
                    {formatCurrency(
                      parseFloat(customAmount) / (parseFloat(customTimeframe) * 12),
                      region
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Pro Tips</h4>
              <ul className="space-y-1">
                {selectedTemplate.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setCustomAmount('');
                  setCustomTimeframe('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
