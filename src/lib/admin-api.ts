const ADMIN_DATA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`

function getAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY
}

type FilterParams = Record<string, string | boolean | number>

async function adminFetch(params: FilterParams = {}): Promise<any> {
  const url = new URL(ADMIN_DATA_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAnonKey()}`,
      apikey: getAnonKey(),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin data')
  return data
}

async function adminPost(body: Record<string, unknown>): Promise<any> {
  const res = await fetch(ADMIN_DATA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAnonKey()}`,
      apikey: getAnonKey(),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to perform admin action')
  return data
}

async function adminPut(action: string, body: Record<string, unknown>, params: FilterParams = {}) {
  const url = new URL(ADMIN_DATA_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAnonKey()}`,
      apikey: getAnonKey(),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to perform admin action')
  return data
}

async function adminDelete(action: string, params: FilterParams = {}) {
  const url = new URL(ADMIN_DATA_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAnonKey()}`,
      apikey: getAnonKey(),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to perform admin action')
  return data
}

export const adminApi = {
  // ── Dashboard ──
  getDashboard: () => adminFetch({ action: 'dashboard' }),

  // ── Bookings ──
  getBookings: (filters: FilterParams = {}) => adminFetch({ action: 'bookings', ...filters }),
  getBookingInvoice: (bookingId: string) => adminFetch({ action: 'booking-invoice', booking_id: bookingId }),
  getBookingDetail: (bookingId: string) => adminFetch({ action: 'booking-detail', booking_id: bookingId }),
  updateBookingStatus: (id: string, status: string) => adminPost({ action: 'update-booking-status', id, status }),
  assignTechnician: (bookingId: string, technicianId: string) => adminPost({ action: 'assign-technician', booking_id: bookingId, technician_id: technicianId }),

  // ── Customers ──
  getCustomers: () => adminFetch({ action: 'customers' }),
  getCustomerBookings: (customerId: string) => adminFetch({ action: 'customer-bookings', customer_id: customerId }),
  getCustomerInvoices: (customerId: string) => adminFetch({ action: 'customer-invoices', customer_id: customerId }),
  getCustomerNotes: (customerId: string) => adminFetch({ action: 'customer-notes', customer_id: customerId }),
  getCustomerStats: () => adminFetch({ action: 'customer-stats' }),
  createCustomerNote: (note: Record<string, unknown>) => adminPost({ action: 'create-customer-note', note }),

  // ── Technicians ──
  getTechnicians: (filters: FilterParams = {}) => adminFetch({ action: 'technicians', ...filters }),
  getPendingVerifications: (filters: FilterParams = {}) => adminFetch({ action: 'pending-verifications', ...filters }),
  getTechnicianBookings: (techId: string) => adminFetch({ action: 'technician-bookings', technician_id: techId }),
  getTechnicianReviews: (techId: string) => adminFetch({ action: 'technician-reviews', technician_id: techId }),
  getTechnicianWallet: (techId: string) => adminFetch({ action: 'technician-wallet', technician_id: techId }),
  getTechnicianDocuments: (techId: string) => adminFetch({ action: 'technician-documents', technician_id: techId }),
  getTechnicianVerificationPayments: (techId: string) => adminFetch({ action: 'technician-verification-payments', technician_id: techId }),
  getTechnicianStats: (techIds: string[]) => adminFetch({ action: 'technician-stats', technician_ids: techIds.join(',') }),
  approveTechnician: (id: string) => adminPost({ action: 'approve-technician', id }),
  rejectTechnician: (id: string, reason?: string) => adminPost({ action: 'reject-technician', id, reason }),
  moveToReview: (id: string) => adminPost({ action: 'move-to-review', id }),
  suspendTechnician: (id: string) => adminPost({ action: 'suspend-technician', id }),

  // ── Notifications ──
  getNotifications: () => adminFetch({ action: 'notifications' }),
  createNotification: (notification: Record<string, unknown>) => adminPost({ action: 'create-notification', notification }),
  sendNotifications: (notifications: Record<string, unknown>[]) => adminPost({ action: 'send-notifications', notifications }),
  getNotificationRecipients: (recipientType: string) => adminFetch({ action: 'notification-recipients', recipient_type: recipientType }),

  // ── Settings ──
  getSettings: () => adminFetch({ action: 'settings' }),
  getSettingsUpi: () => adminFetch({ action: 'settings-upi' }),
  updateSettings: (settings: Record<string, unknown>) => adminPost({ action: 'update-settings', ...settings }),

  // ── Service Areas ──
  getServiceAreas: (filters: FilterParams = {}) => adminFetch({ action: 'service-areas', ...filters }),
  createServiceArea: (area: Record<string, unknown>) => adminPost({ action: 'create-service-area', area }),
  updateServiceArea: (id: string, area: Record<string, unknown>) => adminPut('update-service-area', area, { id }),
  toggleServiceArea: (id: string, isActive: boolean) => adminPut('toggle-service-area', { is_active: isActive }, { id }),
  deleteServiceArea: (id: string) => adminDelete('delete-service-area', { id }),

  // ── Coupons ──
  getCoupons: (filters: FilterParams = {}) => adminFetch({ action: 'coupons', ...filters }),
  createCoupon: (coupon: Record<string, unknown>) => adminPost({ action: 'create-coupon', coupon }),
  updateCoupon: (id: string, coupon: Record<string, unknown>) => adminPut('update-coupon', coupon, { id }),
  toggleCoupon: (id: string, isActive: boolean) => adminPut('toggle-coupon', { is_active: isActive }, { id }),
  deleteCoupon: (id: string) => adminDelete('delete-coupon', { id }),

  // ── Reviews ──
  getReviews: (filters: FilterParams = {}) => adminFetch({ action: 'reviews', ...filters }),
  getReviewStats: () => adminFetch({ action: 'review-stats' }),
  approveReview: (id: string) => adminPost({ action: 'approve-review', id }),
  rejectReview: (id: string) => adminPost({ action: 'reject-review', id }),
  toggleFeatureReview: (id: string, isFeatured: boolean) => adminPost({ action: 'toggle-feature-review', id, is_featured: isFeatured }),

  // ── Invoices / Payments ──
  getInvoices: (filters: FilterParams = {}) => adminFetch({ action: 'invoices', ...filters }),
  updateInvoiceStatus: (id: string, status: string) => adminPost({ action: 'update-invoice-status', id, status }),

  // ── Revenue ──
  getRevenue: (filters: FilterParams = {}) => adminFetch({ action: 'revenue', ...filters }),
  getRevenueData: (filters: FilterParams = {}) => adminFetch({ action: 'revenue-data', ...filters }),

  // ── Audit Logs ──
  getAuditLogs: (filters: FilterParams = {}) => adminFetch({ action: 'audit-logs', ...filters }),
  createAuditLog: (userId: string, logAction: string, entityType: string, entityId: string | null, details: string | null = null) =>
    adminPost({ action: 'create-audit-log', user_id: userId, log_action: logAction, entity_type: entityType, entity_id: entityId, details }),

  // ── Referrals ──
  getReferrals: (filters: FilterParams = {}) => adminFetch({ action: 'referrals', ...filters }),
  getReferralStats: () => adminFetch({ action: 'referral-stats' }),
  updateReferralStatus: (id: string, status: string) => adminPost({ action: 'update-referral-status', id, status }),

  // ── CRM ──
  getCrmNotes: () => adminFetch({ action: 'crm-notes' }),
  getCrmFollowups: () => adminFetch({ action: 'crm-followups' }),
  getCrmComplaints: () => adminFetch({ action: 'crm-complaints' }),
  getCrmReminders: () => adminFetch({ action: 'crm-reminders' }),
  createCustomerFollowup: (followup: Record<string, unknown>) => adminPost({ action: 'create-customer-followup', followup }),
  createServiceReminder: (reminder: Record<string, unknown>) => adminPost({ action: 'create-service-reminder', reminder }),
  createCustomerComplaint: (complaint: Record<string, unknown>) => adminPost({ action: 'create-customer-complaint', complaint }),
  updateFollowupStatus: (id: string, status: string) => adminPost({ action: 'update-followup-status', id, status }),
  updateComplaintStatus: (id: string, status: string) => adminPost({ action: 'update-complaint-status', id, status }),

  // ── Profiles (for dropdowns / lookups) ──
  getProfiles: (role?: string) => adminFetch({ action: 'profiles', ...(role ? { role } : {}) }),
  getProfilesMinimal: (role?: string) => adminFetch({ action: 'profiles-minimal', ...(role ? { role } : {}) }),

  // ── Marketing ──
  getMarketingCampaigns: () => adminFetch({ action: 'marketing-campaigns' }),
  getHomepageBanners: () => adminFetch({ action: 'homepage-banners' }),
  getPopupAnnouncements: () => adminFetch({ action: 'popup-announcements' }),
  createMarketingCampaign: (campaign: Record<string, unknown>) => adminPost({ action: 'create-marketing-campaign', campaign }),
  createHomepageBanner: (banner: Record<string, unknown>) => adminPost({ action: 'create-homepage-banner', banner }),
  createPopupAnnouncement: (popup: Record<string, unknown>) => adminPost({ action: 'create-popup-announcement', popup }),
  updateMarketingCampaign: (id: string, campaign: Record<string, unknown>) => adminPut('update-marketing-campaign', campaign, { id }),
  updateHomepageBanner: (id: string, banner: Record<string, unknown>) => adminPut('update-homepage-banner', banner, { id }),
  toggleHomepageBanner: (id: string, isActive: boolean) => adminPut('toggle-homepage-banner', { is_active: isActive }, { id }),
  updatePopupAnnouncement: (id: string, popup: Record<string, unknown>) => adminPut('update-popup-announcement', popup, { id }),
  togglePopupAnnouncement: (id: string, isActive: boolean) => adminPut('toggle-popup-announcement', { is_active: isActive }, { id }),
  deleteMarketingCampaign: (id: string) => adminDelete('delete-marketing-campaign', { id }),
  deleteHomepageBanner: (id: string) => adminDelete('delete-homepage-banner', { id }),
  deletePopupAnnouncement: (id: string) => adminDelete('delete-popup-announcement', { id }),

  // ── Google Business ──
  getGoogleBusinessProfile: () => adminFetch({ action: 'google-business-profile' }),
  createGoogleBusinessProfile: (profile: Record<string, unknown>) => adminPost({ action: 'create-google-business-profile', profile }),
  updateGoogleBusinessProfile: (id: string, profile: Record<string, unknown>) => adminPut('update-google-business-profile', profile, { id }),

  // ── Analytics ──
  getAnalyticsEvents: (filters: FilterParams = {}) => adminFetch({ action: 'analytics-events', ...filters }),
  getAnalyticsSettings: () => adminFetch({ action: 'analytics-settings' }),

  // ── Email Marketing ──
  getEmailCampaigns: () => adminFetch({ action: 'email-campaigns' }),
  getEmailTemplates: () => adminFetch({ action: 'email-templates' }),
  createEmailCampaign: (campaign: Record<string, unknown>) => adminPost({ action: 'create-email-campaign', campaign }),
  createEmailTemplate: (template: Record<string, unknown>) => adminPost({ action: 'create-email-template', template }),
  updateEmailCampaign: (id: string, campaign: Record<string, unknown>) => adminPut('update-email-campaign', campaign, { id }),
  updateEmailTemplate: (id: string, template: Record<string, unknown>) => adminPut('update-email-template', template, { id }),
  deleteEmailCampaign: (id: string) => adminDelete('delete-email-campaign', { id }),
  deleteEmailTemplate: (id: string) => adminDelete('delete-email-template', { id }),

  // ── Blog CMS ──
  getBlogPosts: () => adminFetch({ action: 'blog-posts' }),
  getBlogCategories: () => adminFetch({ action: 'blog-categories' }),
  getBlogTags: () => adminFetch({ action: 'blog-tags' }),
  createBlogPost: (post: Record<string, unknown>) => adminPost({ action: 'create-blog-post', post }),
  createBlogCategory: (category: Record<string, unknown>) => adminPost({ action: 'create-blog-category', category }),
  createBlogTag: (tag: Record<string, unknown>) => adminPost({ action: 'create-blog-tag', tag }),
  updateBlogPost: (id: string, post: Record<string, unknown>) => adminPut('update-blog-post', post, { id }),
  toggleBlogPostPublish: (id: string, isPublished: boolean) => adminPut('toggle-blog-post-publish', { is_published: isPublished }, { id }),
  updateBlogCategory: (id: string, category: Record<string, unknown>) => adminPut('update-blog-category', category, { id }),
  deleteBlogPost: (id: string) => adminDelete('delete-blog-post', { id }),
  deleteBlogCategory: (id: string) => adminDelete('delete-blog-category', { id }),
  deleteBlogTag: (id: string) => adminDelete('delete-blog-tag', { id }),

  // ── AI Insights ──
  getAiInsights: () => adminFetch({ action: 'ai-insights' }),
  clearAiInsights: () => adminPost({ action: 'clear-ai-insights' }),

  // ── Marketing Dashboard ──
  getMarketingDashboard: () => adminFetch({ action: 'marketing-dashboard' }),

  // ── Reports ──
  getReportBookings: (filters: FilterParams = {}) => adminFetch({ action: 'report-bookings', ...filters }),
  getReportInvoices: (filters: FilterParams = {}) => adminFetch({ action: 'report-invoices', ...filters }),
  getReportTechnicianPerformance: (filters: FilterParams = {}) => adminFetch({ action: 'report-technician-performance', ...filters }),
}
