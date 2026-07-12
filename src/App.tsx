import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { PublicLayout } from '@/components/PublicLayout'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ProtectedRoute, RoleDashboardRedirect } from '@/components/ProtectedRoute'

const HomePage = lazy(() => import('@/pages/public/HomePage').then(m => ({ default: m.HomePage })))
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage').then(m => ({ default: m.ServicesPage })))
const PricingPage = lazy(() => import('@/pages/public/PricingPage').then(m => ({ default: m.PricingPage })))
const AboutPage = lazy(() => import('@/pages/public/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/public/ContactPage').then(m => ({ default: m.ContactPage })))
const CitiesPage = lazy(() => import('@/pages/public/CitiesPage').then(m => ({ default: m.CitiesPage })))
const FaqPage = lazy(() => import('@/pages/public/FaqPage').then(m => ({ default: m.FaqPage })))
const BlogPage = lazy(() => import('@/pages/public/BlogPage').then(m => ({ default: m.BlogPage })))
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
const TechnicianDashboardPage = lazy(() => import('@/pages/technician/TechnicianDashboardPage').then(m => ({ default: m.TechnicianDashboardPage })))
const TechnicianJobsPage = lazy(() => import('@/pages/technician/TechnicianJobsPage').then(m => ({ default: m.TechnicianJobsPage })))
const TechnicianAreasPage = lazy(() => import('@/pages/technician/TechnicianAreasPage').then(m => ({ default: m.TechnicianAreasPage })))
const TechnicianEarningsPage = lazy(() => import('@/pages/technician/TechnicianEarningsPage').then(m => ({ default: m.TechnicianEarningsPage })))
const TechnicianProfilePage = lazy(() => import('@/pages/technician/TechnicianProfilePage').then(m => ({ default: m.TechnicianProfilePage })))
const TechnicianNotificationsPage = lazy(() => import('@/pages/technician/TechnicianNotificationsPage').then(m => ({ default: m.TechnicianNotificationsPage })))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminBookingsPage = lazy(() => import('@/pages/admin/AdminBookingsPage').then(m => ({ default: m.AdminBookingsPage })))
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage').then(m => ({ default: m.AdminCustomersPage })))
const AdminTechniciansPage = lazy(() => import('@/pages/admin/AdminTechniciansPage').then(m => ({ default: m.AdminTechniciansPage })))
const AdminServiceAreasPage = lazy(() => import('@/pages/admin/AdminServiceAreasPage').then(m => ({ default: m.AdminServiceAreasPage })))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage').then(m => ({ default: m.AdminPaymentsPage })))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })))

function Loading() {
  return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/:role" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            <Route path="/dashboard" element={<ProtectedRoute><RoleDashboardRedirect /></ProtectedRoute>} />

            <Route path="/customer" element={<ProtectedRoute roles={['customer']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="bookings" element={<CustomerBookingsPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="track/:bookingId" element={<CustomerTrackingPage />} />
              <Route path="payments" element={<CustomerPaymentsPage />} />
              <Route path="notifications" element={<CustomerNotificationsPage />} />
              <Route path="profile" element={<CustomerProfilePage />} />
              <Route path="review/:bookingId" element={<CustomerReviewPage />} />
            </Route>

            <Route path="/technician" element={<ProtectedRoute roles={['technician']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<TechnicianDashboardPage />} />
              <Route path="jobs" element={<TechnicianJobsPage />} />
              <Route path="areas" element={<TechnicianAreasPage />} />
              <Route path="earnings" element={<TechnicianEarningsPage />} />
              <Route path="notifications" element={<TechnicianNotificationsPage />} />
              <Route path="profile" element={<TechnicianProfilePage />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute roles={['admin','super_admin']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="technicians" element={<AdminTechniciansPage />} />
              <Route path="service-areas" element={<AdminServiceAreasPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
