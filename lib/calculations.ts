/**
 * Financial Calculations Library
 *
 * Provides accurate mathematical calculations for financial scenarios
 * using the 'financial' library for precision
 */

import { fv, pmt, pv, nper } from 'financial';

/**
 * Calculate future value with compound interest
 * @param presentValue - Current amount saved
 * @param monthlyContribution - Amount added each month
 * @param annualRate - Annual interest rate (e.g., 0.07 for 7%)
 * @param years - Number of years
 * @returns Future value
 */
export function calculateFutureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  // fv = future value of series of payments
  // Parameters: rate, nper, pmt, pv
  const futureValue = -fv(monthlyRate, numPayments, -monthlyContribution, -presentValue);

  return Math.max(0, futureValue);
}

/**
 * Calculate monthly payment needed to reach a goal
 * @param targetAmount - Goal amount
 * @param currentAmount - Amount already saved
 * @param annualRate - Annual interest rate
 * @param years - Years to reach goal
 * @returns Monthly payment needed
 */
export function calculateMonthlyPayment(
  targetAmount: number,
  currentAmount: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  // pmt = payment for a loan
  // Parameters: rate, nper, pv, fv
  const payment = -pmt(monthlyRate, numPayments, -currentAmount, targetAmount);

  return Math.max(0, payment);
}

/**
 * Calculate time needed to reach goal with current savings rate
 * @param targetAmount - Goal amount
 * @param currentAmount - Amount already saved
 * @param monthlyContribution - Monthly savings
 * @param annualRate - Annual interest rate
 * @returns Months needed (or null if impossible)
 */
export function calculateTimeToGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
  annualRate: number
): number | null {
  if (monthlyContribution <= 0 && currentAmount >= targetAmount) {
    return 0;
  }

  if (monthlyContribution <= 0) {
    return null; // Can't reach goal without contributions
  }

  const monthlyRate = annualRate / 12;

  try {
    // nper = number of periods
    // Parameters: rate, pmt, pv, fv
    const months = nper(monthlyRate, -monthlyContribution, -currentAmount, targetAmount);

    return months > 0 ? Math.ceil(months) : null;
  } catch {
    return null;
  }
}

/**
 * Calculate compound interest growth
 * @param principal - Initial amount
 * @param annualRate - Annual interest rate
 * @param years - Number of years
 * @param compoundFrequency - Times per year (12 = monthly, 365 = daily)
 * @returns Final amount
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  compoundFrequency: number = 12
): number {
  const amount = principal * Math.pow(
    1 + annualRate / compoundFrequency,
    compoundFrequency * years
  );

  return amount;
}

/**
 * Calculate total interest earned
 * @param principal - Initial amount
 * @param finalAmount - Final amount
 * @returns Interest earned
 */
export function calculateInterestEarned(
  principal: number,
  finalAmount: number
): number {
  return Math.max(0, finalAmount - principal);
}

/**
 * Calculate effective annual rate (APY)
 * @param nominalRate - Nominal annual rate
 * @param compoundFrequency - Times per year
 * @returns Effective annual rate
 */
export function calculateAPY(
  nominalRate: number,
  compoundFrequency: number = 12
): number {
  return Math.pow(1 + nominalRate / compoundFrequency, compoundFrequency) - 1;
}

/**
 * Calculate loan payment
 * @param loanAmount - Principal loan amount
 * @param annualRate - Annual interest rate
 * @param years - Loan term in years
 * @returns Monthly payment
 */
export function calculateLoanPayment(
  loanAmount: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  const payment = -pmt(monthlyRate, numPayments, loanAmount, 0);

  return payment;
}

/**
 * Generate savings projection timeline
 * @param currentAmount - Starting amount
 * @param monthlyContribution - Monthly addition
 * @param annualRate - Annual interest rate
 * @param years - Years to project
 * @returns Array of {month, balance} objects
 */
export function generateSavingsProjection(
  currentAmount: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): Array<{ month: number; balance: number; totalContributed: number; totalInterest: number }> {
  const monthlyRate = annualRate / 12;
  const projection: Array<{ month: number; balance: number; totalContributed: number; totalInterest: number }> = [];

  let balance = currentAmount;
  let totalContributed = currentAmount;

  for (let month = 0; month <= years * 12; month++) {
    if (month > 0) {
      // Add interest
      balance = balance * (1 + monthlyRate);
      // Add contribution
      balance += monthlyContribution;
      totalContributed += monthlyContribution;
    }

    projection.push({
      month,
      balance: Math.round(balance * 100) / 100,
      totalContributed: Math.round(totalContributed * 100) / 100,
      totalInterest: Math.round((balance - totalContributed) * 100) / 100,
    });
  }

  return projection;
}

/**
 * Calculate retirement savings needed
 * @param currentAge - Current age
 * @param retirementAge - Target retirement age
 * @param currentSavings - Amount already saved
 * @param annualIncome - Current annual income
 * @param incomeReplacementRatio - % of income needed in retirement (default 80%)
 * @param yearsInRetirement - Expected years in retirement (default 25)
 * @param annualReturn - Expected annual return rate
 * @returns Required retirement savings
 */
export function calculateRetirementNeeds(
  currentAge: number,
  retirementAge: number,
  currentSavings: number,
  annualIncome: number,
  incomeReplacementRatio: number = 0.8,
  yearsInRetirement: number = 25,
  annualReturn: number = 0.07
): {
  targetAmount: number;
  monthlyContributionNeeded: number;
  projectedValue: number;
  shortfall: number;
} {
  const yearsToRetirement = retirementAge - currentAge;
  const annualIncomeNeeded = annualIncome * incomeReplacementRatio;

  // Calculate how much is needed at retirement (present value of retirement income)
  const monthlyIncomeNeeded = annualIncomeNeeded / 12;
  const monthsInRetirement = yearsInRetirement * 12;
  const monthlyRateRetirement = annualReturn / 12;

  // Present value of income stream needed
  const targetAmount = -pv(monthlyRateRetirement, monthsInRetirement, monthlyIncomeNeeded, 0);

  // Calculate what current savings will grow to
  const projectedValue = calculateFutureValue(currentSavings, 0, annualReturn, yearsToRetirement);

  // Calculate monthly contribution needed
  const shortfall = Math.max(0, targetAmount - projectedValue);
  const monthlyContributionNeeded = shortfall > 0
    ? calculateMonthlyPayment(targetAmount, currentSavings, annualReturn, yearsToRetirement)
    : 0;

  return {
    targetAmount: Math.round(targetAmount),
    monthlyContributionNeeded: Math.round(monthlyContributionNeeded),
    projectedValue: Math.round(projectedValue),
    shortfall: Math.round(shortfall),
  };
}

/**
 * Calculate debt payoff timeline
 * @param principal - Debt amount
 * @param annualRate - Annual interest rate
 * @param monthlyPayment - Monthly payment amount
 * @returns Months to payoff and total interest
 */
export function calculateDebtPayoff(
  principal: number,
  annualRate: number,
  monthlyPayment: number
): {
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
} | null {
  if (monthlyPayment <= 0) return null;

  const monthlyRate = annualRate / 12;

  // Check if payment covers interest
  const monthlyInterest = principal * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return null; // Payment doesn't cover interest
  }

  try {
    const months = nper(monthlyRate, -monthlyPayment, principal, 0);
    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;

    return {
      monthsToPayoff: Math.ceil(months),
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate house affordability
 * @param annualIncome - Annual gross income
 * @param monthlyDebts - Existing monthly debt payments
 * @param downPaymentPercent - Down payment as decimal (0.20 = 20%)
 * @param annualRate - Mortgage interest rate
 * @param years - Mortgage term
 * @returns Maximum affordable house price
 */
export function calculateHouseAffordability(
  annualIncome: number,
  monthlyDebts: number,
  downPaymentPercent: number,
  annualRate: number,
  years: number = 30
): {
  maxHousePrice: number;
  maxMonthlyPayment: number;
  maxLoanAmount: number;
  downPaymentNeeded: number;
} {
  const monthlyIncome = annualIncome / 12;

  // 28/36 rule: housing costs ≤ 28% gross income, total debt ≤ 36%
  const maxHousingPayment = monthlyIncome * 0.28;
  const maxTotalDebt = monthlyIncome * 0.36;

  // Account for existing debts
  const maxMonthlyPayment = Math.min(maxHousingPayment, maxTotalDebt - monthlyDebts);

  // Calculate max loan based on payment
  const monthlyRate = annualRate / 12;
  const numPayments = years * 12;

  const maxLoanAmount = -pv(monthlyRate, numPayments, maxMonthlyPayment, 0);

  // Calculate max house price
  const maxHousePrice = maxLoanAmount / (1 - downPaymentPercent);
  const downPaymentNeeded = maxHousePrice * downPaymentPercent;

  return {
    maxHousePrice: Math.round(maxHousePrice),
    maxMonthlyPayment: Math.round(maxMonthlyPayment),
    maxLoanAmount: Math.round(maxLoanAmount),
    downPaymentNeeded: Math.round(downPaymentNeeded),
  };
}

/**
 * Calculate debt payoff timeline for multiple debts
 * @param debts - Array of debts with balance, interestRate, minimumPayment
 * @param totalMonthlyPayment - Total amount to pay each month across all debts
 * @returns Months to payoff, total interest, and total paid
 */
export function calculateDebtPayoffMultiple(
  debts: Array<{ balance: number; interestRate: number; minimumPayment: number }>,
  totalMonthlyPayment: number
): {
  months: number;
  totalInterest: number;
  totalPaid: number;
} {
  if (debts.length === 0 || totalMonthlyPayment <= 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }

  // Clone debts to avoid mutating original
  let remainingDebts = debts.map(d => ({ ...d }));
  let month = 0;
  let totalInterestPaid = 0;

  // Safety limit to prevent infinite loops
  const maxMonths = 600; // 50 years

  while (remainingDebts.length > 0 && month < maxMonths) {
    month++;
    let remainingPayment = totalMonthlyPayment;

    // First, pay minimum on all debts (except the target debt)
    for (let i = 1; i < remainingDebts.length; i++) {
      const debt = remainingDebts[i];
      const monthlyInterest = debt.balance * (debt.interestRate / 12);
      const minPayment = Math.min(debt.minimumPayment, debt.balance + monthlyInterest);

      debt.balance += monthlyInterest;
      debt.balance -= minPayment;
      totalInterestPaid += monthlyInterest;
      remainingPayment -= minPayment;
    }

    // Put remaining payment toward first debt (target debt)
    if (remainingDebts.length > 0 && remainingPayment > 0) {
      const targetDebt = remainingDebts[0];
      const monthlyInterest = targetDebt.balance * (targetDebt.interestRate / 12);
      targetDebt.balance += monthlyInterest;
      totalInterestPaid += monthlyInterest;

      const payment = Math.min(remainingPayment, targetDebt.balance);
      targetDebt.balance -= payment;
    }

    // Remove paid-off debts
    remainingDebts = remainingDebts.filter(d => d.balance > 0.01);
  }

  const totalPaid = totalMonthlyPayment * month;

  return {
    months: month,
    totalInterest: Math.round(totalInterestPaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

/**
 * Default interest rates by scenario
 */
export const DEFAULT_RATES = {
  highYieldSavings: 0.045, // 4.5%
  savingsAccount: 0.02, // 2%
  investment: 0.07, // 7% (historical stock market average)
  mortgage: 0.07, // 7%
  studentLoan: 0.055, // 5.5%
  creditCard: 0.20, // 20%
  personalLoan: 0.10, // 10%
} as const;

/**
 * Calculate financial health score (0-100)
 * Based on multiple factors: savings, debt, spending, investments, credit
 */
export function calculateFinancialHealthScore(params: {
  emergencyFundMonths: number; // Months of expenses saved
  savingsRate: number; // % of income saved
  debtToIncomeRatio: number; // Total debt / annual income
  creditScore: number; // Credit score (0-850)
  investmentRatio: number; // Investment value / annual income
  budgetAdherence: number; // % of months within budget (0-1)
}): {
  overallScore: number;
  savingsScore: number;
  debtScore: number;
  spendingScore: number;
  investmentScore: number;
  creditScore: number;
} {
  // Savings Score (0-100)
  const savingsScore = Math.min(100, 
    (params.emergencyFundMonths / 6) * 50 + // Emergency fund: 50 points for 6+ months
    Math.min(50, params.savingsRate * 500) // Savings rate: 50 points for 10%+
  );

  // Debt Score (0-100)
  const debtScore = Math.max(0, 
    100 - (params.debtToIncomeRatio * 200) // Lower debt-to-income = higher score
  );

  // Spending Score (0-100)
  const spendingScore = params.budgetAdherence * 100;

  // Investment Score (0-100)
  const investmentScore = Math.min(100, params.investmentRatio * 25); // 4x income = 100 points

  // Credit Score (0-100) - normalized from 0-850 to 0-100
  const creditScore = (params.creditScore / 850) * 100;

  // Overall Score (weighted average)
  const overallScore = Math.round(
    savingsScore * 0.25 +
    debtScore * 0.25 +
    spendingScore * 0.20 +
    investmentScore * 0.15 +
    creditScore * 0.15
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    savingsScore: Math.round(savingsScore),
    debtScore: Math.round(debtScore),
    spendingScore: Math.round(spendingScore),
    investmentScore: Math.round(investmentScore),
    creditScore: Math.round(creditScore),
  };
}

/**
 * Calculate tax estimate
 */
export function calculateTaxEstimate(params: {
  annualIncome: number;
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
  region: 'US' | 'UK' | 'EU';
  deductions?: number;
  credits?: number;
}): {
  estimatedTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
} {
  // Simplified tax calculation - in production, use actual tax brackets
  let estimatedTax = 0;
  let effectiveRate = 0;
  let marginalRate = 0;

  if (params.region === 'US') {
    // 2024 US Federal Tax Brackets (simplified)
    const taxableIncome = params.annualIncome - (params.deductions || 0);
    
    if (params.filingStatus === 'single') {
      if (taxableIncome <= 11000) {
        marginalRate = 0.10;
        estimatedTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 44725) {
        marginalRate = 0.12;
        estimatedTax = 1100 + (taxableIncome - 11000) * 0.12;
      } else if (taxableIncome <= 95375) {
        marginalRate = 0.22;
        estimatedTax = 5147 + (taxableIncome - 44725) * 0.22;
      } else if (taxableIncome <= 201050) {
        marginalRate = 0.24;
        estimatedTax = 16290 + (taxableIncome - 95375) * 0.24;
      } else {
        marginalRate = 0.32;
        estimatedTax = 37104 + (taxableIncome - 201050) * 0.32;
      }
    }
    // Add other filing statuses and state taxes as needed
    
    estimatedTax = Math.max(0, estimatedTax - (params.credits || 0));
  } else if (params.region === 'UK') {
    // UK tax calculation (simplified)
    const personalAllowance = 12570; // 2024-25
    const taxableIncome = Math.max(0, params.annualIncome - personalAllowance - (params.deductions || 0));
    
    if (taxableIncome <= 37700) {
      marginalRate = 0.20;
      estimatedTax = taxableIncome * 0.20;
    } else if (taxableIncome <= 125140) {
      marginalRate = 0.40;
      estimatedTax = 7540 + (taxableIncome - 37700) * 0.40;
    } else {
      marginalRate = 0.45;
      estimatedTax = 42738 + (taxableIncome - 125140) * 0.45;
    }
  }

  effectiveRate = estimatedTax / params.annualIncome;
  const afterTaxIncome = params.annualIncome - estimatedTax;

  return {
    estimatedTax: Math.round(estimatedTax),
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    marginalRate: Math.round(marginalRate * 100) / 100,
    afterTaxIncome: Math.round(afterTaxIncome),
  };
}

/**
 * Calculate portfolio allocation recommendation
 */
export function calculatePortfolioAllocation(age: number, riskTolerance: 'conservative' | 'moderate' | 'aggressive'): {
  stocks: number;
  bonds: number;
  cash: number;
  other: number;
} {
  // Age-based allocation rule: (100 - age) in stocks
  let stocks = 100 - age;

  // Adjust based on risk tolerance
  if (riskTolerance === 'conservative') {
    stocks = Math.max(20, stocks - 20);
  } else if (riskTolerance === 'aggressive') {
    stocks = Math.min(90, stocks + 10);
  }

  const bonds = Math.max(0, Math.min(60, 100 - stocks - 10));
  const cash = 10;
  const other = 0;

  return {
    stocks: Math.round(stocks),
    bonds: Math.round(bonds),
    cash: Math.round(cash),
    other: Math.round(other),
  };
}
