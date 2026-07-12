# VATTAMS Home Services - Release Notes

## Version 3.0.0 - Digital Marketing & Business Growth (July 2026)

### New Modules

#### 1. Google Business Profile Management
- Admin can manage: business name, description, address, service areas, working hours, contact numbers, WhatsApp, email, website, Google Maps link, Google Business Profile link, Google Review link
- Customer can: view on Google Maps, get directions, leave Google Review

#### 2. Google Analytics (GA4) Integration
- Complete GA4 settings page with measurement ID and API secret
- Track: visitors, sessions, bookings, revenue, WhatsApp clicks, call clicks, service views, conversion rate
- Analytics events stored in database for reporting

#### 3. Google Search Console
- sitemap.xml and robots.txt (pre-existing, enhanced)
- Canonical URLs, meta tags, Open Graph, Twitter Cards in blog posts
- Google site verification token configuration

#### 4. Facebook / Meta Pixel
- Meta Pixel settings page with pixel ID and access token
- Track: Lead, Booking, WhatsApp Click, Call Click, Contact Form, Page Views

#### 5. Social Media Management
- Admin can manage links for: Facebook, Instagram, YouTube, WhatsApp Business, LinkedIn, X (Twitter), Telegram
- Social icons displayed in header and footer

#### 6. CRM (Enhanced)
- Customer history, complaint history, service history
- Follow-up management, service reminders, AMC reminders
- Customer notes, customer timeline
- Customer Lifetime Value and Satisfaction Score

#### 7. Coupons & Offers (Enhanced)
- Festival offers, percentage discount, flat discount, referral offers, seasonal offers
- Coupon reports with CSV export
- District-wise and service-wise targeting

#### 8. Referral Program
- Customer and technician referral systems
- Unique referral codes, referral rewards
- Referral analytics with top referrers leaderboard

#### 9. Marketing Dashboard
- Website visitors, bookings, revenue, WhatsApp clicks, call clicks
- Most viewed services, top districts
- Campaign performance metrics

#### 10. Promotions (Enhanced)
- Banner manager, popup offers, announcement bar
- Homepage promotions, festival campaigns

#### 11. Email Marketing
- Newsletter, booking reminder, service reminder, promotional emails
- Email campaign management with open/click tracking
- Reusable email templates

#### 12. WhatsApp Business
- Booking confirmation, technician assigned, service reminder templates
- Customer support, offer broadcast, complaint updates
- Primary WhatsApp: +91 8189800757
- Technician Support: +91 8189800767

#### 13. Blog CMS
- SEO-friendly blog posts with meta tags
- Categories and tags management
- Featured images, related posts
- Views tracking

#### 14. Customer Reviews
- Google Review button
- Featured reviews and testimonials
- Rating analytics with distribution chart
- Admin review management (approve, feature, delete)

#### 15. Business Settings (Enhanced)
- All previous settings plus social media URLs
- Google Business links, GA4, Meta Pixel, Google Site Verification
- Holiday calendar, service pricing, theme settings, language settings
- GST deferred to future update

#### 16. AI Module
- Customer AI Assistant: booking help, FAQ, service recommendation, complaint help
- Admin AI Assistant: revenue summary, booking insights, technician performance, customer trends
- Architecture ready for future AI API integration

#### 17. Performance
- Lazy loading with React.lazy() for all pages
- Code splitting via dynamic imports
- Image optimization ready
- Fast mobile performance

### Database Migrations Applied
1. `digital_marketing_growth` - Google Business Profile, Analytics Events, Analytics Settings, Email Campaigns, Email Templates, Customer Reviews, Blog Categories, Blog Tags, Blog Post Categories/Tags, Settings enhancements (social media, Google, analytics), Blog post enhancements (SEO, featured, views)

### Previous Features (Retained from v2.0)
- Customer app, Technician app, Admin panel
- Technician approval workflow with verification fee and refund
- Revenue management and reporting
- PWA, SEO, responsive UI
