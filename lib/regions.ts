import { Region, RegionConfig } from './types';

// Region configurations with financial products and locale settings
export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  US: {
    region: 'US',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    financialProducts: {
      retirementAccounts: ['401(k)', 'IRA', 'Roth IRA'],
      savingsAccounts: ['High-Yield Savings Account', 'Money Market Account', 'CD (Certificate of Deposit)'],
      studentLoans: 'Federal Student Loans (subsidized/unsubsidized), Private Student Loans'
    }
  },
  UK: {
    region: 'UK',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    financialProducts: {
      retirementAccounts: ['ISA (Individual Savings Account)', 'LISA (Lifetime ISA)', 'Pension Scheme'],
      savingsAccounts: ['Easy Access Savings', 'Fixed Rate Bonds', 'Help to Buy ISA'],
      studentLoans: 'Student Finance England, Plan 1/Plan 2/Plan 5 loans'
    }
  },
  EU: {
    region: 'EU',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    financialProducts: {
      retirementAccounts: ['Private Pension Plans', 'Riester-Rente', 'Company Pension Schemes'],
      savingsAccounts: ['Savings Account (Sparkonto)', 'Fixed Deposit', 'Building Society Savings'],
      studentLoans: 'BAföG (Germany), National student aid programs'
    }
  }
};

// Helper to get region config by region code
export function getRegionConfig(region: Region): RegionConfig {
  return REGION_CONFIGS[region];
}

// Helper to format currency with proper symbol and locale
export function formatCurrencyByRegion(amount: number, region: Region): string {
  const config = REGION_CONFIGS[region];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Get all available regions for selection
export function getAvailableRegions(): Array<{ value: Region; label: string; flag: string }> {
  return [
    { value: 'US', label: 'United States', flag: '🇺🇸' },
    { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'EU', label: 'European Union', flag: '🇪🇺' },
  ];
}
