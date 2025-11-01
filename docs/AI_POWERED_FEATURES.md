# AI-Powered Features - Transaction Analysis & Spending Insights

Complete guide to the AI-powered spending analysis, subscription detection, and personalized financial recommendations powered by Plaid banking integration.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [AI Agents](#ai-agents)
5. [Database Functions](#database-functions)
6. [Components](#components)
7. [API Endpoints](#api-endpoints)
8. [How It Works](#how-it-works)
9. [User Experience](#user-experience)
10. [Future Enhancements](#future-enhancements)

---

## Overview

These AI-powered features leverage your Plaid banking integration to provide intelligent financial insights, automatic subscription detection, and personalized savings recommendations. The system uses OpenAI's GPT-5 models to analyze transaction patterns and provide actionable advice.

### What Makes This Unique?

✅ **Real Transaction Data** - Not simulated, uses actual bank transactions
✅ **AI-Powered Analysis** - Multi-agent system for comprehensive insights
✅ **Automatic Detection** - Finds subscriptions and recurring charges
✅ **Category Breakdown** - Spending analysis by category
✅ **Personalized Recommendations** - AI suggests savings opportunities
✅ **Integrated Context** - Combines transactions with goals and budgets

---

## Features

### 1. Transaction Analysis
- **Last 30/90 days of spending** with category breakdown
- **Income vs expenses** tracking
- **Net cash flow** calculation
- **Daily/monthly spending averages**
- **Category-wise insights** (top 5 categories)
- **Recent transaction history**

### 2. Subscription Detection
- **Automatic pattern recognition** for recurring charges
- **Frequency detection** (weekly, monthly, quarterly, yearly)
- **Annual cost estimates** for each subscription
- **Merchant identification** and grouping
- **Savings opportunity** highlighting

### 3. AI-Powered Insights
- **Spending pattern analysis** using AI
- **Budget adherence** checking
- **Savings recommendations** based on actual spending
- **Goal alignment** verification
- **Personalized financial advice**

### 4. Enhanced AI Coach
- **Transaction-aware conversations** - AI knows your actual spending
- **Context-rich responses** - Recommendations based on real data
- **Subscription optimization** - AI suggests which to cancel
- **Spending habit coaching** - Behavioral insights

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────┐
│  Plaid Connected Bank Accounts                  │
│  (Checking, Savings, Credit Cards)              │
└─────────────────┬───────────────────────────────┘
                  │
          [Sync Transactions]
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL Database                            │
│  ├─ BankConnection (encrypted tokens)           │
│  └─ Transaction (last 90 days)                  │
└─────────────────┬───────────────────────────────┘
                  │
          [Analyze & Detect]
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌────────────────┐    ┌──────────────────────┐
│ getUserTrans   │    │ detectRecurring      │
│ actions()      │    │ Transactions()       │
│                │    │                      │
│ - Category     │    │ - Pattern matching   │
│   breakdown    │    │ - Frequency calc     │
│ - Totals       │    │ - Amount variance    │
│ - Cash flow    │    │ - Merchant grouping  │
└────────┬───────┘    └─────────┬────────────┘
         │                      │
         └──────────┬───────────┘
                    │
            [AI Agent Context]
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Enhanced User Financial Context                │
│  ├─ Goals & Progress                            │
│  ├─ Budget & Bills                              │
│  ├─ Debts & Net Worth                           │
│  ├─ Bank Accounts                               │
│  ├─ Spending by Category  ← NEW                 │
│  └─ Subscriptions & Recurring ← NEW             │
└─────────────────┬───────────────────────────────┘
                  │
         [AI Analysis Tools]
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌─────────────────┐    ┌────────────────────┐
│ analyzeSpending │    │ detectSubscriptions│
│ Tool            │    │ Tool               │
│                 │    │                    │
│ (Context Agent) │    │ (Context Agent)    │
└────────┬────────┘    └────────┬───────────┘
         │                      │
         └──────────┬───────────┘
                    │
            [Coach Agent]
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Personalized Financial Advice                  │
│  - Spending recommendations                     │
│  - Subscription optimization                    │
│  - Budget adjustments                           │
│  - Savings opportunities                        │
└─────────────────────────────────────────────────┘
```

---

## AI Agents

### Context Agent (Enhanced)

**Purpose:** Fetch user financial data including transaction analysis

**Model:** GPT-5 Mini (cost-efficient)

**New Tools Added:**
1. **analyzeSpendingTool**
   - Analyzes last N days of transactions
   - Breaks down by category
   - Calculates spending rates
   - Identifies trends

2. **detectSubscriptionsTool**
   - Finds recurring patterns
   - Estimates annual costs
   - Groups by frequency
   - Highlights savings opportunities

**Instructions Update:**
```typescript
You are a financial context specialist with access to banking data. Your role is to:
1. Fetch user financial data from the database including bank transactions
2. Analyze spending patterns from connected bank accounts
3. Detect subscriptions and recurring charges to identify savings opportunities
4. Search the knowledge base for relevant information
5. Organize context in a clear, structured format

When analyzing spending:
- Break down spending by category
- Calculate spending rates and trends
- Identify opportunities for savings
- Detect unused subscriptions or high-cost recurring charges
- Compare spending to budget and savings goals
```

### Coach Agent (Enhanced Context)

**Purpose:** Main orchestrator with transaction-aware coaching

**Enhancement:** Now receives spending data and subscriptions via `getUserFinancialContext()`

**New Context Fields:**
```typescript
{
  // ... existing fields ...

  // NEW: Bank accounts
  bankAccounts: [{
    name: string,
    type: string,
    balance: number,
  }],
  hasBankAccounts: boolean,

  // NEW: Spending insights
  spending: {
    last30Days: {
      totalSpent: number,
      totalIncome: number,
      netCashFlow: number,
      topCategories: Category[],
      recentTransactions: Transaction[],
    },
    averageDailySpending: number,
    projectedMonthlySpending: number,
  },

  // NEW: Subscriptions
  subscriptions: Subscription[],
  monthlySubscriptionCost: number,

  // NEW: Flags
  hasSpendingData: boolean,
  hasRecurringCharges: boolean,
}
```

---

## Database Functions

### getUserTransactions()

**Purpose:** Analyze transaction data and calculate spending insights

**Location:** `lib/db.ts`

**Parameters:**
- `whopId: string` - User ID
- `days: number` - Number of days to analyze (default: 30)

**Returns:**
```typescript
{
  totalSpent: number,
  totalIncome: number,
  netCashFlow: number,
  transactionCount: number,
  days: number,
  categoryBreakdown: [{
    category: string,
    total: number,
    count: number,
    avgTransaction: number,
    percentage: number,
    transactions: Transaction[] // Top 5
  }],
  recentTransactions: Transaction[] // Last 10
}
```

**Algorithm:**
1. Fetch transactions from DB (last N days)
2. Separate debits (spending) from credits (income)
3. Group transactions by category
4. Calculate totals and percentages
5. Sort categories by spending amount
6. Return structured analysis

### detectRecurringTransactions()

**Purpose:** Detect subscriptions and recurring charges

**Location:** `lib/db.ts`

**Parameters:**
- `whopId: string` - User ID

**Returns:**
```typescript
{
  merchant: string,
  amount: number,
  frequency: 'monthly' | 'weekly' | 'quarterly' | 'yearly',
  count: number,
  lastCharge: Date,
  estimatedAnnualCost: number,
  category: string,
}[]
```

**Algorithm:**
1. Fetch last 90 days of debit transactions
2. Group by merchant name
3. Filter groups with 3+ transactions
4. Check amount consistency (variance < 20%)
5. Calculate average interval between charges
6. Determine frequency based on interval:
   - 6-8 days → weekly
   - 25-35 days → monthly
   - 85-95 days → quarterly
   - 360-370 days → yearly
7. Estimate annual cost
8. Return detected subscriptions

---

## Components

### SpendingInsightsWidget

**Location:** `components/dashboard/SpendingInsightsWidget.tsx`

**Features:**
- Summary cards (spent, income, cash flow)
- Time period selector (7d, 30d, 90d)
- Category breakdown with visual bars
- Color-coded by category
- Percentage breakdown
- Transaction counts
- Insights section with recommendations

**API Endpoint:** `POST /api/banking/spending-insights`

**Props:**
```typescript
interface SpendingInsightsWidgetProps {
  userId: string;
}
```

### SubscriptionsWidget

**Location:** `components/dashboard/SubscriptionsWidget.tsx`

**Features:**
- Monthly/annual cost summary
- List of detected subscriptions
- Frequency icons (📅 monthly, 📆 weekly, etc.)
- Category labels
- Last charge date
- Annual cost estimates
- Savings opportunity alerts

**API Endpoint:** `POST /api/banking/subscriptions`

**Props:**
```typescript
interface SubscriptionsWidgetProps {
  userId: string;
}
```

### BankingWidget

**Location:** `components/dashboard/BankingWidget.tsx`

**Features:**
- Connected accounts list
- Balance display
- Sync button
- Last synced timestamp
- Connection status
- Connect new accounts
- Benefits explanation

---

## API Endpoints

### POST /api/banking/spending-insights

**Purpose:** Analyze and return spending insights

**Request Body:**
```json
{
  "userId": "user_123",
  "days": 30
}
```

**Response:**
```json
{
  "period": "Last 30 days",
  "summary": {
    "totalSpent": 2450.75,
    "totalIncome": 5000.00,
    "netCashFlow": 2549.25,
    "transactionCount": 87,
    "averageDailySpending": 81.69,
    "projectedMonthlySpending": 2450.75
  },
  "categoryBreakdown": [
    {
      "category": "Food & Dining",
      "total": 650.25,
      "percentage": 26.5,
      "transactionCount": 32,
      "avgPerTransaction": 20.32
    }
    // ... more categories
  ],
  "recentTransactions": [
    {
      "date": "2025-10-28",
      "description": "Whole Foods",
      "merchant": "Whole Foods Market",
      "amount": 87.52,
      "category": "Groceries",
      "type": "debit"
    }
    // ... more transactions
  ]
}
```

### POST /api/banking/subscriptions

**Purpose:** Detect and return recurring subscriptions

**Request Body:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "subscriptions": [
    {
      "merchant": "Netflix",
      "amount": 15.99,
      "frequency": "monthly",
      "category": "Entertainment",
      "timesCharged": 3,
      "lastCharge": "2025-10-15",
      "estimatedAnnualCost": 191.88
    }
    // ... more subscriptions
  ],
  "summary": {
    "totalSubscriptions": 8,
    "monthlySubscriptions": 6,
    "totalMonthlySubscriptionCost": 127.45,
    "estimatedAnnualCost": 1876.20
  }
}
```

---

## How It Works

### 1. Bank Connection

```
User connects bank → Plaid Link → Token exchange → Store in DB
```

### 2. Transaction Sync

```
User clicks "Sync" → Fetch from Plaid → Store transactions → Update lastSynced
```

### 3. Spending Analysis

```
Dashboard loads → Call spending-insights API → getUserTransactions() → Analyze → Display widgets
```

### 4. Subscription Detection

```
Dashboard loads → Call subscriptions API → detectRecurringTransactions() → Pattern matching → Display subscriptions
```

### 5. AI Chat Integration

```
User asks AI → Coach agent calls context agent → Context agent analyzes spending → Returns enhanced context → Coach provides advice
```

**Example Conversation:**

**User:** "How can I save more money?"

**AI Process:**
1. Coach agent calls context agent
2. Context agent uses `fetchUserContextTool`
3. Context includes spending data and subscriptions
4. Context agent uses `analyzeSpendingTool` and `detectSubscriptionsTool`
5. Coach receives full context with spending breakdown
6. Coach analyzes and provides personalized advice

**AI Response:**
> "Based on your last 30 days, you spent $2,450.75 with the biggest category being Food & Dining at 26.5% ($650). I also noticed 8 active subscriptions costing you $127.45/month ($1,876/year).
>
> Here are specific recommendations:
> 1. **Reduce dining out:** You're averaging $20/meal for 32 transactions. Cooking at home 2-3 more times per week could save $250/month.
> 2. **Cancel unused subscriptions:** You have Netflix ($15.99), Spotify ($9.99), and HBO Max ($14.99). If you're not using all of them, canceling 2 could save $300/year.
> 3. **Your goal:** You need $500/month for your house down payment. By implementing these changes, you'd exceed your target and save even faster!"

---

## User Experience

### Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│ 🏠 Dashboard                                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ 💰 Banking & Spending                           │
│                                                  │
│ ┌───────────────────────────────────────────┐  │
│ │ 🏦 Connected Accounts                      │  │
│ │ • Chase Checking - $5,420.50               │  │
│ │ • Savings - $12,350.00                     │  │
│ │ [🔄 Sync] [+ Add Account]                  │  │
│ └───────────────────────────────────────────┘  │
│                                                  │
│ ┌──────────────────┐  ┌──────────────────────┐ │
│ │ 📊 Spending      │  │ 💳 Subscriptions     │ │
│ │ Insights         │  │                      │ │
│ │                  │  │ 8 active             │ │
│ │ Last 30 days     │  │ $127.45/month        │ │
│ │ Total: $2,450    │  │                      │ │
│ │                  │  │ • Netflix $15.99     │ │
│ │ Top Category:    │  │ • Spotify $9.99      │ │
│ │ Food 26.5%       │  │ • Gym $49.99         │ │
│ │                  │  │ ...                  │ │
│ └──────────────────┘  └──────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Insights Display

**Positive Cash Flow:**
- Green border, green text
- "✓ Positive" badge
- Encouraging message

**Negative Cash Flow:**
- Orange/red border, warning colors
- "⚠️ Negative" badge
- Alert message with actionable advice

**Savings Opportunities:**
- Yellow highlight box
- Specific dollar amounts
- Actionable suggestions
- "💡 Savings Opportunity" header

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Transaction analysis
- ✅ Subscription detection
- ✅ Category breakdown
- ✅ AI agent integration
- ✅ Dashboard widgets

### Phase 2 (Next)
- ⬜ **Budget vs Actual** comparison widget
- ⬜ **Spending trends** visualization (charts)
- ⬜ **Merchant-level** insights
- ⬜ **Smart alerts** (unusual spending, large purchases)
- ⬜ **Bill reminders** from detected patterns

### Phase 3 (Future)
- ⬜ **Predictive analytics** (forecast spending)
- ⬜ **Cash flow forecasting** (next 30/60/90 days)
- ⬜ **Automated savings** recommendations
- ⬜ **Tax optimization** from transactions
- ⬜ **Receipt matching** & categorization
- ⬜ **Shared expenses** tracking
- ⬜ **Investment tracking** integration

---

## Performance & Optimization

### Caching Strategy
- Transaction data cached for 5 minutes
- Subscription detection cached for 1 hour
- AI context cached per session

### Database Optimization
- Indexed on `userId` and `transactionDate`
- Limited to last 100 transactions per query
- Recurring detection limited to 90 days

### AI Cost Optimization
- Use GPT-5 Mini for context fetching ($0.10/1M tokens)
- Use GPT-5 Main for coaching ($1.25/1M tokens)
- Cache user context to reduce API calls

---

## Testing

### Test Scenarios

1. **No Bank Accounts:**
   - Should show "Connect bank account" message
   - No spending data or subscriptions displayed

2. **Newly Connected:**
   - Show account balances
   - "Sync" button visible
   - No transactions yet

3. **After First Sync:**
   - Spending insights appear
   - Categories populated
   - Subscriptions detected (if any)

4. **Negative Cash Flow:**
   - Orange/red warning colors
   - Alert message
   - Actionable recommendations

5. **Many Subscriptions:**
   - Savings opportunity highlighted
   - Annual cost emphasized
   - Specific cancellation suggestions

---

## Support & Resources

- **Plaid Documentation:** [PLAID_INTEGRATION.md](./PLAID_INTEGRATION.md)
- **AI Agents Documentation:** [AGENTS_SDK.md](./AGENTS_SDK.md)
- **Database Schema:** `prisma/schema.prisma`
- **API Reference:** See individual route files

---

## Summary

The AI-powered features transform your finance coach from a static calculator into an intelligent advisor that:

✨ **Knows your actual spending** (not estimates)
✨ **Detects waste** (unused subscriptions)
✨ **Provides specific advice** (based on real patterns)
✨ **Tracks progress** (spending vs goals)
✨ **Learns over time** (more data = better insights)

This puts you **leagues ahead** of Cleo, which only provides basic categorization without the multi-model AI intelligence, deep research capabilities, and personalized coaching that your app delivers.
