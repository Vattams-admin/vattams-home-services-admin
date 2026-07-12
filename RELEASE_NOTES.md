# VATTAMS Home Services - Release v1.0

## Release Date: July 12, 2026

## Overview
VATTAMS Home Services is a comprehensive home service management platform for Tamil Nadu, India. It connects customers with verified technicians for various home services including AC repair, plumbing, electrical work, cleaning, pest control, painting, carpentry, and appliance repair.

## Features

### Customer Portal
- Book services with multi-step booking wizard
- Real-time booking tracking with status timeline
- Payment management with invoice PDF download (UPI QR code)
- Service reviews and ratings
- Referral program with rewards
- AI assistant for support
- Notification center
- Profile management

### Technician Portal
- Job management with status updates (accepted → on_the_way → arrived → work_started → completed)
- Wallet with verification fee tracking (₹50, refundable after 4 completed jobs)
- Earnings dashboard with monthly breakdown
- Service area management
- Profile with skills, experience, and bio
- Referral program
- Notifications

### Admin Portal (23 modules)
- Dashboard with KPIs and recent activity
- Technician verification workflow (pending_registration → fee_pending → under_review → approved/rejected/suspended)
- Booking management with technician assignment
- CRM (customer notes, follow-ups, complaints, service reminders)
- Customer and technician management
- Service area CRUD
- Payment and invoice management
- Revenue tracking with trends
- Report generation (PDF/CSV export)
- Business settings (company info, UPI, GST, social links, analytics IDs)
- Notification broadcasting
- Coupon management (percentage/fixed discounts)
- Audit logs
- Referral program management
- Marketing campaigns, banners, popup announcements
- AI assistant with insights
- Google Business Profile management
- Analytics dashboard (GA4, Meta Pixel events)
- Email marketing campaigns and templates
- Blog CMS with categories and tags
- Customer review management (approve/reject/feature)
- Marketing dashboard with channel performance

### Public Pages
- Home page with hero, services, testimonials, stats
- Services catalog with pricing
- Pricing page
- About page with company story
- Contact page with form
- Cities served (all Tamil Nadu districts)
- FAQ accordion
- Blog listing
- Customer reviews

### Technical Features
- PWA with manifest.json (installable)
- SEO: sitemap.xml, robots.txt, meta tags, Open Graph
- i18n support (English/Tamil)
- Lazy loading with React.lazy() for all pages
- Code splitting via dynamic imports
- Toast notification system
- Analytics event tracking
- PDF generation (jsPDF, jspdf-autotable, QRCode for UPI)
- Responsive design (mobile to desktop)
- Role-based route protection
- RLS policies on all 50 database tables

## Tech Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS v4
- Supabase (database, auth, RLS)
- jsPDF, jspdf-autotable, qrcode
- lucide-react icons
- clsx, tailwind-merge

## Contact
- Customer Support: 8189800757
- Technician Support: 8189800767
- Website: https://vattams.net
- Email: info@vattams.net
