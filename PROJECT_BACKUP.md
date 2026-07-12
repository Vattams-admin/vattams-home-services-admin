# VATTAMS Home Services - Project Backup

## Version: 1.0.0
## Date: July 12, 2026

## Summary
Full-stack home service management platform for Tamil Nadu, India.

## Architecture
- Frontend: React 18 + TypeScript + Vite 5 + Tailwind CSS v4
- Backend: Supabase (PostgreSQL, Auth, RLS)
- 50 database tables with owner-scoped RLS policies
- 53 lazy-loaded page components
- PWA-ready with manifest.json

## Key Files
- `src/lib/supabase.ts` - Supabase client + all TypeScript types (50+ types)
- `src/lib/auth.tsx` - Auth context with signIn/signUp/signOut
- `src/lib/constants.ts` - Phone numbers, districts, service categories
- `src/lib/utils.ts` - cn(), formatDate(), formatCurrency(), status colors
- `src/lib/notifications.ts` - createNotification, createAuditLog, trackEvent
- `src/lib/pdf.ts` - Invoice PDF with UPI QR, report PDF, CSV export
- `src/lib/i18n.tsx` - English/Tamil translations
- `src/App.tsx` - Full routing with lazy loading and ProtectedRoute
- `src/components/DashboardLayout.tsx` - Sidebar with 23 admin / 8 technician / 8 customer nav items

## Contact
- Customer: 8189800757
- Technician: 8189800767
- Website: https://vattams.net
