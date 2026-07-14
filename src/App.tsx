import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { AdminAuthProvider } from '@/lib/admin-auth'
import { I18nProvider } from '@/lib/i18n'
import { ToastProvider } from '@/hooks/use-toast'
import { PublicLayout } from '@/components/PublicLayout'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute'
import { LoadingScreen, NotFoundPage } from '@/components/LoadingScreen'

const HomePage = lazy(() => import('@/pages/public/HomePage'))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage'))
const PricingPage = lazy(() => import('@/pages/public/PricingPage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const ContactPage = lazy(() => import('@/pages/public/ContactPage'))
const CitiesPage = lazy(() => import('@/pages/public/CitiesPage'))
const FaqPage = lazy(() => import('@/pages/public/FaqPage'))
const BlogPage = lazy(() => import('@/pages/public/BlogPage'))
const ReviewsPage = lazy(() => import('@/pages/public/ReviewsPage'))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const AdminPinLoginPage = lazy(() => import('@/pages/auth/AdminPinLogin'))

const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'))
const CustomerBookingsPage = lazy(() => import('@/pages/customer/CustomerBookingsPage'))
const BookingPage = lazy(() => import('@/pages/customer/BookingPage'))
const CustomerTrackingPage = lazy(() => import('@/pages/customer/CustomerTrackingPage'))
const CustomerPaymentsPage = lazy(() => import('@/pages/customer/CustomerPaymentsPage'))
const CustomerProfilePage = lazy(() => import('@/pages/customer/CustomerProfilePage'))
const CustomerReviewPage = lazy(() => import('@/pages/customer/CustomerReviewPage'))
const CustomerNotificationsPage = lazy(() => import('@/pages/customer/CustomerNotificationsPage'))
const CustomerReferralPage = lazy(() => import('@/pages/customer/CustomerReferralPage'))
const CustomerAiAssistantPage = lazy(() => import('@/pages/customer/CustomerAiAssistantPage'))

const TechnicianDashboardPage = lazy(() => import('@/pages/technician/TechnicianDashboardPage'))
const TechnicianJobsPage = lazy(() => import('@/pages/technician/TechnicianJobsPage'))
const TechnicianWalletPage = lazy(() => import('@/pages/technician/TechnicianWalletPage'))
const TechnicianAreasPage = lazy(() => import('@/pages/technician/TechnicianAreasPage'))
const TechnicianEarningsPage = lazy(() => import('@/pages/technician/TechnicianEarningsPage'))
const TechnicianProfilePage = lazy(() => import('@/pages/technician/TechnicianProfilePage'))
const TechnicianNotificationsPage = lazy(() => import('@/pages/technician/TechnicianNotificationsPage'))
const TechnicianReferralPage = lazy(() => import('@/pages/technician/TechnicianReferralPage'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminVerificationPage = lazy(() => import('@/pages/admin/AdminVerificationPage'))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage'))
const AdminCrmPage = lazy(() => import('@/pages/admin/AdminCrmPage'))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'))
const AdminTechniciansPage = lazy(() => import('@/pages/admin/AdminTechniciansPage'))
const AdminServiceAreasPage = lazy(() => import('@/pages/admin/AdminServiceAreasPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'))
const AdminRevenuePage = lazy(() => import('@/pages/admin/AdminRevenuePage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'))
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminCouponsPage'))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'))
const AdminReferralPage = lazy(() => import('@/pages/admin/AdminReferralPage'))
const AdminMarketingPage = lazy(() => import('@/pages/admin/AdminMarketingPage'))
const AdminAiAssistantPage = lazy(() => import('@/pages/admin/AdminAiAssistantPage'))
const AdminGoogleBusinessPage = lazy(() => import('@/pages/admin/AdminGoogleBusinessPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminEmailMarketingPage = lazy(() => import('@/pages/admin/AdminEmailMarketingPage'))
const AdminBlogCmsPage = lazy(() => import('@/pages/admin/AdminBlogCmsPage'))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'))
const AdminMarketingDashboardPage = lazy(() => import('@/pages/admin/AdminMarketingDashboardPage'))

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
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
                </Route>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                <Route path="/dashboard" element={<ProtectedRoute roles={['customer']}><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<CustomerDashboardPage />} />
                  <Route path="bookings" element={<CustomerBookingsPage />} />
                  <Route path="book" element={<BookingPage />} />
                  <Route path="tracking" element={<CustomerTrackingPage />} />
                  <Route path="payments" element={<CustomerPaymentsPage />} />
                  <Route path="profile" element={<CustomerProfilePage />} />
                  <Route path="review/:bookingId" element={<CustomerReviewPage />} />
                  <Route path="notifications" element={<CustomerNotificationsPage />} />
                  <Route path="referrals" element={<CustomerReferralPage />} />
                  <Route path="ai-assistant" element={<CustomerAiAssistantPage />} />
                </Route>

                <Route path="/technician" element={<ProtectedRoute roles={['technician']}><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<TechnicianDashboardPage />} />
                  <Route path="jobs" element={<TechnicianJobsPage />} />
                  <Route path="wallet" element={<TechnicianWalletPage />} />
                  <Route path="areas" element={<TechnicianAreasPage />} />
                  <Route path="earnings" element={<TechnicianEarningsPage />} />
                  <Route path="profile" element={<TechnicianProfilePage />} />
                  <Route path="notifications" element={<TechnicianNotificationsPage />} />
                  <Route path="referrals" element={<TechnicianReferralPage />} />
                </Route>

                <Route path="/admin/login" element={<AdminPinLoginPage />} />

                <Route path="/admin" element={<AdminAuthProvider><AdminProtectedRoute><DashboardLayout /></AdminProtectedRoute></AdminAuthProvider>}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="verification" element={<AdminVerificationPage />} />
                  <Route path="bookings" element={<AdminBookingsPage />} />
                  <Route path="crm" element={<AdminCrmPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="technicians" element={<AdminTechniciansPage />} />
                  <Route path="service-areas" element={<AdminServiceAreasPage />} />
                  <Route path="payments" element={<AdminPaymentsPage />} />
                  <Route path="revenue" element={<AdminRevenuePage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                  <Route path="referrals" element={<AdminReferralPage />} />
                  <Route path="marketing" element={<AdminMarketingPage />} />
                  <Route path="ai-assistant" element={<AdminAiAssistantPage />} />
                  <Route path="google-business" element={<AdminGoogleBusinessPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="email-marketing" element={<AdminEmailMarketingPage />} />
                  <Route path="blog" element={<AdminBlogCmsPage />} />
                  <Route path="reviews" element={<AdminReviewsPage />} />
                  <Route path="marketing-dashboard" element={<AdminMarketingDashboardPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  )
}
