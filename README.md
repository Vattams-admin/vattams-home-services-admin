# VATTAMS Home Services

Professional home services platform for Tamil Nadu. AC repair, deep cleaning, plumbing, electrical, and more — connecting customers with verified technicians.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Icons:** lucide-react
- **PDF:** jsPDF + jsPDF-AutoTable

## Getting Started

```bash
npm install
cp .env.example .env   # Fill in your Supabase credentials
npm run dev
```

## Build

```bash
npm run build    # Type-check + production build
npm run lint     # TypeScript type-check only
npm run preview  # Preview production build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

See `.env.example` for a template.

## Project Structure

```
src/
├── components/          # Reusable UI + layout components
│   ├── ui/              # Button, Input, Card, Badge, Modal, Label
│   ├── PublicLayout.tsx
│   ├── DashboardLayout.tsx
│   ├── ProtectedRoute.tsx
│   └── Logo.tsx
├── pages/
│   ├── public/          # Home, Services, Pricing, About, Contact, Cities, FAQ, Blog
│   ├── auth/            # Login, Register, ForgotPassword
│   ├── customer/        # Dashboard, Bookings, Booking, Tracking, Payments, Profile, Review, Notifications
│   ├── technician/      # Dashboard, Jobs, Areas, Earnings, Profile, Notifications
│   └── admin/           # Dashboard, Bookings, Customers, Technicians, ServiceAreas, Payments, Reports, Settings, Notifications
├── lib/
│   ├── supabase.ts      # Client + TypeScript types
│   ├── auth.tsx         # AuthProvider context
│   ├── constants.ts     # Phone numbers, service areas
│   ├── utils.ts         # Formatters, status maps
│   ├── notifications.ts # Notification helper
│   └── i18n.tsx         # EN/TA language provider
├── hooks/
│   └── use-toast.tsx
├── App.tsx              # Router + lazy-loaded routes
├── main.tsx
└── index.css
```

## Key Features

### Technician Approval System
- New technicians register with `status = pending`
- Admin reviews and approves/rejects (with reason)
- Pending technicians see a verification waiting screen
- Only approved technicians can access the technician dashboard

### Customer Booking Flow
1. Customer books a service
2. Admin receives notification, assigns a technician
3. Technician accepts and updates status: On The Way → Work Started → Completed
4. Customer tracks live status and downloads invoice
5. Customer rates and reviews the service

### Role-Based Access Control
- **Customer** routes under `/customer/*`
- **Technician** routes under `/technician/*`
- **Admin** routes under `/admin/*`
- Pending/rejected/suspended technicians are blocked from the technician dashboard

### Notifications
- Customer notified on booking creation
- Admin notified of new bookings
- Technician notified on assignment
- Customer notified when technician starts and completes work

### WhatsApp Integration
- Booking confirmation message
- Technician assignment message
- Admin support button

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vattams.net | admin123 |
| Customer | customer@vattams.net | customer123 |
| Technician (active) | tech@vattams.net | tech123 |
| Technician (pending) | techpending@vattams.net | tech123 |

## Database

Supabase migrations are in `supabase/migrations/`. The database includes:
- `profiles` — users with role (customer/technician/admin/super_admin) and status (active/pending/rejected/suspended)
- `bookings` — service bookings with status flow
- `booking_photos` — before/after photos
- `invoices` — generated invoices
- `notifications` — user notifications
- `reviews` — customer ratings
- `payments` — payment records
- `service_categories` — service types with pricing
- `service_areas` — pincodes served
- `technician_working_areas` — technician service areas
- `settings` — company configuration

All tables have Row Level Security (RLS) enabled with role-based policies.

## License

(c) VATTAMS Home Services. All rights reserved.
