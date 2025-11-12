'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhop } from '@/app/providers';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui';

const questions = [
  {
    id: 1,
    question: 'How long until you need this money?',
    options: [
      { text: 'Less than 3 years', score: 1 },
      { text: '3-5 years', score: 3 },
      { text: '5-10 years', score: 7 },
      { text: 'More than 10 years', score: 10 },
    ],
  },
  {
    id: 2,
    question: 'If your investment dropped 20% in value, what would you do?',
    options: [
      { text: 'Sell everything immediately', score: 1 },
      { text: 'Sell some to reduce risk', score: 3 },
      { text: 'Hold steady and wait', score: 7 },
      { text: 'Buy more at the lower price', score: 10 },
    ],
  },
  {
    id: 3,
    question: 'What is your primary investment goal?',
    options: [
      { text: 'Preserve what I have', score: 2 },
      { text: 'Generate steady income', score: 4 },
      { text: 'Grow wealth moderately', score: 7 },
      { text: 'Maximize long-term growth', score: 10 },
    ],
  },
  {
    id: 4,
    question: 'How much investing experience do you have?',
    options: [
      { text: 'None - complete beginner', score: 2 },
      { text: 'Limited - read some articles', score: 4 },
      { text: 'Moderate - invested a little', score: 7 },
      { text: 'Experienced - actively investing', score: 10 },
    ],
  },
  {
    id: 5,
    question: 'How would you describe your financial situation?',
    options: [
      { text: 'Tight - living paycheck to paycheck', score: 2 },
      { text: 'Stable - covering expenses okay', score: 5 },
      { text: 'Comfortable - some savings built up', score: 8 },
      { text: 'Strong - solid emergency fund', score: 10 },
    ],
  },
  {
    id: 6,
    question: 'Which portfolio sounds most appealing?',
    options: [
      { text: '90% bonds, 10% stocks', score: 2 },
      { text: '60% bonds, 40% stocks', score: 4 },
      { text: '40% bonds, 60% stocks', score: 7 },
      { text: '20% bonds, 80% stocks', score: 10 },
    ],
  },
  {
    id: 7,
    question: 'How important is it that you can access this money quickly?',
    options: [
      { text: 'Very important - might need anytime', score: 1 },
      { text: 'Somewhat - might need in emergency', score: 4 },
      { text: 'Not very - have other savings', score: 7 },
      { text: 'Not at all - locked away is fine', score: 10 },
    ],
  },
  {
    id: 8,
    question: 'How would you feel about your investments fluctuating monthly?',
    options: [
      { text: 'Very uncomfortable - I would lose sleep', score: 2 },
      { text: 'Uncomfortable but manageable', score: 4 },
      { text: 'Neutral - part of investing', score: 7 },
      { text: 'Comfortable - expected volatility', score: 10 },
    ],
  },
  {
    id: 9,
    question: 'What sounds like the best outcome in 10 years?',
    options: [
      { text: 'My money + 3% per year', score: 2 },
      { text: 'My money + 5% per year', score: 5 },
      { text: 'My money + 7% per year', score: 7 },
      { text: 'My money + 10% per year (with risk)', score: 10 },
    ],
  },
  {
    id: 10,
    question: 'How often would you want to check your investments?',
    options: [
      { text: 'Daily - I like staying informed', score: 3 },
      { text: 'Weekly - regular check-ins', score: 5 },
      { text: 'Monthly - periodic reviews', score: 8 },
      { text: 'Quarterly or less - set and forget', score: 10 },
    ],
  },
];

export default function InvestQuizPage() {
  const router = useRouter();
  const { userId } = useWhop();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (allAnswers: number[]) => {
    setLoading(true);
    const totalScore = allAnswers.reduce((sum, score) => sum + score, 0);
    const normalizedScore = Math.round((totalScore / 100) * 100); // 0-100 scale

    let riskTolerance: string;
    if (normalizedScore <= 33) {
      riskTolerance = 'conservative';
    } else if (normalizedScore <= 66) {
      riskTolerance = 'moderate';
    } else {
      riskTolerance = 'aggressive';
    }

    // Calculate time horizon from Q1
    const timeHorizon = allAnswers[0] <= 3 ? 3 : allAnswers[0] <= 7 ? 7 : 15;

    try {
      await fetch('/api/invest/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizScore: normalizedScore,
          quizAnswers: allAnswers,
          riskTolerance,
          timeHorizon,
        }),
      });
    } catch (error) {
      console.error('Failed to save quiz results:', error);
    }

    setLoading(false);
    setShowResult(true);
  };

  const getRiskProfile = () => {
    const totalScore = answers.reduce((sum, score) => sum + score, 0);
    const normalized = Math.round((totalScore / 100) * 100);

    if (normalized <= 33) {
      return {
        level: 'Conservative',
        description: 'You prefer stability and capital preservation over growth. Lower risk, lower potential returns.',
        color: 'blue',
        allocation: '70% bonds, 30% stocks',
        emoji: '🛡️',
      };
    } else if (normalized <= 66) {
      return {
        level: 'Moderate',
        description: 'You seek balance between growth and stability. Moderate risk, moderate returns.',
        color: 'purple',
        allocation: '50% bonds, 50% stocks',
        emoji: '⚖️',
      };
    } else {
      return {
        level: 'Aggressive',
        description: 'You prioritize long-term growth and can tolerate volatility. Higher risk, higher potential returns.',
        color: 'green',
        allocation: '20% bonds, 80% stocks',
        emoji: '🚀',
      };
    }
  };

  if (showResult) {
    const profile = getRiskProfile();
    const score = Math.round((answers.reduce((sum, s) => sum + s, 0) / 100) * 100);

    return (
      <div className="min-h-screen bg-background transition-colors">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="text-7xl mb-4">{profile.emoji}</div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Risk Profile: {profile.level}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">{profile.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-surface-muted">
                <p className="text-sm text-muted-foreground mb-1">Quiz Score</p>
                <p className="text-3xl font-bold text-foreground">{score}/100</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-muted">
                <p className="text-sm text-muted-foreground mb-1">Suggested Allocation</p>
                <p className="text-sm font-bold text-foreground">{profile.allocation}</p>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={() => router.push('/invest/learn')}
                className="w-full rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold py-3 px-6 transition-colors"
              >
                Start Learning Modules →
              </button>
              <button
                onClick={() => router.push('/invest/platforms')}
                className="w-full rounded-lg bg-surface hover:bg-surface-hover text-muted-foreground font-semibold py-3 px-6 transition-colors"
              >
                View Recommended Platforms
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Your profile has been saved. You can retake this quiz anytime.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Navigation />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-semibold text-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-muted">
            <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.score)}
                disabled={loading}
                className="w-full rounded-lg border border-border text-left p-4 font-medium transition-colors shadow-sm disabled:opacity-50 text-foreground"
              >
                {option.text}
              </button>
            ))}
          </div>
        </Card>

        {currentQuestion > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setCurrentQuestion(currentQuestion - 1);
                setAnswers(answers.slice(0, -1));
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Previous Question
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
