import { supabase } from '@/lib/supabase'

type FilterParams = Record<string, string | boolean | number>

export const adminApi: Record<string, (...args: any[]) => Promise<any>> = {
  // ── Dashboard ──
  async getDashboard() {
    const { data, error } = await supabase.rpc('get_admin_dashboard_data')
    if (error) throw new Error(error.message)
    return data
  },

  // ── Bookings ──
  async getBookings(filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_bookings', {
      p_status: (filters.status as string) || null,
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getBookingInvoice(bookingId: string) {
    const { data, error } = await supabase.from('invoices').select('*').eq('booking_id', bookingId).maybeSingle()
    if (error) throw new Error(error.message)
    return { data }
  },

  async getBookingDetail(bookingId: string) {
    const { data, error } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateBookingStatus(id: string, status: string) {
    const { data, error } = await supabase.rpc('update_booking_status_admin', {
      booking_id: id, new_status: status,
    })
    if (error) throw new Error(error.message)
    return data
  },

  async assignTechnician(bookingId: string, technicianId: string) {
    const { data, error } = await supabase.rpc('assign_technician_to_booking', {
      booking_id: bookingId, tech_id: technicianId,
    })
    if (error) throw new Error(error.message)
    return data
  },

  // ── Customers ──
  async getCustomers() {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: 'customer' })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCustomerBookings(customerId: string) {
    const { data, error } = await supabase.from('bookings').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCustomerInvoices(customerId: string) {
    const { data, error } = await supabase.from('invoices').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCustomerNotes(customerId: string) {
    const { data, error } = await supabase.from('customer_notes').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCustomerStats() {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: 'customer' })
    if (error) throw new Error(error.message)
    const customers = data || []
    const customerIds = customers.map((c: Record<string, unknown>) => c.id)
    let bookings: any[] = []
    let invoices: any[] = []
    if (customerIds.length > 0) {
      const [bookingsRes, invoicesRes] = await Promise.all([
        supabase.from('bookings').select('*').in('customer_id', customerIds),
        supabase.from('invoices').select('*').in('customer_id', customerIds),
      ])
      bookings = bookingsRes.data || []
      invoices = invoicesRes.data || []
    }
    return { data: { total: customers.length, bookings, invoices } }
  },

  async createCustomerNote(note: Record<string, unknown>) {
    const { data, error } = await supabase.from('customer_notes').insert(note).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  // ── Technicians ──
  async getTechnicians(filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: 'technician' })
    if (error) throw new Error(error.message)
    let result = data || []
    if (filters.status) result = result.filter((t: Record<string, unknown>) => t.verification_status === filters.status)
    return { data: result }
  },

  async getPendingVerifications(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: 'technician' })
    if (error) throw new Error(error.message)
    return { data: (data || []).filter((t: Record<string, unknown>) => t.verification_status === 'pending_registration') }
  },

  async getTechnicianBookings(techId: string) {
    const { data, error } = await supabase.from('bookings').select('*').eq('technician_id', techId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data, bookings: data || [] }
  },

  async getTechnicianReviews(techId: string) {
    const { data, error } = await supabase.from('reviews').select('*').eq('technician_id', techId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data, reviews: data || [] }
  },

  async getTechnicianWallet(techId: string) {
    const { data, error } = await supabase.from('technician_wallets').select('*').eq('technician_id', techId).maybeSingle()
    if (error) throw new Error(error.message)
    return { data }
  },

  async getTechnicianDocuments(techId: string) {
    const { data, error } = await supabase.from('technician_documents').select('*').eq('technician_id', techId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getTechnicianVerificationPayments(techId: string) {
    const { data, error } = await supabase.from('verification_payments').select('*').eq('technician_id', techId).order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getTechnicianStats(techIds: string[]) {
    const { data, error } = await supabase.from('technician_wallets').select('*').in('technician_id', techIds)
    if (error) throw new Error(error.message)
    return { data, wallets: data || [] }
  },

  async approveTechnician(id: string) {
    const { data, error } = await supabase.rpc('approve_technician', { tech_id: id })
    if (error) throw new Error(error.message)
    return data
  },

  async rejectTechnician(id: string, reason?: string) {
    const { data, error } = await supabase.rpc('reject_technician', { tech_id: id, reason: reason || null })
    if (error) throw new Error(error.message)
    return data
  },

  async moveToReview(id: string) {
    const { data, error } = await supabase.rpc('approve_technician', { tech_id: id })
    if (error) throw new Error(error.message)
    return data
  },

  async suspendTechnician(id: string) {
    const { data, error } = await supabase.rpc('reject_technician', { tech_id: id, reason: 'Suspended by admin' })
    if (error) throw new Error(error.message)
    return data
  },

  // ── Notifications ──
  async getNotifications() {
    const { data, error } = await supabase.rpc('get_all_notifications')
    if (error) throw new Error(error.message)
    return { data }
  },

  async createNotification(notification: Record<string, unknown>) {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async sendNotifications(notifications: Record<string, unknown>[]) {
    const { data, error } = await supabase.from('notifications').insert(notifications)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async getNotificationRecipients(recipientType: string) {
    const role = recipientType === 'all' ? null : recipientType
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: role })
    if (error) throw new Error(error.message)
    return { data: (data || []).map((p: Record<string, unknown>) => ({ id: p.id, name: p.name, mobile: p.mobile })) }
  },

  // ── Settings ──
  async getSettings() {
    const { data, error } = await supabase.rpc('get_admin_settings')
    if (error) throw new Error(error.message)
    return { data }
  },

  async getSettingsUpi() {
    const { data, error } = await supabase.rpc('get_admin_settings')
    if (error) throw new Error(error.message)
    return { data: { upi_id: data?.upi_id || null } }
  },

  async updateSettings(settings: Record<string, unknown>) {
    const { data, error } = await supabase.rpc('update_admin_settings', { settings_data: settings })
    if (error) throw new Error(error.message)
    return { data }
  },

  // ── Service Areas ──
  async getServiceAreas(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_service_areas')
    if (error) throw new Error(error.message)
    return { data }
  },

  async createServiceArea(area: Record<string, unknown>) {
    const { data, error } = await supabase.from('service_areas').insert(area).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateServiceArea(id: string, area: Record<string, unknown>) {
    const { data, error } = await supabase.from('service_areas').update(area).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async toggleServiceArea(id: string, isActive: boolean) {
    const { data, error } = await supabase.from('service_areas').update({ is_active: isActive }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async deleteServiceArea(id: string) {
    const { error } = await supabase.from('service_areas').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── Coupons ──
  async getCoupons(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_coupons')
    if (error) throw new Error(error.message)
    return { data }
  },

  async createCoupon(coupon: Record<string, unknown>) {
    const { data, error } = await supabase.from('coupons').insert(coupon).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateCoupon(id: string, coupon: Record<string, unknown>) {
    const { data, error } = await supabase.from('coupons').update(coupon).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async toggleCoupon(id: string, isActive: boolean) {
    const { data, error } = await supabase.from('coupons').update({ is_active: isActive }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async deleteCoupon(id: string) {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── Reviews ──
  async getReviews(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_customer_reviews')
    if (error) throw new Error(error.message)
    return { data }
  },

  async getReviewStats() {
    const { data, error } = await supabase.rpc('get_all_customer_reviews')
    if (error) throw new Error(error.message)
    const total = data?.length || 0
    const approved = data?.filter((r: Record<string, unknown>) => r.is_approved).length || 0
    const featured = data?.filter((r: Record<string, unknown>) => r.is_featured).length || 0
    const avgRating = total > 0 ? (data?.reduce((s: number, r: Record<string, unknown>) => s + (r.rating as number || 0), 0) / total) : 0
    return { data: { total, approved, featured, avgRating } }
  },

  async approveReview(id: string) {
    const { data, error } = await supabase.from('customer_reviews').update({ is_approved: true }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  async rejectReview(id: string) {
    const { data, error } = await supabase.from('customer_reviews').update({ is_approved: false }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  async toggleFeatureReview(id: string, isFeatured: boolean) {
    const { data, error } = await supabase.from('customer_reviews').update({ is_featured: isFeatured }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  // ── Invoices / Payments ──
  async getInvoices(filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_invoices', {
      p_status: (filters.status as string) || null,
    })
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateInvoiceStatus(id: string, status: string) {
    const { data, error } = await supabase.from('invoices').update({ status }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  // ── Revenue ──
  async getRevenue(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_revenue_transactions')
    if (error) throw new Error(error.message)
    return { data }
  },

  async getRevenueData() {
    const [txnsRes, invoicesRes] = await Promise.all([
      supabase.rpc('get_all_revenue_transactions'),
      supabase.rpc('get_all_invoices', { p_status: null }),
    ])
    if (txnsRes.error) throw new Error(txnsRes.error.message)
    if (invoicesRes.error) throw new Error(invoicesRes.error.message)
    return {
      transactions: txnsRes.data || [],
      invoices: invoicesRes.data || [],
      allInvoices: invoicesRes.data || [],
    }
  },

  // ── Audit Logs ──
  async getAuditLogs(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_audit_logs')
    if (error) throw new Error(error.message)
    return { data }
  },

  async createAuditLog(userId: string, logAction: string, entityType: string, entityId: string | null, details: string | null = null) {
    const { data, error } = await supabase.from('audit_logs').insert({
      user_id: userId, action: logAction, entity_type: entityType, entity_id: entityId, details,
    }).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  // ── Referrals ──
  async getReferrals(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_referrals')
    if (error) throw new Error(error.message)
    return { data }
  },

  async getReferralStats() {
    const { data, error } = await supabase.rpc('get_all_referrals')
    if (error) throw new Error(error.message)
    const total = data?.length || 0
    const completed = data?.filter((r: Record<string, unknown>) => r.status === 'completed').length || 0
    const pending = data?.filter((r: Record<string, unknown>) => r.status === 'pending').length || 0
    return { data: { total, completed, pending } }
  },

  async updateReferralStatus(id: string, status: string) {
    const { data, error } = await supabase.from('referrals').update({ status }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  // ── CRM ──
  async getCrmNotes() {
    const { data, error } = await supabase.from('customer_notes').select('*, profiles!customer_id(name, mobile, email)').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCrmFollowups() {
    const { data, error } = await supabase.from('customer_followups').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCrmComplaints() {
    const { data, error } = await supabase.from('customer_complaints').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getCrmReminders() {
    const { data, error } = await supabase.from('service_reminders').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async createCustomerFollowup(followup: Record<string, unknown>) {
    const { data, error } = await supabase.from('customer_followups').insert(followup).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createServiceReminder(reminder: Record<string, unknown>) {
    const { data, error } = await supabase.from('service_reminders').insert(reminder).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createCustomerComplaint(complaint: Record<string, unknown>) {
    const { data, error } = await supabase.from('customer_complaints').insert(complaint).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateFollowupStatus(id: string, status: string) {
    const { data, error } = await supabase.from('customer_followups').update({ status }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  async updateComplaintStatus(id: string, status: string) {
    const { data, error } = await supabase.from('customer_complaints').update({ status }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { success: true, data }
  },

  // ── Profiles ──
  async getProfiles(role?: string) {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: role || null })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getProfilesMinimal(role?: string) {
    const { data, error } = await supabase.rpc('get_all_profiles', { p_role: role || null })
    if (error) throw new Error(error.message)
    return { data: (data || []).map((p: Record<string, unknown>) => ({ id: p.id, name: p.name, mobile: p.mobile, role: p.role, verification_status: p.verification_status })) }
  },

  // ── Marketing ──
  async getMarketingCampaigns() {
    const { data, error } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getHomepageBanners() {
    const { data, error } = await supabase.from('homepage_banners').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getPopupAnnouncements() {
    const { data, error } = await supabase.from('popup_announcements').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async createMarketingCampaign(campaign: Record<string, unknown>) {
    const { data, error } = await supabase.from('marketing_campaigns').insert(campaign).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createHomepageBanner(banner: Record<string, unknown>) {
    const { data, error } = await supabase.from('homepage_banners').insert(banner).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createPopupAnnouncement(popup: Record<string, unknown>) {
    const { data, error } = await supabase.from('popup_announcements').insert(popup).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateMarketingCampaign(id: string, campaign: Record<string, unknown>) {
    const { data, error } = await supabase.from('marketing_campaigns').update(campaign).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateHomepageBanner(id: string, banner: Record<string, unknown>) {
    const { data, error } = await supabase.from('homepage_banners').update(banner).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async toggleHomepageBanner(id: string, isActive: boolean) {
    const { data, error } = await supabase.from('homepage_banners').update({ is_active: isActive }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updatePopupAnnouncement(id: string, popup: Record<string, unknown>) {
    const { data, error } = await supabase.from('popup_announcements').update(popup).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async togglePopupAnnouncement(id: string, isActive: boolean) {
    const { data, error } = await supabase.from('popup_announcements').update({ is_active: isActive }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async deleteMarketingCampaign(id: string) {
    const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async deleteHomepageBanner(id: string) {
    const { error } = await supabase.from('homepage_banners').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async deletePopupAnnouncement(id: string) {
    const { error } = await supabase.from('popup_announcements').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── Google Business ──
  async getGoogleBusinessProfile() {
    const { data, error } = await supabase.from('google_business_profiles').select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createGoogleBusinessProfile(profile: Record<string, unknown>) {
    const { data, error } = await supabase.from('google_business_profiles').insert(profile).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateGoogleBusinessProfile(id: string, profile: Record<string, unknown>) {
    const { data, error } = await supabase.from('google_business_profiles').update(profile).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  // ── Analytics ──
  async getAnalyticsEvents() {
    const { data, error } = await supabase.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(500)
    if (error) throw new Error(error.message)
    return { data }
  },

  async getAnalyticsSettings() {
    const { data, error } = await supabase.from('analytics_settings').select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return { data }
  },

  // ── Email Marketing ──
  async getEmailCampaigns() {
    const { data, error } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getEmailTemplates() {
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async createEmailCampaign(campaign: Record<string, unknown>) {
    const { data, error } = await supabase.from('email_campaigns').insert(campaign).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createEmailTemplate(template: Record<string, unknown>) {
    const { data, error } = await supabase.from('email_templates').insert(template).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateEmailCampaign(id: string, campaign: Record<string, unknown>) {
    const { data, error } = await supabase.from('email_campaigns').update(campaign).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateEmailTemplate(id: string, template: Record<string, unknown>) {
    const { data, error } = await supabase.from('email_templates').update(template).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async deleteEmailCampaign(id: string) {
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async deleteEmailTemplate(id: string) {
    const { error } = await supabase.from('email_templates').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── Blog CMS ──
  async getBlogPosts() {
    const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getBlogCategories() {
    const { data, error } = await supabase.from('blog_categories').select('*').order('name', { ascending: true })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getBlogTags() {
    const { data, error } = await supabase.from('blog_tags').select('*').order('name', { ascending: true })
    if (error) throw new Error(error.message)
    return { data }
  },

  async createBlogPost(post: Record<string, unknown>) {
    const { data, error } = await supabase.from('blog_posts').insert(post).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createBlogCategory(category: Record<string, unknown>) {
    const { data, error } = await supabase.from('blog_categories').insert(category).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async createBlogTag(tag: Record<string, unknown>) {
    const { data, error } = await supabase.from('blog_tags').insert(tag).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateBlogPost(id: string, post: Record<string, unknown>) {
    const { data, error } = await supabase.from('blog_posts').update(post).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async toggleBlogPostPublish(id: string, isPublished: boolean) {
    const { data, error } = await supabase.from('blog_posts').update({ is_published: isPublished }).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async updateBlogCategory(id: string, category: Record<string, unknown>) {
    const { data, error } = await supabase.from('blog_categories').update(category).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return { data }
  },

  async deleteBlogPost(id: string) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async deleteBlogCategory(id: string) {
    const { error } = await supabase.from('blog_categories').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  async deleteBlogTag(id: string) {
    const { error } = await supabase.from('blog_tags').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── AI Insights ──
  async getAiInsights() {
    const { data, error } = await supabase.from('ai_insights').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return { data }
  },

  async clearAiInsights() {
    const { error } = await supabase.from('ai_insights').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw new Error(error.message)
    return { success: true }
  },

  // ── Marketing Dashboard ──
  async getMarketingDashboard() {
    const [campaignsRes, bannersRes, popupsRes, emailRes, reviewsRes, eventsRes] = await Promise.all([
      supabase.from('marketing_campaigns').select('*'),
      supabase.from('homepage_banners').select('*'),
      supabase.from('popup_announcements').select('*'),
      supabase.from('email_campaigns').select('*'),
      supabase.from('customer_reviews').select('*'),
      supabase.from('analytics_events').select('*').limit(100),
    ])
    return {
      campaigns: campaignsRes.data || [],
      banners: bannersRes.data || [],
      popups: popupsRes.data || [],
      emailCampaigns: emailRes.data || [],
      reviews: reviewsRes.data || [],
      events: eventsRes.data || [],
    }
  },

  // ── Reports ──
  async getReportBookings(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_bookings', { p_status: null })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getReportInvoices(_filters: FilterParams = {}) {
    const { data, error } = await supabase.rpc('get_all_invoices', { p_status: null })
    if (error) throw new Error(error.message)
    return { data }
  },

  async getReportTechnicianPerformance(_filters: FilterParams = {}) {
    const [techsRes, bookingsRes, reviewsRes, walletsRes] = await Promise.all([
      supabase.rpc('get_all_profiles', { p_role: 'technician' }),
      supabase.rpc('get_all_bookings', { p_status: null }),
      supabase.from('reviews').select('*'),
      supabase.from('technician_wallets').select('*'),
    ])
    if (techsRes.error) throw new Error(techsRes.error.message)
    return { data: techsRes.data, technicians: techsRes.data || [], bookings: bookingsRes.data || [], reviews: reviewsRes.data || [], wallets: walletsRes.data || [] }
  },
}
