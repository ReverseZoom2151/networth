# Plaid Banking Integration

Complete guide to bank account connection using Plaid API for automatic transaction tracking and balance syncing.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup](#setup)
4. [Architecture](#architecture)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Components](#components)
8. [Security](#security)
9. [Pricing](#pricing)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Plaid integration enables users to securely connect their bank accounts for:
- **Automatic transaction syncing** - Pull last 30 days of transactions
- **Real-time balance tracking** - Current and available balances
- **Multi-account support** - Connect checking, savings, and credit cards
- **Regional support** - US and Canada banks

### Supported Providers

| Provider | Region | Documentation |
|----------|--------|---------------|
| **Plaid** | US/Canada | https://plaid.com/docs/ |
| TrueLayer | UK/EU | https://docs.truelayer.com/ |
| Mock | Development | N/A |

---

## Features

✅ **Bank Account Connection**
- OAuth-style secure connection flow
- Support for 11,000+ US/Canada financial institutions
- Multi-account connection support

✅ **Transaction Syncing**
- Automatic transaction categorization
- Historical data (up to 2 years)
- Real-time updates
- Duplicate detection

✅ **Balance Tracking**
- Current balance monitoring
- Available balance tracking
- Multi-currency support

✅ **Security**
- Bank-level 256-bit encryption
- Access tokens never expire (Plaid security model)
- Encrypted token storage in database
- SOC 2 Type II certified

---

## Setup

### 1. Create Plaid Account

1. Sign up at [Plaid Dashboard](https://dashboard.plaid.com/signup)
2. Create a new application
3. Get your credentials:
   - Client ID
   - Secret (Sandbox and/or Production)

### 2. Environment Variables

Add to `.env.local`:

```bash
# Banking Provider
BANKING_PROVIDER="plaid"

# Plaid Credentials
PLAID_CLIENT_ID="your_plaid_client_id"
PLAID_SECRET="your_plaid_sandbox_secret"
PLAID_ENVIRONMENT="sandbox"  # or "production"

# App URL (for redirects)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Install Dependencies

Already included in the project:
```bash
npm install plaid react-plaid-link
```

### 4. Database Migration

The database schema is already set up with `BankConnection` and `Transaction` models. Run migrations if needed:

```bash
npm run db:migrate
```

---

## Architecture

### Provider Abstraction

```
┌─────────────────────────────────────┐
│      Banking Provider Interface      │
│  (lib/banking/types.ts)              │
└─────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼──────┐
│ Plaid        │  │ TrueLayer   │
│ Provider     │  │ Provider    │
└──────────────┘  └─────────────┘
```

### Connection Flow

```
1. User clicks "Connect Bank"
   │
2. Frontend requests Link Token
   │  POST /api/banking/connect
   │
3. Backend creates Link Token
   │  Plaid.linkTokenCreate()
   │
4. Frontend opens Plaid Link
   │  usePlaidLink hook
   │
5. User selects bank & authenticates
   │
6. Frontend receives public_token
   │
7. Frontend exchanges token
   │  POST /api/banking/callback
   │
8. Backend exchanges for access_token
   │  Plaid.itemPublicTokenExchange()
   │
9. Backend fetches accounts
   │  Plaid.accountsGet()
   │
10. Store in database
    │  BankConnection records created
    │
11. Success! Accounts connected
```

### Transaction Sync Flow

```
1. User clicks "Sync" or automatic trigger
   │
2. Fetch bank connections from DB
   │  WHERE userId = X AND isActive = true
   │
3. For each connection:
   │  - Decrypt access token
   │  - Call Plaid.transactionsGet()
   │  - Get last 30 days of transactions
   │
4. Store/update transactions
   │  UPSERT by providerTransactionId
   │
5. Update lastSynced timestamp
   │
6. Return sync stats
```

---

## Usage

### Frontend: Connect Bank Account

```tsx
import { PlaidLink } from '@/components/banking/PlaidLink';

function MyComponent() {
  return (
    <PlaidLink
      userId={userId}
      onSuccess={(publicToken, metadata) => {
        console.log('Connected!', metadata);
      }}
      onExit={(error, metadata) => {
        console.log('Cancelled or error:', error);
      }}
    />
  );
}
```

### Frontend: Display Connected Accounts

```tsx
import { BankingWidget } from '@/components/dashboard/BankingWidget';

function Dashboard() {
  return (
    <BankingWidget userId={userId} />
  );
}
```

### Backend: Sync Transactions

```typescript
// Sync all accounts for a user
const response = await fetch('/api/banking/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    days: 30,  // Last 30 days
  }),
});

const { accounts, transactions } = await response.json();
// accounts: 2, transactions: 45
```

---

## API Endpoints

### POST /api/banking/connect

Create a Plaid Link token to initiate connection.

**Request:**
```json
{
  "userId": "user_123",
  "provider": "plaid"
}
```

**Response:**
```json
{
  "authUrl": "link-sandbox-xxx...",  // Link token
  "state": "plaid_user_123_...",
  "provider": "plaid"
}
```

### POST /api/banking/callback

Exchange public token for access token and store accounts.

**Request:**
```json
{
  "code": "public-sandbox-xxx...",  // public_token
  "state": "plaid_user_123_...",
  "userId": "user_123",
  "provider": "plaid"
}
```

**Response:**
```json
{
  "success": true,
  "accounts": 2,
  "message": "Bank accounts connected successfully"
}
```

### GET /api/banking/accounts

Fetch all connected accounts for a user.

**Request:**
```
GET /api/banking/accounts?userId=user_123
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "conn_xxx",
      "accountName": "Chase Checking",
      "accountType": "checking",
      "currency": "USD",
      "currentBalance": 5420.50,
      "availableBalance": 5420.50,
      "provider": "plaid",
      "lastSynced": "2025-11-01T10:30:00Z",
      "isActive": true
    }
  ],
  "total": 1
}
```

### POST /api/banking/sync

Sync transactions for all connected accounts.

**Request:**
```json
{
  "userId": "user_123",
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "accounts": 2,
  "transactions": 45
}
```

### DELETE /api/banking/accounts

Disconnect a bank account.

**Request:**
```
DELETE /api/banking/accounts?accountId=conn_xxx
```

**Response:**
```json
{
  "success": true,
  "message": "Account disconnected"
}
```

---

## Components

### PlaidLink Component

Located: `components/banking/PlaidLink.tsx`

**Purpose:** Initiates Plaid Link flow for connecting bank accounts.

**Props:**
```typescript
interface PlaidLinkProps {
  userId: string;
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
}
```

**Key Features:**
- Fetches link token from backend
- Opens Plaid Link modal
- Handles token exchange
- Error handling and loading states

### BankingWidget Component

Located: `components/dashboard/BankingWidget.tsx`

**Purpose:** Dashboard widget showing connected accounts with sync functionality.

**Props:**
```typescript
interface BankingWidgetProps {
  userId: string;
}
```

**Features:**
- Lists all connected accounts
- Shows balances and last sync time
- Sync transactions button
- Connect new accounts
- Visual status indicators

---

## Security

### Token Storage

**Access Tokens:**
- Stored encrypted in `BankConnection.accessToken`
- Encrypted using `encryptToken()` function
- Never exposed to frontend
- Decrypted only for API calls

⚠️ **Production Warning:**
```typescript
// lib/banking/index.ts currently uses base64 (NOT SECURE)
// Replace with proper encryption before production:
// - AWS KMS
// - Google Cloud KMS
// - @aws-crypto/client-node
```

### Authentication Flow

1. **Link Token** - Short-lived token for frontend (expires in 30 minutes)
2. **Public Token** - One-time use token from Link (must be exchanged immediately)
3. **Access Token** - Long-lived token for API calls (never expires in Plaid)

### Best Practices

✅ **DO:**
- Use HTTPS in production
- Encrypt tokens before database storage
- Validate user ownership of accounts
- Log all banking API calls
- Handle token errors gracefully

❌ **DON'T:**
- Expose access tokens to frontend
- Store tokens in plain text
- Share tokens between users
- Skip error handling

---

## Pricing

### Plaid Pricing (as of 2025)

**Development:**
- Sandbox: **FREE** (unlimited)
- 100 live accounts: **FREE**

**Production (Pay-as-you-go):**

| Product | Type | Cost |
|---------|------|------|
| Transactions | Per connected account | $0.10 - $0.35/month |
| Auth | One-time | $0.10 - $0.20 |
| Balance | Per connected account | $0.05 - $0.15/month |
| Identity | One-time | $0.10 - $0.25 |

**Volume Discounts:**
- 1K-10K accounts: ~20% discount
- 10K-100K accounts: ~40% discount
- 100K+ accounts: Custom pricing

**Free Tier:**
- First 100 connected accounts/month: FREE
- Perfect for MVP and early-stage startups

### Cost Estimate for MVP

**Scenario:** 500 active users, 1.5 accounts each = 750 connected accounts

```
Monthly cost:
- Transactions: 750 × $0.25 = $187.50
- Auth (one-time amortized): 750 × $0.15 / 12 = $9.38
- Balance: 750 × $0.10 = $75.00
─────────────────────────────────────
Total: ~$272/month
Per user: $0.54/month
```

### TrueLayer Pricing (UK/EU Alternative)

- Free for development
- Production: Contact for pricing
- Generally cheaper than Plaid for UK market

---

## Testing

### Sandbox Mode

Plaid provides a sandbox environment with test credentials.

**Test Bank Credentials:**

```
Bank: First Platypus Bank (OAuth)
Username: user_good
Password: pass_good

Bank: Platypus Bank
Username: user_good
Password: pass_good (any PIN)
```

**Test Accounts:**
- Checking accounts with ~$100-$10,000 balances
- Savings accounts
- Credit cards
- Transactions from last 2 years

### Testing Flow

1. Set `PLAID_ENVIRONMENT="sandbox"` in `.env.local`
2. Click "Connect Bank Account"
3. Select "First Platypus Bank"
4. Enter test credentials
5. Verify accounts appear in dashboard
6. Click "Sync" to test transaction sync

### Manual Testing Checklist

- [ ] Connect account successfully
- [ ] View connected accounts
- [ ] Sync transactions
- [ ] Check balances update
- [ ] Disconnect account
- [ ] Handle connection errors
- [ ] Test with multiple accounts
- [ ] Verify encrypted token storage

---

## Troubleshooting

### Issue: "Failed to fetch link token"

**Cause:** Missing or invalid Plaid credentials

**Solution:**
1. Check `.env.local` has correct values
2. Verify `PLAID_CLIENT_ID` and `PLAID_SECRET`
3. Ensure `PLAID_ENVIRONMENT` matches your credentials (sandbox vs production)

### Issue: "Failed to exchange token"

**Cause:** Public token already used or expired

**Solution:**
- Public tokens are one-time use
- Generate a new link token and try again
- Check for duplicate submission

### Issue: "No accounts found"

**Cause:** User selected institutions without accounts or API error

**Solution:**
1. Use test credentials in sandbox
2. Check Plaid dashboard for institution status
3. Verify API response in backend logs

### Issue: "Transactions not syncing"

**Cause:** Access token issue or date range problem

**Solution:**
1. Check `lastSynced` timestamp
2. Verify access token is not revoked
3. Check date range parameters
4. Test with smaller date range (7 days)

### Issue: "Encrypted token error in production"

**Cause:** Using base64 encryption (development only)

**Solution:**
Implement proper encryption:
```typescript
// Replace in lib/banking/index.ts
import { KMS } from '@aws-sdk/client-kms';

export async function encryptToken(token: string): Promise<string> {
  const kms = new KMS({ region: 'us-east-1' });
  const result = await kms.encrypt({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(token),
  });
  return result.CiphertextBlob.toString('base64');
}
```

### Debug Mode

Enable detailed logging:
```typescript
// In lib/banking/providers/plaid.ts
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('[Plaid] Request:', request);
  console.log('[Plaid] Response:', response);
}
```

---

## Next Steps

1. **AI Integration** - Use transaction data for personalized advice
2. **Spending Analysis** - Categorize and analyze spending patterns
3. **Budget Tracking** - Automatic budget vs actual comparisons
4. **Savings Recommendations** - AI-powered suggestions based on spending
5. **Bill Detection** - Identify recurring charges
6. **Subscription Management** - Track and optimize subscriptions

---

## Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid API Reference](https://plaid.com/docs/api/)
- [React Plaid Link](https://github.com/plaid/react-plaid-link)
- [Plaid Dashboard](https://dashboard.plaid.com/)
- [Plaid Support](https://support.plaid.com/)

---

## Support

For issues or questions:
1. Check this documentation
2. Review [Plaid Docs](https://plaid.com/docs/)
3. Check application logs
4. Contact development team
