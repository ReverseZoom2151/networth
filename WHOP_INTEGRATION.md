# Whop Integration Guide

## Overview

Your Networth finance coach app now has **full $10/month subscription gating** powered by Whop. This integration runs in **Company Mode** since you're selling your own product directly to users.

---

## What Was Implemented

### 1. **Whop SDK Integration** ✅
- Installed `@whop/sdk` for proper API access
- Created server-side client in [lib/whop.ts](lib/whop.ts)
- Membership checking with `company_id` filtering

### 2. **Membership Access Checking** ✅
- API endpoint: `/api/check-access` - checks if user has active subscription
- Auto-checks on app load
- Development mode allows access without Whop API key

### 3. **Subscription Gating** ✅
- AI Chat Coach is **gated behind paywall**
- Shows "Subscribe for $10/month" locked feature component
- Non-paying users see subscribe banner on dashboard

### 4. **Pricing & Subscribe Page** ✅
- Beautiful pricing page at `/subscribe`
- Shows all features with checkmarks
- $10/month pricing prominently displayed
- Redirects to Whop checkout when user clicks "Subscribe Now"

### 5. **Provider Context** ✅
- `useWhop()` hook now provides:
  - `hasAccess` - boolean for subscription status
  - `checkingAccess` - loading state
  - Automatic membership verification

---

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Whop Configuration
WHOP_API_KEY=your_api_key_here                          # Server-side only (REQUIRED)
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_xxxxxxxxxxxxx          # Your company ID (REQUIRED)
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_xxxxxxxxxxxxx      # Optional: for testing

# Claude AI (already set up)
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Where to Find These:

1. **WHOP_API_KEY**:
   - Go to https://dev.whop.com/apps
   - Click your app
   - Copy from "Environment variables" section

2. **NEXT_PUBLIC_WHOP_COMPANY_ID**:
   - Your company/business ID on Whop
   - Format: `biz_xxxxxxxxxxxxx`
   - Found in your Whop dashboard URL or developer settings

---

## How It Works

### User Journey

1. **User visits app** → Provider checks if they have active subscription via `/api/check-access`
2. **No subscription** → See subscribe banner + locked AI coach
3. **Clicks "Subscribe Now"** → Redirected to Whop checkout page
4. **Completes payment on Whop** → Membership created in Whop system
5. **Returns to app** → Access check passes, AI coach unlocked

### Technical Flow

```
User loads app
    ↓
WhopProvider checks: fetch('/api/check-access', { userId })
    ↓
API calls: checkUserHasAccess(userId)
    ↓
Whop SDK: client.memberships.list({ company_id })
    ↓
Filter: memberships where user.id === userId && valid === true
    ↓
Return: hasAccess = true/false
    ↓
Dashboard shows: AI Coach (unlocked) OR Locked Feature (subscribe prompt)
```

---

## Files Changed/Created

### New Files
- [lib/whop.ts](lib/whop.ts) - Whop SDK client & membership checking
- [app/api/check-access/route.ts](app/api/check-access/route.ts) - API endpoint for access verification
- [components/SubscriptionGate.tsx](components/SubscriptionGate.tsx) - Paywall UI components
- [app/subscribe/page.tsx](app/subscribe/page.tsx) - Pricing/subscription page
- **This file** - Documentation

### Modified Files
- [app/providers.tsx](app/providers.tsx) - Added `hasAccess` and `checkingAccess` to context
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Gated AI coach, added subscribe banner

---

## Development Mode

**Without Whop API Key:**
- Access is **automatically granted** for development
- Allows you to test features without setting up Whop
- Console warnings will appear

**With Whop API Key:**
- Real membership checking
- Must have valid subscription in Whop to access gated features

---

## Testing Checklist

### Before Going Live:

- [ ] Set `WHOP_API_KEY` in production environment
- [ ] Set `NEXT_PUBLIC_WHOP_COMPANY_ID` in production
- [ ] Create a test subscription in Whop dashboard
- [ ] Verify checkout URL works: `https://whop.com/checkout/{company_id}`
- [ ] Test full flow: visit app → see paywall → subscribe → unlock features
- [ ] Verify AI coach only works with active subscription

### Test Scenarios:

1. **No subscription**: Should see locked AI coach + subscribe banner
2. **Active subscription**: Should see unlocked AI coach
3. **Expired subscription**: Should be locked again
4. **Cancel subscription**: Should lose access

---

## Checkout URL Format

Your users will be redirected to:
```
https://whop.com/checkout/{NEXT_PUBLIC_WHOP_COMPANY_ID}
```

On this page, they can:
- See your product pricing ($10/month)
- Enter payment details
- Complete subscription
- Get redirected back to your app

---

## Customization Options

### Change What's Gated

Currently only **AI Chat Coach** is gated. To gate more features:

```typescript
// Example: Gate progress updates
{!hasAccess ? (
  <LockedFeature featureName="Progress Tracking" />
) : (
  <button onClick={openUpdateModal}>Update Progress</button>
)}
```

### Change Pricing Display

Edit [app/subscribe/page.tsx](app/subscribe/page.tsx):
- Change $10 amount
- Add/remove feature checkmarks
- Modify copy and messaging

### Add Free Trial

In [lib/whop.ts](lib/whop.ts), add trial logic:
```typescript
const isInTrial = checkIfUserInTrial(userId);
return hasMembership || isInTrial;
```

---

## Whop API Methods Available

```typescript
// Check if user has access
const hasAccess = await checkUserHasAccess(userId);

// Get user's memberships
const memberships = await getUserMemberships(userId);

// Get checkout URL
const url = getCheckoutUrl(); // Returns: https://whop.com/checkout/{company_id}
```

---

## Troubleshooting

### Users can access AI coach without subscription
- Check `WHOP_API_KEY` is set in production
- Verify `NEXT_PUBLIC_WHOP_COMPANY_ID` is correct
- Check console for errors in API logs

### Checkout redirect not working
- Verify `NEXT_PUBLIC_WHOP_COMPANY_ID` is set
- Check URL format in browser network tab
- Ensure company ID is correct

### "Checking access..." stuck loading
- API endpoint might be failing
- Check `/api/check-access` logs
- Verify Whop API key has correct permissions

### Development mode always grants access
- This is intentional when `WHOP_API_KEY` is not set
- Add API key to test real gating

---

## Next Steps

1. **Set up your Whop product**:
   - Create your $10/month subscription product in Whop dashboard
   - Configure pricing and billing
   - Set up webhook for membership events (optional)

2. **Deploy**:
   - Add environment variables to Vercel/hosting platform
   - Deploy and test end-to-end
   - Share checkout link with first users

3. **Monitor**:
   - Track subscription sign-ups in Whop dashboard
   - Monitor API errors in logs
   - Watch for failed membership checks

---

## Support

If you need help:
- Whop API Docs: https://dev.whop.com
- Whop SDK Docs: https://github.com/whopio/whop-sdk
- Check console logs for error messages
- Verify environment variables are set correctly

---

## Summary

✅ **Implemented**: Full $10/month subscription gating
✅ **Gated**: AI Chat Coach behind paywall
✅ **Pages**: Subscribe page with Whop checkout redirect
✅ **API**: Membership verification endpoint
✅ **UX**: Locked feature components + subscribe CTAs
✅ **Build**: Successful with no TypeScript errors

Your app is **ready for subscriptions**! Just add your Whop API credentials and deploy.
