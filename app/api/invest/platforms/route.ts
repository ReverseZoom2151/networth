// API route for investment platform recommendations
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Platform database - curated for university students
const PLATFORMS = [
  {
    id: 'fidelity-go',
    name: 'Fidelity Go',
    type: 'robo-advisor',
    icon: '🏦',
    minInvestment: 0,
    fee: 'Free under $25k',
    feeDetails: '0.35% above $25k',
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    region: 'US',
    pros: ['No minimum', 'Reputable brand', 'Automatic rebalancing', 'Tax-loss harvesting'],
    cons: ['Limited customization', 'Fees above $25k'],
    bestFor: 'Beginners who want hands-off investing',
    rating: 4.5,
    link: 'https://www.fidelity.com/go/overview',
  },
  {
    id: 'betterment',
    name: 'Betterment',
    type: 'robo-advisor',
    icon: '🤖',
    minInvestment: 0,
    fee: '0.25% annual fee',
    feeDetails: '0.40% for premium',
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    region: 'US',
    pros: ['Easy to use', 'Goal-based planning', 'Tax optimization', 'Fractional shares'],
    cons: ['Annual fee from day one', 'No human advisors on basic'],
    bestFor: 'Goal-oriented investors who want automation',
    rating: 4.7,
    link: 'https://www.betterment.com',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    type: 'broker',
    icon: '📊',
    minInvestment: 1000,
    fee: 'Free trading',
    feeDetails: '0.04% avg expense ratio',
    riskProfiles: ['moderate', 'aggressive'],
    region: 'US',
    pros: ['Lowest fees in industry', 'Index fund pioneer', 'Great for long-term', 'Strong reputation'],
    cons: ['$1,000 minimum', 'Basic interface', 'Requires more knowledge'],
    bestFor: 'DIY investors with $1k+ who want lowest costs',
    rating: 4.8,
    link: 'https://investor.vanguard.com',
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    type: 'broker',
    icon: '📱',
    minInvestment: 0,
    fee: 'Free trading',
    feeDetails: '$5/mo for Gold (margin)',
    riskProfiles: ['moderate', 'aggressive'],
    region: 'US',
    pros: ['No minimum', 'Simple app', 'Fractional shares', 'Crypto available'],
    cons: ['Limited research tools', 'Gamification concerns', 'Customer service issues'],
    bestFor: 'Mobile-first investors comfortable with apps',
    rating: 3.9,
    link: 'https://robinhood.com',
  },
  {
    id: 'wealthsimple',
    name: 'Wealthsimple',
    type: 'robo-advisor',
    icon: '🍁',
    minInvestment: 0,
    fee: '0.4% - 0.5%',
    feeDetails: 'Lower fees at higher balances',
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    region: 'CA',
    pros: ['Canadian-focused', 'Socially responsible options', 'Easy interface', 'Tax optimization'],
    cons: ['Higher fees than US options', 'Limited international exposure'],
    bestFor: 'Canadian students wanting automated investing',
    rating: 4.6,
    link: 'https://www.wealthsimple.com',
  },
  {
    id: 'charles-schwab',
    name: 'Charles Schwab',
    type: 'broker',
    icon: '🏛️',
    minInvestment: 0,
    fee: 'Free trading',
    feeDetails: 'No account minimums',
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    region: 'US',
    pros: ['Excellent research', '24/7 customer service', 'Banking integration', 'Free ATMs worldwide'],
    cons: ['Can be overwhelming', 'Robo-advisor has $5k min'],
    bestFor: 'Students who want full-service broker',
    rating: 4.7,
    link: 'https://www.schwab.com',
  },
  {
    id: 'acorns',
    name: 'Acorns',
    type: 'micro-investing',
    icon: '🌰',
    minInvestment: 0,
    fee: '$3-5/month',
    feeDetails: 'Flat fee regardless of balance',
    riskProfiles: ['conservative', 'moderate'],
    region: 'US',
    pros: ['Round-up feature', 'Easy to start', 'Found money', 'Educational content'],
    cons: ['High fee % on small balances', 'Limited control', 'Flat fee expensive under $5k'],
    bestFor: 'Complete beginners wanting to start tiny',
    rating: 4.2,
    link: 'https://www.acorns.com',
  },
  {
    id: 'moneybox',
    name: 'Moneybox',
    type: 'micro-investing',
    icon: '🐖',
    minInvestment: 1,
    fee: '£1-3/month',
    feeDetails: 'Plus 0.45% fund fees',
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    region: 'UK',
    pros: ['Round-up investing', 'LISA available', 'Low minimum', 'Simple interface'],
    cons: ['Fees add up', 'Limited fund options', 'Not full-featured broker'],
    bestFor: 'UK students starting with small amounts',
    rating: 4.4,
    link: 'https://www.moneyboxapp.com',
  },
  {
    id: 'trading-212',
    name: 'Trading 212',
    type: 'broker',
    icon: '🇪🇺',
    minInvestment: 0,
    fee: 'Free trading',
    feeDetails: 'No commissions',
    riskProfiles: ['moderate', 'aggressive'],
    region: 'UK',
    pros: ['Zero fees', 'ISA available', 'Fractional shares', 'Practice account'],
    cons: ['Waitlist to join', 'Limited research', 'CFD temptation'],
    bestFor: 'UK/EU students wanting free trading',
    rating: 4.3,
    link: 'https://www.trading212.com',
  },
];

// GET /api/invest/platforms - Get recommended investment platforms
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const region = searchParams.get('region') || 'US';

    let riskTolerance = 'moderate';

    // If userId provided, get their risk profile
    if (userId) {
      const profile = await prisma.investmentProfile.findUnique({
        where: { userId },
      });
      if (profile) {
        riskTolerance = profile.riskTolerance;
      }
    }

    // Filter platforms by region and risk profile
    let platforms = PLATFORMS.filter((p) => {
      const regionMatch = p.region === region || p.region === 'US'; // US platforms often available globally
      const riskMatch = p.riskProfiles.includes(riskTolerance);
      return regionMatch && riskMatch;
    });

    // Score and sort platforms
    const scoredPlatforms = platforms.map((platform) => {
      let score = platform.rating * 20; // Base score from rating

      // Bonus for matching risk profile exactly
      if (riskTolerance === 'conservative' && platform.type === 'robo-advisor') {
        score += 10;
      }
      if (riskTolerance === 'aggressive' && platform.type === 'broker') {
        score += 10;
      }

      // Bonus for no/low minimum
      if (platform.minInvestment === 0) {
        score += 15;
      } else if (platform.minInvestment <= 100) {
        score += 10;
      }

      // Penalty for monthly fees on small balances
      if (platform.fee.includes('/month') || platform.fee.includes('/mo')) {
        score -= 5;
      }

      return { ...platform, score };
    });

    // Sort by score
    scoredPlatforms.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      platforms: scoredPlatforms.slice(0, 6), // Return top 6
      riskTolerance,
      region,
    });
  } catch (error) {
    console.error('Failed to get platform recommendations:', error);
    return NextResponse.json({ error: 'Failed to get platforms' }, { status: 500 });
  }
}
