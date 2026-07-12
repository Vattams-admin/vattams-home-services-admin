# VATTAMS Home Services - Deployment Guide

## Prerequisites
- Node.js 18+ and npm
- A Supabase project (https://supabase.com)
- Git

## 1. Local Development
```bash
npm install
npm run dev
```
App runs on http://localhost:5173

## 2. Environment Variables
Create `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Supabase Setup
### Database Tables
- `profiles` - User accounts with verification_status
- `bookings` - Service bookings
- `booking_photos` - Before/after photos
- `notifications` - In-app notifications
- `invoices` - Payment invoices
- `reviews` - Customer reviews
- `payments` - Payment records
- `service_areas` - Serviceable districts/cities
- `settings` - Company settings (id=1)
- `coupons` - Discount codes
- `audit_logs` - Admin action logs
- `technician_wallets` - Wallet with verification fee & refund tracking
- `technician_documents` - Aadhaar, certificates, photos
- `verification_payments` - ₹50 verification fee records
- `refunds` - Refund records for verification fee
- `revenue_transactions` - Platform revenue tracking
- `technician_working_areas` - Technician service areas
- `technician_locations` - Live tracking data
- `blog_posts` - Blog content
- `service_categories` - Service categories

### RLS Policies
RLS enabled on all tables with 4 CRUD policies each, scoped to authenticated users with auth.uid() ownership checks. Admin users get cross-user read access.

## 4. Technician Verification Workflow
1. Technician registers → status=pending_registration
2. Submits documents → status stays pending_registration
3. Pays ₹50 verification fee → status=fee_pending
4. Admin reviews → status=under_review
5. Admin approves → status=approved (dashboard access granted)
6. After 4 completed jobs → refund eligible
7. Admin processes refund → wallet credit or UPI refund

## 5. Production Build
```bash
npm run build
```
Output in `dist/` with lazy-loaded routes and code splitting.

## 6. Deployment
### Vercel
1. Import repo in Vercel
2. Framework: Vite, Build: `npm run build`, Output: `dist`
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy

## 7. GitHub Setup
```bash
git init
git add .
git commit -m "Phase 5: Technician verification & revenue system"
git remote add origin https://github.com/Vattams-admin/vattams-home-services-admin.git
git push -u origin main
```
