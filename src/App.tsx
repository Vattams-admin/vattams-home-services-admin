import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { PublicLayout } from '@/components/PublicLayout'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ProtectedRoute, RoleDashboardRedirect } from '@/components/ProtectedRoute'
import { LoadingScreen, NotFoundPage } from '@/components/LoadingScreen'

const HomePage = lazy(() => import('@/pages/public/HomePage').then(m => ({ default: m.HomePage })))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage').then(m => ({ default: m.ServicesPage })))
const PricingPage = lazy(() => import('@/pages/public/PricingPage').then(m => ({ default: m.PricingPage })))
const AboutPage = lazy(() => import('@/pages/public/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/public/ContactPage').then(m => ({ default: m.ContactPage })))
const CitiesPage = lazy(() => import('@/pages/public/CitiesPage').then(m => ({ default: m.CitiesPage })))
const FaqPage = lazy(() => import('@/pages/public/FaqPage').then(m => ({ default: m.FaqPage })))
const BlogPage = lazy(() => import('@/pages/public/BlogPage').then(m => ({ default: m.BlogPage })))
const ReviewsPage = lazy(() => import('@/pages/public/ReviewsPage').then(m => ({ default: m.ReviewsPage })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const BookingPage = lazy(() => import('@/pages/customer/BookingPage').then(m => ({ default: m.BookingPage })))
const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage').then(m => ({ default: m.CustomerDashboardPage })))
const CustomerBookingsPage = lazy(() => import('@/pages/customer/CustomerBookingsPage').then(m => ({ default: m.CustomerBookingsPage })))
const CustomerTrackingPage = lazy(() => import('@/pages/customer/CustomerTrackingPage').then(m => ({ default: m.CustomerTrackingPage })))
const CustomerPaymentsPage = lazy(() => import('@/pages/customer/CustomerPaymentsPage').then(m => ({ default: m.CustomerPaymentsPage })))
const CustomerNotificationsPage = lazy(() => import('@/pages/customer/CustomerNotificationsPage').then(m => ({ default: m.CustomerNotificationsPage })))
const CustomerProfilePage = lazy(() => import('@/pages/customer/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })))
const CustomerReviewPage = lazy(() => import('@/pages/customer/CustomerReviewPage').then(m => ({ default: m.CustomerReviewPage })))
const CustomerReferralPage = lazy(() => import('@/pages/customer/CustomerReferralPage').then(m => ({ default: m.CustomerReferralPage })))
const CustomerAiAssistantPage = lazy(() => import('@/pages/customer/CustomerAiAssistantPage').then(m => ({ default: m.CustomerAiAssistantPage })))
const TechnicianDashboardPage = lazy(() => import('@/pages/technician/TechnicianDashboardPage').then(m => ({ default: m.TechnicianDashboardPage })))
const TechnicianJobsPage = lazy(() => import('@/pages/technician/TechnicianJobsPage').then(m => ({ default: m.TechnicianJobsPage })))
const TechnicianWalletPage = lazy(() => import('@/pages/technician/TechnicianWalletPage').then(m => ({ default: m.TechnicianWalletPage })))
const TechnicianAreasPage = lazy(() => import('@/pages/technician/TechnicianAreasPage').then(m => ({ default: m.TechnicianAreasPage })))
const TechnicianEarningsPage = lazy(() => import('@/pages/technician/TechnicianEarningsPage').then(m => ({ default: m.TechnicianEarningsPage })))
const TechnicianProfilePage = lazy(() => import('@/pages/technician/TechnicianProfilePage').then(m => ({ default: m.TechnicianProfilePage })))
const TechnicianNotificationsPage = lazy(() => import('@/pages/technician/TechnicianNotificationsPage').then(m => ({ default: m.TechnicianNotificationsPage })))
const TechnicianReferralPage = lazy(() => import('@/pages/technician/TechnicianReferralPage').then(m => ({ default: m.TechnicianReferralPage })))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminVerificationPage = lazy(() => import('@/pages/admin/AdminVerificationPage').then(m => ({ default: m.AdminVerificationPage })))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage').then(m => ({ default: m.AdminBookingsPage })))
const AdminCrmPage = lazy(() => import('@/pages/admin/AdminCrmPage').then(m => ({ default: m.AdminCrmPage })))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage').then(m => ({ default: m.AdminCustomersPage })))
const AdminTechniciansPage = lazy(() => import('@/pages/admin/AdminTechniciansPage').then(m => ({ default: m.AdminTechniciansPage })))
const AdminServiceAreasPage = lazy(() => import('@/pages/admin/AdminServiceAreasPage').then(m => ({ default: m.AdminServiceAreasPage })))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage })))
const AdminRevenuePage = lazy(() => import('@/pages/admin/AdminRevenuePage').then(m => ({ default: m.AdminRevenuePage })))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })))
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })))
const AdminReferralPage = lazy(() => import('@/pages/admin/AdminReferralPage').then(m => ({ default: m.AdminReferralPage })))
const AdminMarketingPage = lazy(() => import('@/pages/admin/AdminMarketingPage').then(m => ({ default: m.AdminMarketingPage })))
const AdminAiAssistantPage = lazy(() => import('@/pages/admin/AdminAiAssistantPage').then(m => ({ default: m.AdminAiAssistantPage })))
const AdminGoogleBusinessPage = lazy(() => import('@/pages/admin/AdminGoogleBusinessPage').then(m => ({ default: m.AdminGoogleBusinessPage })))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage').then(m => ({ default: m.AdminAnalyticsPage })))
const AdminEmailMarketingPage = lazy(() => import('@/pages/admin/AdminEmailMarketingPage').then(m => ({ default: m.AdminEmailMarketingPage })))
const AdminBlogCmsPage = lazy(() => import('@/pages/admin/AdminBlogCmsPage').then(m => ({ default: m.AdminBlogCmsPage })))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })))
const AdminMarketingDashboardPage = lazy(() => import('@/pages/admin/AdminMarketingDashboardPage').then(m => ({ default: m.AdminMarketingDashboardPage })))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/cities" element={<CitiesPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/:role" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer','technician','admin','super_admin']}><RoleDashboardRedirect /></ProtectedRoute>} />
            <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="bookings" element={<CustomerBookingsPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="track/:bookingId" element={<CustomerTrackingPage />} />
              <Route path="payments" element={<CustomerPaymentsPage />} />
              <Route path="notifications" element={<CustomerNotificationsPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
              <Route path="review/:bookingId" element={<CustomerReviewPage />} />
              <Route path="referrals" element={<CustomerReferralPage />} />
              <Route path="ai-assistant" element={<CustomerAiAssistantPage />} />
            </Route>
            <Route path="/technician" element={<ProtectedRoute allowedRoles={['technician']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<TechnicianDashboardPage />} />
              <Route path="jobs" element={<TechnicianJobsPage />} />
              <Route path="wallet" element={<TechnicianWalletPage />} />
              <Route path="areas" element={<TechnicianAreasPage />} />
              <Route path="earnings" element={<TechnicianEarningsPage />} />
              <Route path="notifications" element={<TechnicianNotificationsPage />} />
              <Route path="profile" element={<TechnicianProfilePage />} />
              <Route path="referrals" element={<TechnicianReferralPage />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin','super_admin']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="verification" element={<AdminVerificationPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="crm" element={<AdminCrmPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="technicians" element={<AdminTechniciansPage />} />
              <Route path="service-areas" element={<AdminServiceAreasPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="revenue" element={<AdminRevenuePage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="referrals" element={<AdminReferralPage />} />
              <Route path="marketing" element={<AdminMarketingPage />} />
              <Route path="marketing-dashboard" element={<AdminMarketingDashboardPage />} />
              <Route path="google-business" element={<AdminGoogleBusinessPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="email-marketing" element={<AdminEmailMarketingPage />} />
              <Route path="blog" element={<AdminBlogCmsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="ai-assistant" element={<AdminAiAssistantPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
