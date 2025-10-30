'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoalType, UserGoal, Region, Currency } from '@/lib/types';
import { getGoalEmoji, getTypicalTargetAmount, validateGoal } from '@/lib/utils';
import { useWhop, UserStorage } from '@/app/providers';
import { getAvailableRegions, getRegionConfig } from '@/lib/regions';

export default function OnboardingPage() {
  const router = useRouter();
  const { userId, loading: whopLoading } = useWhop();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region>('US');
  const [currentSavings, setCurrentSavings] = useState<string>('');
  const [spendingCategories, setSpendingCategories] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<number>(5);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Common spending categories based on research
  const availableSpendingCategories = [
    { id: 'going-out', label: 'Going Out / Socializing', icon: '🍻' },
    { id: 'food-delivery', label: 'Food Delivery', icon: '🍕' },
    { id: 'subscriptions', label: 'Subscriptions (Netflix, Spotify, etc.)', icon: '📺' },
    { id: 'shopping', label: 'Shopping / Fashion', icon: '👗' },
    { id: 'travel', label: 'Weekend Trips / Travel', icon: '✈️' },
    { id: 'coffee', label: 'Coffee / Cafes', icon: '☕' },
    { id: 'fitness', label: 'Gym / Fitness', icon: '💪' },
    { id: 'entertainment', label: 'Entertainment / Events', icon: '🎭' },
  ];

  const toggleSpendingCategory = (categoryId: string) => {
    setSpendingCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Wait for Whop to initialize
  if (whopLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Networth...</p>
        </div>
      </div>
    );
  }

  // Goal options based on research findings
  const goalOptions: Array<{ type: GoalType; label: string; description: string; popularity: string }> = [
    { type: 'house', label: 'Buy a House', description: 'Save for your first home deposit', popularity: '43% chose this' },
    { type: 'travel', label: 'Travel the World', description: 'Explore and create memories', popularity: '28% chose this' },
    { type: 'family', label: 'Start a Family', description: 'Prepare for children and family life', popularity: '20% chose this' },
    { type: 'wedding', label: 'Get Married', description: 'Plan your dream wedding', popularity: '5% chose this' },
    { type: 'investment', label: 'Build Wealth', description: 'Grow your investment portfolio', popularity: 'Popular choice' },
    { type: 'other', label: 'Something Else', description: 'Custom financial goal', popularity: 'Your choice' },
  ];

  const timeframeOptions = [
    { value: 2, label: '2 years', description: 'Short-term goal' },
    { value: 5, label: '5 years', description: 'Medium-term goal' },
    { value: 10, label: '10 years', description: 'Long-term goal' },
  ];

  const handleGoalSelect = (goalType: GoalType) => {
    setSelectedGoal(goalType);
    setErrors([]);
  };

  const handleNext = () => {
    if (!selectedGoal) {
      setErrors(['Please select a goal']);
      return;
    }

    if (selectedGoal === 'other' && !customGoal.trim()) {
      setErrors(['Please describe your goal']);
      return;
    }

    setStep(2);
    setErrors([]);
  };

  const handleNextToFinal = () => {
    // Validate region is selected (should always be, has default)
    if (!selectedRegion) {
      setErrors(['Please select your region']);
      return;
    }

    setStep(3);
    setErrors([]);
  };

  const handleComplete = async () => {
    if (!userId) {
      setErrors(['User not authenticated']);
      return;
    }

    const regionConfig = getRegionConfig(selectedRegion);
    const parsedCurrentSavings = currentSavings ? parseFloat(currentSavings) : 0;

    const goal: UserGoal = {
      type: selectedGoal!,
      customGoal: selectedGoal === 'other' ? customGoal : undefined,
      timeframe,
      region: selectedRegion,
      currency: regionConfig.currency,
      targetAmount: getTypicalTargetAmount(selectedGoal!, selectedRegion),
      currentSavings: parsedCurrentSavings,
      spendingCategories: spendingCategories.length > 0 ? spendingCategories : undefined,
    };

    const validation = validateGoal(goal);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);

    try {
      // Store goal using Whop-aware storage
      await UserStorage.setGoal(userId, goal);
      await UserStorage.setOnboardingComplete(userId);

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save goal:', error);
      setErrors(['Failed to save your goal. Please try again.']);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Networth Logo" className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">
            Welcome to Networth
          </h1>
          <p className="text-gray-600">
            Your personalized AI financial coach
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${step >= 3 ? 'bg-black' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What's your biggest financial goal?
              </h2>
              <p className="text-gray-600 mb-6">
                Choose what matters most to you right now
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {goalOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleGoalSelect(option.type)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedGoal === option.type
                        ? 'border-black bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-3xl">{getGoalEmoji(option.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {option.label}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {option.description}
                        </p>
                        <p className="text-xs text-gray-600">
                          {option.popularity}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedGoal === 'other' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your goal
                  </label>
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="E.g., Start my own business"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              )}

              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tell us about your situation
              </h2>
              <p className="text-gray-600 mb-6">
                This helps us give you personalized advice
              </p>

              {/* Region Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Where are you based?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {getAvailableRegions().map((region) => (
                    <button
                      key={region.value}
                      onClick={() => setSelectedRegion(region.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedRegion === region.value
                          ? 'border-black bg-gray-100'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{region.flag}</span>
                          <span className="font-semibold text-gray-900">{region.label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedRegion === region.value
                            ? 'border-black bg-black'
                            : 'border-gray-300'
                        }`}>
                          {selectedRegion === region.value && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Savings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How much have you saved so far? (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {getRegionConfig(selectedRegion).currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This helps us track your progress and give better advice
                </p>
              </div>

              {/* Spending Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you spend money on? (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select all that apply - helps us give you personalized savings tips
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableSpendingCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleSpendingCategory(category.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left text-sm ${
                        spendingCategories.includes(category.id)
                          ? 'border-black bg-gray-100'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{category.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{category.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNextToFinal}
                  className="flex-1 bg-black hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                When do you want to achieve this?
              </h2>
              <p className="text-gray-600 mb-6">
                Choose your timeframe - you can adjust this later
              </p>

              <div className="space-y-4 mb-6">
                {timeframeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      timeframe === option.value
                        ? 'border-black bg-gray-100'
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {option.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        timeframe === option.value
                          ? 'border-black bg-black'
                          : 'border-gray-300'
                      }`}>
                        {timeframe === option.value && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={saving}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-black hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Get Started 🚀'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by AI • Research-backed insights
        </p>
      </div>
    </div>
  );
}
