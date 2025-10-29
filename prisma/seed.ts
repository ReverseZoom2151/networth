/**
 * Database Seed File
 *
 * Populates the database with initial content:
 * - Credit tips for all regions
 * - FAQs
 * - Goal templates
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // CREDIT TIPS
  // ============================================

  console.log('📝 Seeding credit tips...');

  const creditTipsData = [
    // US Tips
    {
      region: 'US',
      category: 'building_credit',
      tipText: 'Check your credit report free at AnnualCreditReport.com - the only official site authorized by federal law.',
      importance: 100,
    },
    {
      region: 'US',
      category: 'building_credit',
      tipText: 'Never close your oldest credit card - it helps your credit history length, which accounts for 15% of your score.',
      importance: 90,
    },
    {
      region: 'US',
      category: 'building_credit',
      tipText: 'Set up autopay to never miss a payment - payment history is the most important factor at 35% of your score.',
      importance: 95,
    },
    {
      region: 'US',
      category: 'maintaining_score',
      tipText: 'Keep credit card balances under 30% of your limit - even better is under 10% for excellent scores.',
      importance: 85,
    },
    {
      region: 'US',
      category: 'maintaining_score',
      tipText: 'Becoming an authorized user on a parent\'s or partner\'s good credit account can help boost your score quickly.',
      importance: 70,
    },

    // UK Tips
    {
      region: 'UK',
      category: 'building_credit',
      tipText: 'Register on the electoral roll - it proves your identity and address, which is crucial for UK credit scores.',
      importance: 100,
    },
    {
      region: 'UK',
      category: 'building_credit',
      tipText: 'Keep old credit accounts open to maintain your credit history - even if you don\'t use them regularly.',
      importance: 85,
    },
    {
      region: 'UK',
      category: 'maintaining_score',
      tipText: 'Check your credit report for errors on ClearScore or Credit Karma UK - 1 in 4 reports have mistakes!',
      importance: 90,
    },
    {
      region: 'UK',
      category: 'repairing_credit',
      tipText: 'Avoid payday loans - they can seriously harm your credit score and make it harder to get mortgages.',
      importance: 95,
    },
    {
      region: 'UK',
      category: 'building_credit',
      tipText: 'Use a credit builder card if you\'re starting from scratch - make small purchases and pay off in full each month.',
      importance: 80,
    },

    // EU Tips
    {
      region: 'EU',
      category: 'building_credit',
      tipText: 'In Germany, your SCHUFA score is crucial for rentals and contracts - check it annually for free.',
      importance: 100,
    },
    {
      region: 'EU',
      category: 'maintaining_score',
      tipText: 'Always pay utility bills on time - they directly affect your credit score across the EU.',
      importance: 95,
    },
    {
      region: 'EU',
      category: 'maintaining_score',
      tipText: 'Avoid overdrafts and negative bank balances - they can significantly hurt your creditworthiness.',
      importance: 90,
    },
    {
      region: 'EU',
      category: 'building_credit',
      tipText: 'Build credit slowly with a low-limit credit card - responsible usage over time is key.',
      importance: 75,
    },
    {
      region: 'EU',
      category: 'building_credit',
      tipText: 'Check your credit report annually for free from your national credit bureau - it\'s your legal right.',
      importance: 85,
    },

    // Universal Tips
    {
      region: 'ALL',
      category: 'maintaining_score',
      tipText: 'Dispute any errors on your credit report immediately - even small mistakes can cost you points.',
      importance: 90,
    },
    {
      region: 'ALL',
      category: 'maintaining_score',
      tipText: 'Too many credit applications in a short time can hurt your score - space them out by at least 6 months.',
      importance: 80,
    },
    {
      region: 'ALL',
      category: 'repairing_credit',
      tipText: 'If you\'ve missed payments, getting back on track is the fastest way to repair your credit - start today.',
      importance: 85,
    },
  ];

  for (const tip of creditTipsData) {
    await prisma.creditTip.upsert({
      where: { id: `${tip.region}-${tip.category}-${tip.importance}` },
      update: {},
      create: tip,
    });
  }

  console.log(`✅ Seeded ${creditTipsData.length} credit tips`);

  // ============================================
  // FAQs
  // ============================================

  console.log('❓ Seeding FAQs...');

  const faqsData = [
    {
      category: 'credit',
      question: 'What is a good credit score?',
      answer: 'In the US, a score above 700 is considered good, while 800+ is excellent. In the UK, scores above 881 (out of 999) are good. Requirements vary by region and lender.',
      order: 1,
    },
    {
      category: 'credit',
      question: 'How long does it take to build credit?',
      answer: 'With responsible use, you can build a decent credit score in 6-12 months. However, excellent credit typically takes 2-3 years of consistent good behavior.',
      order: 2,
    },
    {
      category: 'budgeting',
      question: 'What is the 50/30/20 budget rule?',
      answer: '50% of income goes to needs (rent, food), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment. It\'s a simple starting point that you can adjust.',
      order: 1,
    },
    {
      category: 'app',
      question: 'Is my financial data secure?',
      answer: 'Yes! We use industry-standard encryption and never store your banking passwords. Your data is stored securely and is only accessible to you.',
      order: 1,
    },
    {
      category: 'app',
      question: 'Can I use this app in multiple countries?',
      answer: 'Yes! Networth supports the US, UK, and EU with region-specific financial advice, currency formatting, and local financial products.',
      order: 2,
    },
  ];

  for (const faq of faqsData) {
    await prisma.fAQ.upsert({
      where: { id: `${faq.category}-${faq.order}` },
      update: {},
      create: faq,
    });
  }

  console.log(`✅ Seeded ${faqsData.length} FAQs`);

  // ============================================
  // GOAL TEMPLATES
  // ============================================

  console.log('🎯 Seeding goal templates...');

  const goalTemplatesData = [
    {
      name: 'Emergency Fund',
      description: '3-6 months of living expenses for unexpected situations',
      icon: '🛡️',
      category: 'Security',
      defaultAmounts: { US: 5000, UK: 4000, EU: 4500 },
      defaultTimeframe: 1,
      tips: [
        'Start with $1,000 as a mini emergency fund',
        'Keep it in a high-yield savings account',
        'Aim for 3-6 months of expenses',
        'Only use for true emergencies',
      ],
      order: 1,
    },
    {
      name: 'Study Abroad',
      description: 'Experience education in another country',
      icon: '✈️',
      category: 'Education',
      defaultAmounts: { US: 8000, UK: 6500, EU: 7000 },
      defaultTimeframe: 2,
      tips: [
        'Research scholarship opportunities early',
        'Factor in visa and insurance costs',
        'Consider part-time work options abroad',
        'Save for both tuition and living expenses',
      ],
      order: 2,
    },
    {
      name: 'Graduation Trip',
      description: 'Celebrate your achievement with friends',
      icon: '🎓',
      category: 'Lifestyle',
      defaultAmounts: { US: 3000, UK: 2500, EU: 2800 },
      defaultTimeframe: 1,
      tips: [
        'Book flights early for better deals',
        'Split accommodation costs with friends',
        'Set a daily spending budget',
        'Look for student travel discounts',
      ],
      order: 3,
    },
    {
      name: 'Car Down Payment',
      description: 'Get your first car or upgrade',
      icon: '🚗',
      category: 'Transportation',
      defaultAmounts: { US: 5000, UK: 3500, EU: 4000 },
      defaultTimeframe: 2,
      tips: [
        'Aim for 20% down to avoid being underwater',
        'Consider certified pre-owned vehicles',
        'Factor in insurance and maintenance costs',
        'Compare loan rates from multiple lenders',
      ],
      order: 4,
    },
    {
      name: 'First Apartment',
      description: 'Security deposit and first month\'s rent',
      icon: '🏠',
      category: 'Housing',
      defaultAmounts: { US: 4000, UK: 3000, EU: 3500 },
      defaultTimeframe: 1,
      tips: [
        'Budget for furniture and utilities too',
        'Save 3x monthly rent for move-in costs',
        'Build credit for better rental applications',
        'Research neighborhoods thoroughly',
      ],
      order: 5,
    },
    {
      name: 'Wedding Fund',
      description: 'Start planning your special day',
      icon: '💍',
      category: 'Life Events',
      defaultAmounts: { US: 10000, UK: 8000, EU: 9000 },
      defaultTimeframe: 3,
      tips: [
        'Set priorities - decide what matters most',
        'Consider off-season dates for savings',
        'Track expenses in a dedicated account',
        'Ask about package deals with venues',
      ],
      order: 6,
    },
    {
      name: 'Business Startup',
      description: 'Launch your entrepreneurial dream',
      icon: '💼',
      category: 'Career',
      defaultAmounts: { US: 7000, UK: 5500, EU: 6000 },
      defaultTimeframe: 2,
      tips: [
        'Start small and reinvest profits',
        'Keep business and personal funds separate',
        'Research grants and startup competitions',
        'Build a detailed business plan',
      ],
      order: 7,
    },
    {
      name: 'New Laptop',
      description: 'Upgrade your tech for school or work',
      icon: '💻',
      category: 'Technology',
      defaultAmounts: { US: 1500, UK: 1200, EU: 1300 },
      defaultTimeframe: 1,
      tips: [
        'Look for student discounts',
        'Consider refurbished options',
        'Wait for back-to-school sales',
        'Invest in extended warranty for expensive models',
      ],
      order: 8,
    },
    {
      name: 'Start Investing',
      description: 'Begin building long-term wealth',
      icon: '📈',
      category: 'Wealth Building',
      defaultAmounts: { US: 2000, UK: 1500, EU: 1700 },
      defaultTimeframe: 1,
      tips: [
        'Start with index funds for diversification',
        'Take advantage of employer 401(k) matching',
        'Consider Roth IRA for tax-free growth',
        'Invest consistently, even small amounts',
      ],
      order: 9,
    },
    {
      name: 'Concert or Festival',
      description: 'Experience live music and make memories',
      icon: '🎵',
      category: 'Entertainment',
      defaultAmounts: { US: 800, UK: 600, EU: 700 },
      defaultTimeframe: 1,
      tips: [
        'Buy tickets early for early bird prices',
        'Factor in travel and accommodation',
        'Set a daily spending limit for the event',
        'Look for group ticket discounts',
      ],
      order: 10,
    },
  ];

  for (const template of goalTemplatesData) {
    await prisma.goalTemplate.upsert({
      where: { id: `${template.category}-${template.name}` },
      update: {},
      create: template,
    });
  }

  console.log(`✅ Seeded ${goalTemplatesData.length} goal templates`);

  console.log('✨ Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
