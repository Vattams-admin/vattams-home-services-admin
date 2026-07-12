# VATTAMS Home Services - Project Documentation

## Overview
VATTAMS Home Services v3.0 is a comprehensive home service management and digital marketing platform serving Tamil Nadu, India. It connects customers with verified technicians for AC service, washing machine repair, plumbing, electrical work, and more, while providing full digital marketing tools for business growth.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **PDF Generation**: jsPDF, jspdf-autotable, QRCode
- **Icons**: lucide-react
- **Routing**: react-router-dom v6

## Architecture

### Directory Structure
```
src/
├── components/          # Shared UI components
│   ├── ui/             # Reusable UI primitives (button, input, card, etc.)
│   ├── DashboardLayout.tsx
│   ├── PublicLayout.tsx
│   ├── ProtectedRoute.tsx
│   ├── LoadingScreen.tsx
│   └── Logo.tsx
├── hooks/
│   └── use-toast.tsx   # Toast notification system
├── lib/
│   ├── supabase.ts     # Supabase client + all TypeScript types
│   ├── auth.tsx        # Auth context provider
│   ├── constants.ts    # App constants (phone, districts, services, social platforms)
│   ├── utils.ts        # Utility functions and constants
│   ├── notifications.ts # Notification, audit log, revenue, analytics event helpers
│   ├── pdf.ts          # Invoice and report PDF generation
│   └── i18n.tsx        # Internationalization (EN/TA)
├── pages/
│   ├── public/         # Public-facing pages (home, services, blog, reviews, etc.)
│   ├── auth/           # Authentication pages (login, register)
│   ├── customer/       # Customer dashboard pages
│   ├── technician/     # Technician dashboard pages
│   └── admin/          # Admin panel pages
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point

public/                  # Static assets (manifest, robots, sitemap, logo)
supabase/functions/      # Edge functions
```

### Database Schema (42 tables)

#### Core Tables
- `profiles`, `bookings`, `invoices`, `reviews`, `notifications`, `service_areas`, `settings`, `coupons`, `audit_logs`

#### Technician Tables
- `technician_wallets`, `technician_documents`, `technician_working_areas`, `verification_payments`, `refunds`

#### CRM Tables
- `customer_notes`, `customer_followups`, `customer_complaints`, `service_reminders`, `customer_anniversaries`, `amc_renewals`

#### Referral Tables
- `referral_codes`, `referrals`

#### Marketing Tables
- `homepage_banners`, `popup_announcements`, `marketing_campaigns`, `whatsapp_templates`, `social_media_links`, `campaign_metrics`

#### Digital Marketing Tables (v3.0)
- `google_business_profile`, `analytics_events`, `analytics_settings`, `email_campaigns`, `email_templates`, `customer_reviews`, `blog_categories`, `blog_tags`, `blog_post_categories`, `blog_post_tags`

#### Business Settings Tables
- `service_pricing`, `holiday_calendar`, `revenue_transactions`

#### AI Tables
- `ai_conversations`, `ai_insights`

#### Blog
- `blog_posts` (enhanced with SEO fields, categories, tags, featured images, views)

### Authentication
- Supabase email/password authentication
- Three roles: customer, technician, admin (super_admin maps to admin)
- Protected routes with role-based access control
- Technician verification workflow (pending -> fee_pending -> under_review -> approved)

### RLS Policies
All tables have Row Level Security enabled:
- Customer data: owner-scoped (auth.uid() = customer_id)
- Admin data: admin role check
- Public data (banners, popups, settings, pricing, reviews, blog): anon + authenticated read access
- Analytics events: public INSERT, admin SELECT

### Key Features

#### Customer App
- Book services, track bookings, view invoices, leave reviews
- Referral system with unique codes
- AI assistant for booking help and recommendations
- Google Maps integration, Google Review button

#### Technician App
- Job management with status flow
- Wallet with verification fee and refund tracking
- Working area management, earnings tracking
- Referral system

#### Admin Panel (23 modules)
- Dashboard with stats and pending approvals
- Technician verification workflow
- CRM module with customer timeline
- Coupon management with 6 offer types
- Referral analytics
- Marketing module (banners, popups, campaigns, WhatsApp templates, social links)
- Marketing Dashboard (visitors, bookings, revenue, campaigns)
- Google Business Profile management
- Analytics & Pixel settings (GA4, Meta Pixel, GSC)
- Email marketing (campaigns, templates)
- Blog CMS (posts, categories, tags, SEO)
- Customer reviews management
- AI assistant with data-driven insights
- Business settings (company, contact, social, Google, holidays, pricing, theme, language)
- Revenue and reports with PDF/CSV export

### Performance
- Lazy loading with React.lazy() for all page components
- Code splitting via dynamic imports
- PWA manifest for installable app
- SEO: sitemap.xml, robots.txt, meta tags, Open Graph, Twitter Cards

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Build Commands
- `npm run dev` - Development server
- `npm run build` - Production build (tsc + vite)
- `npm run lint` - TypeScript type check
- `npm run preview` - Preview production build
