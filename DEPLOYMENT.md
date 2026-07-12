# VATTAMS Home Services - Deployment Guide

## Production URL
https://vattams.net

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (already provisioned)

## Environment Variables
The following are pre-configured in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

## Build Instructions

```bash
npm install
npm run build
```

The production build outputs to `dist/`.

## Database
The Supabase database has all 50 tables with RLS policies. No migrations are needed - all migrations are already applied.

## Project Structure
```
src/
  components/     # Shared UI components, layouts
  hooks/          # Custom hooks (use-toast)
  lib/            # Core libraries (supabase, auth, utils, etc.)
  pages/
    public/       # 9 public pages
    auth/         # 3 auth pages
    customer/     # 10 customer pages
    technician/   # 8 technician pages
    admin/        # 23 admin pages
public/           # Static assets (manifest, robots, sitemap, logo)
```

## Roles
- **customer**: Book services, track, pay, review, refer
- **technician**: Accept jobs, update status, wallet, earnings
- **admin**: Full management access to all 23 admin modules

## Verification Workflow
1. Technician registers → `pending_registration`
2. Pays ₹50 fee → `fee_pending`
3. Admin reviews → `under_review`
4. Admin approves → `approved` (can accept jobs)
5. After 4 completed jobs → refund eligible
