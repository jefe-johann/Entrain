# Credits & Payments Implementation

## Current State
- Users have `credits` column (default: 1)
- Each generation costs 1 credit
- No way to add credits

## Dev Testing Bypass
Set `DEV_UNLIMITED_CREDITS=true` in `backend/.env` to skip credit checks.

---

## Payment Implementation Plan

### Your Setup (Stripe)
1. Create Stripe account at stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Create a Product + Price in Stripe Dashboard (e.g., "10 Credits - $5")
4. Add to `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID=price_...
   ```
5. Set up webhook endpoint in Stripe Dashboard pointing to `/api/webhooks/stripe`

### Dev Work
1. **Backend**
   - `pip install stripe`
   - Add `/api/payments/create-checkout` - creates Stripe Checkout session
   - Add `/api/webhooks/stripe` - receives payment confirmations, adds credits
   - Add `payments` table to track transactions

2. **Frontend**
   - "Buy Credits" button on dashboard
   - Redirects to Stripe Checkout
   - Success/cancel return URLs

### Stripe Flow
```
User clicks "Buy" → Backend creates Checkout Session → Redirect to Stripe
→ User pays → Stripe webhook → Backend adds credits → User returns to app
```

### Estimated Effort
- Backend: ~2 hours
- Frontend: ~1 hour
- Stripe setup: ~30 min
