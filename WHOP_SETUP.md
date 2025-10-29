# Whop Authentication Setup Guide

This guide explains how to set up Whop authentication and subscription management for the Networth finance coach app.

## Overview

The app uses **Whop** for:
- ✅ User authentication (no separate auth system needed)
- ✅ Subscription management ($10/month pricing)
- ✅ Cross-device data synchronization (via Whop metadata API)
- ✅ Payment processing (handled by Whop)

## Architecture

### In Whop Mode (Production)
```
User → Whop iframe → Your App → Whop SDK → Real user ID
                                        ↓
                                  User metadata API
                                  (syncs across devices)
```

### Standalone Mode (Development)
```
User → Your App → localStorage → 'standalone-user'
                  (single device only)
```

## Setup Instructions

### 1. Create a Whop Account

1. Go to [https://dash.whop.com](https://dash.whop.com)
2. Sign up for a Whop developer account
3. Create a new Company (this represents your product)

### 2. Get Your Credentials

#### Company ID
1. In Whop Dashboard, go to your Company settings
2. Copy your **Company ID** (looks like: `comp_xxxxx`)
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_WHOP_COMPANY_ID=comp_xxxxx
   ```

#### API Key
1. In Whop Dashboard, go to **Developers** → **API Keys**
2. Create a new API key
3. Copy the **Secret Key** (starts with `whop_`)
4. Add to `.env.local`:
   ```bash
   WHOP_API_KEY=whop_xxxxx
   ```

⚠️ **IMPORTANT**: Never commit your API key to Git! It's in `.gitignore` by default.

### 3. Create Your Product

1. In Whop Dashboard, go to **Products**
2. Create a new product:
   - **Name**: "Networth Premium"
   - **Price**: $10/month (recurring)
   - **Type**: Subscription
   - **Features**: List your premium features (AI Coach, etc.)

3. Copy the Product ID for your subscribe page

### 4. Configure Environment Variables

Create `.env.local` in the project root (copy from `.env.example`):

```bash
# Whop Configuration
WHOP_API_KEY=whop_your_secret_key_here
NEXT_PUBLIC_WHOP_COMPANY_ID=comp_your_company_id_here

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

### 5. Update Subscribe Page

Edit `app/subscribe/page.tsx` and replace the checkout URL with your product URL:

```typescript
// Replace this line:
window.location.href = getCheckoutUrl();

// With your actual product checkout URL:
window.location.href = 'https://whop.com/checkout/plan_xxxxx';
```

## How It Works

### Authentication Flow

1. **User visits your app on Whop**
   - App detects it's running in Whop iframe
   - Initializes Whop SDK: `new WhopApp()`
   - Gets authenticated user: `whopApp.getUser()`

2. **User data is retrieved**
   - Real user ID: `user.id` (e.g., `user_abc123`)
   - Email: `user.email`
   - Subscription status: checked via `/api/check-access`

3. **Data persistence**
   - User goal → Whop metadata API
   - Onboarding status → Whop metadata API
   - Syncs automatically across all devices

### Subscription Check Flow

```typescript
// Client requests access check
fetch('/api/check-access', {
  body: { userId: 'user_abc123' }
})
↓
// Server checks Whop API
checkUserHasAccess(userId)
↓
// Whop returns memberships
client.memberships.list({ company_id: 'comp_xxx' })
↓
// Filter to user's active memberships
userMemberships.filter(m => m.user.id === userId && m.valid === true)
↓
// Return hasAccess: true/false
```

### Data Storage Flow

**Setting data (e.g., saving goal):**
```typescript
UserStorage.setGoal(userId, goal)
↓
POST /api/whop/metadata
↓
Whop API: users.updateUser(userId, { metadata: { goal: {...} } })
↓
Saved to Whop (syncs across devices)
```

**Getting data:**
```typescript
UserStorage.getGoal(userId)
↓
POST /api/whop/metadata (with key only)
↓
Whop API: users.retrieveUser(userId)
↓
Returns user.metadata.goal
```

## Testing

### Development Mode (Without Whop)

1. Run the app: `npm run dev`
2. Open in browser (not iframe)
3. Uses `standalone-user` ID
4. Data stored in localStorage only
5. Access granted automatically (see `lib/whop.ts:61`)

### Testing in Whop Iframe

1. Deploy your app to a public URL (Vercel, etc.)
2. In Whop Dashboard, add your app URL as an iframe product
3. Test the flow:
   - User subscribes → gets access
   - User unsubscribes → loses access
   - Data persists across devices

## Troubleshooting

### "No user authenticated in Whop"
- Check that you're running inside Whop iframe
- Verify Whop SDK is installed: `npm list @whop-apps/sdk`
- Check browser console for SDK errors

### "WHOP_API_KEY not set"
- Make sure `.env.local` exists in project root
- Restart dev server after adding env vars
- Verify the API key is correct in Whop Dashboard

### "Failed to check access"
- Check that `NEXT_PUBLIC_WHOP_COMPANY_ID` is set
- Verify API key has correct permissions
- Check Whop API status: https://status.whop.com

### Data not syncing across devices
- Verify you're in Whop mode (iframe)
- Check network tab for `/api/whop/metadata` calls
- Ensure API key has write permissions

## API Reference

### Client-Side Hooks

```typescript
import { useWhop, UserStorage } from '@/app/providers';

// Get user and access info
const { userId, userEmail, hasAccess, loading } = useWhop();

// Save user data (syncs to Whop)
await UserStorage.setGoal(userId, goalData);

// Load user data (from Whop)
const goal = await UserStorage.getGoal(userId);
```

### Server-Side Functions

```typescript
import { checkUserHasAccess, getUserMemberships } from '@/lib/whop';

// Check if user has active subscription
const hasAccess = await checkUserHasAccess(userId);

// Get all user's memberships
const memberships = await getUserMemberships(userId);
```

## Security Notes

1. **API Keys**
   - Never commit `WHOP_API_KEY` to Git
   - Use environment variables only
   - Rotate keys if exposed

2. **User Verification**
   - User IDs come from Whop SDK (can't be spoofed)
   - Subscription checks happen server-side
   - Metadata API requires valid API key

3. **Data Access**
   - Users can only access their own data
   - API key has full access (keep secret)
   - Use server-side routes for sensitive operations

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables:
   - `WHOP_API_KEY`
   - `NEXT_PUBLIC_WHOP_COMPANY_ID`
   - `ANTHROPIC_API_KEY`
4. Deploy
5. Add deployed URL to Whop Dashboard

### Other Platforms

Same process - just add environment variables in your platform's settings.

## Support

- **Whop Docs**: https://docs.whop.com
- **Whop Discord**: https://discord.gg/whop
- **Anthropic Docs**: https://docs.anthropic.com

## Next Steps

1. ✅ Set up Whop account
2. ✅ Get API credentials
3. ✅ Create product ($10/month)
4. ✅ Add env variables
5. ✅ Test locally
6. ⬜ Deploy to production
7. ⬜ Add app to Whop as iframe product
8. ⬜ Test subscription flow
9. ⬜ Launch! 🚀
