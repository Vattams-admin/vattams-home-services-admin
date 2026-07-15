import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";

    if (req.method === "GET") {
      return await handleGet(supabase, action, url.searchParams);
    } else if (req.method === "POST") {
      const body = await req.json();
      return await handlePost(supabase, body);
    } else if (req.method === "PUT") {
      const body = await req.json();
      return await handlePut(supabase, action, body, url.searchParams);
    } else if (req.method === "DELETE") {
      return await handleDelete(supabase, action, url.searchParams);
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", details: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function now() {
  return new Date().toISOString();
}

// ─── GET handlers ─────────────────────────────────────────────────────────────

async function handleGet(supabase: any, action: string, params: URLSearchParams) {
  switch (action) {
    // ── Dashboard ──
    case "dashboard": {
      const [bookingsRes, techRes, custRes, notifRes, pendingTechRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*").eq("role", "technician").eq("status", "active"),
        supabase.from("profiles").select("*").eq("role", "customer"),
        supabase.from("notifications").select("*").eq("is_read", false).limit(20),
        supabase.from("profiles").select("*").eq("role", "technician").in("verification_status", ["pending_registration", "fee_pending", "under_review"]),
      ]);
      return json({ bookings: bookingsRes.data || [], technicians: techRes.data || [], customers: custRes.data || [], notifications: notifRes.data || [], pendingTechs: pendingTechRes.data || [] });
    }

    // ── Bookings (with optional joins + filters) ──
    case "bookings": {
      let q = supabase.from("bookings").select("*, customer:profiles!bookings_customer_id_fkey(id, name, mobile), technician:profiles!bookings_technician_id_fkey(id, name, mobile)");
      const status = params.get("status");
      const date = params.get("date");
      const techId = params.get("technician_id");
      const unassigned = params.get("unassigned");
      if (status && status !== "all") q = q.eq("status", status);
      if (date) q = q.eq("scheduled_date", date);
      if (techId) q = q.eq("technician_id", techId);
      if (unassigned === "true") q = q.is("technician_id", null);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Simple table getters ──
    case "customers": {
      const res = await supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "technicians": {
      let q = supabase.from("profiles").select("*").eq("role", "technician");
      const status = params.get("status");
      if (status && status !== "all") q = q.eq("verification_status", status);
      const available = params.get("available");
      if (available === "true") q = q.eq("is_available", true);
      if (available === "false") q = q.eq("is_available", false);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "pending-verifications": {
      let q = supabase.from("profiles").select("*").eq("role", "technician");
      const status = params.get("status");
      if (status && status !== "all") q = q.eq("verification_status", status);
      else q = q.in("verification_status", ["pending_registration", "fee_pending", "under_review"]);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "notifications": {
      const res = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      return json({ data: res.data || [] });
    }
    case "settings": {
      const res = await supabase.from("settings").select("*").limit(1).maybeSingle();
      return json({ data: res.data || null });
    }
    case "service-areas": {
      let q = supabase.from("service_areas").select("*");
      const city = params.get("city");
      const active = params.get("is_active");
      if (city) q = q.eq("city", city);
      if (active === "true") q = q.eq("is_active", true);
      if (active === "false") q = q.eq("is_active", false);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "coupons": {
      let q = supabase.from("coupons").select("*");
      const active = params.get("is_active");
      if (active === "true") q = q.eq("is_active", true);
      if (active === "false") q = q.eq("is_active", false);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Reviews (customer_reviews) ──
    case "reviews": {
      let q = supabase.from("customer_reviews").select("*");
      const approved = params.get("is_approved");
      const featured = params.get("is_featured");
      const rating = params.get("rating");
      if (approved === "true") q = q.eq("is_approved", true);
      if (approved === "false") q = q.eq("is_approved", false);
      if (featured === "true") q = q.eq("is_featured", true);
      if (rating) q = q.eq("rating", parseInt(rating));
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "review-stats": {
      const res = await supabase.from("customer_reviews").select("rating, is_approved, is_featured");
      return json({ data: res.data || [] });
    }

    // ── Invoices (with joins + optional status filter) ──
    case "invoices": {
      let q = supabase.from("invoices").select("*, customer:profiles!invoices_customer_id_fkey(id, name, mobile), technician:profiles!invoices_technician_id_fkey(id, name), booking:bookings!invoices_booking_id_fkey(id, booking_number, service_name, address, city, scheduled_date)");
      const status = params.get("status");
      if (status && status !== "all") q = q.eq("status", status);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Revenue transactions ──
    case "revenue": {
      let q = supabase.from("revenue_transactions").select("*");
      const startDate = params.get("start_date");
      if (startDate) q = q.gte("created_at", startDate);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Revenue page data (transactions + invoices) ──
    case "revenue-data": {
      const startDate = params.get("start_date");
      const [txnsRes, invoicesRes, allInvoicesRes] = await Promise.all([
        startDate
          ? supabase.from("revenue_transactions").select("*").gte("created_at", startDate).order("created_at", { ascending: false })
          : supabase.from("revenue_transactions").select("*").order("created_at", { ascending: false }),
        startDate
          ? supabase.from("invoices").select("amount, status, service_name, created_at").gte("created_at", startDate)
          : supabase.from("invoices").select("amount, status, service_name, created_at"),
        supabase.from("invoices").select("amount, status, service_name, created_at"),
      ]);
      return json({ transactions: txnsRes.data || [], invoices: invoicesRes.data || [], allInvoices: allInvoicesRes.data || [] });
    }

    // ── Audit logs (with filters) ──
    case "audit-logs": {
      let q = supabase.from("audit_logs").select("*");
      const actionFilter = params.get("action_filter");
      const userFilter = params.get("user_filter");
      const startDate = params.get("start_date");
      const endDate = params.get("end_date");
      if (actionFilter) q = q.ilike("action", actionFilter);
      if (userFilter) q = q.eq("user_id", userFilter);
      if (startDate) q = q.gte("created_at", startDate);
      if (endDate) q = q.lte("created_at", endDate);
      const res = await q.order("created_at", { ascending: false }).limit(500);
      return json({ data: res.data || [] });
    }

    // ── Referrals ──
    case "referrals": {
      let q = supabase.from("referrals").select("*");
      const status = params.get("status");
      if (status && status !== "all") q = q.eq("reward_status", status);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "referral-stats": {
      const res = await supabase.from("referrals").select("reward_status, reward_amount");
      return json({ data: res.data || [] });
    }

    // ── Technician details (bookings, reviews, wallet, documents, payments) ──
    case "technician-bookings": {
      const techId = params.get("technician_id");
      const res = await supabase.from("bookings").select("*").eq("technician_id", techId).order("created_at", { ascending: false }).limit(10);
      return json({ data: res.data || [] });
    }
    case "technician-reviews": {
      const techId = params.get("technician_id");
      const res = await supabase.from("reviews").select("*").eq("technician_id", techId).order("created_at", { ascending: false }).limit(5);
      return json({ data: res.data || [] });
    }
    case "technician-wallet": {
      const techId = params.get("technician_id");
      const res = await supabase.from("technician_wallets").select("*").eq("technician_id", techId).maybeSingle();
      return json({ data: res.data || null });
    }
    case "technician-documents": {
      const techId = params.get("technician_id");
      const res = await supabase.from("technician_documents").select("*").eq("technician_id", techId).order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "technician-verification-payments": {
      const techId = params.get("technician_id");
      const res = await supabase.from("verification_payments").select("*").eq("technician_id", techId).order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Technician stats (batch for list page) ──
    case "technician-stats": {
      // Expects technician_ids as comma-separated param
      const idsParam = params.get("technician_ids") || "";
      const ids = idsParam ? idsParam.split(",") : [];
      if (ids.length === 0) return json({ bookings: [], reviews: [], wallets: [] });
      const [bookingsRes, reviewsRes, walletsRes] = await Promise.all([
        supabase.from("bookings").select("technician_id, status").in("technician_id", ids),
        supabase.from("reviews").select("technician_id, rating").in("technician_id", ids),
        supabase.from("technician_wallets").select("technician_id, total_earnings, total_jobs, completed_jobs").in("technician_id", ids),
      ]);
      return json({ bookings: bookingsRes.data || [], reviews: reviewsRes.data || [], wallets: walletsRes.data || [] });
    }

    // ── Customer details (bookings, invoices, notes) ──
    case "customer-bookings": {
      const customerId = params.get("customer_id");
      const res = await supabase.from("bookings").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "customer-invoices": {
      const customerId = params.get("customer_id");
      const res = await supabase.from("invoices").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "customer-notes": {
      const customerId = params.get("customer_id");
      const res = await supabase.from("customer_notes").select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Customer stats (for list page) ──
    case "customer-stats": {
      const [bookingsRes, invoicesRes] = await Promise.all([
        supabase.from("bookings").select("customer_id, amount, status"),
        supabase.from("invoices").select("customer_id, amount, status").eq("status", "paid"),
      ]);
      return json({ bookings: bookingsRes.data || [], invoices: invoicesRes.data || [] });
    }

    // ── All profiles (for dropdowns / lookups) ──
    case "profiles": {
      let q = supabase.from("profiles").select("*");
      const role = params.get("role");
      if (role) q = q.eq("role", role);
      const res = await q.order("name", { ascending: true });
      return json({ data: res.data || [] });
    }
    case "profiles-minimal": {
      let q = supabase.from("profiles").select("id, name, mobile, role");
      const role = params.get("role");
      if (role) q = q.eq("role", role);
      const res = await q.order("name", { ascending: true });
      return json({ data: res.data || [] });
    }

    // ── CRM tables ──
    case "crm-notes": {
      const res = await supabase.from("customer_notes").select("*, customer:profiles!customer_notes_customer_id_fkey(id, name, mobile)").order("created_at", { ascending: false }).limit(50);
      return json({ data: res.data || [] });
    }
    case "crm-followups": {
      const res = await supabase.from("customer_followups").select("*, customer:profiles!customer_followups_customer_id_fkey(id, name, mobile)").order("created_at", { ascending: false }).limit(50);
      return json({ data: res.data || [] });
    }
    case "crm-complaints": {
      const res = await supabase.from("customer_complaints").select("*, customer:profiles!customer_complaints_customer_id_fkey(id, name, mobile)").order("created_at", { ascending: false }).limit(50);
      return json({ data: res.data || [] });
    }
    case "crm-reminders": {
      const res = await supabase.from("service_reminders").select("*, customer:profiles!service_reminders_customer_id_fkey(id, name, mobile)").order("created_at", { ascending: false }).limit(50);
      return json({ data: res.data || [] });
    }

    // ── Marketing ──
    case "marketing-campaigns": {
      const res = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "homepage-banners": {
      const res = await supabase.from("homepage_banners").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "popup-announcements": {
      const res = await supabase.from("popup_announcements").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Google Business ──
    case "google-business-profile": {
      const res = await supabase.from("google_business_profiles").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return json({ data: res.data || null });
    }

    // ── Analytics ──
    case "analytics-events": {
      let q = supabase.from("analytics_events").select("*");
      const startDate = params.get("start_date");
      const endDate = params.get("end_date");
      const category = params.get("category");
      if (startDate) q = q.gte("created_at", startDate);
      if (endDate) q = q.lte("created_at", endDate);
      if (category && category !== "all") q = q.eq("event_category", category);
      const res = await q.order("created_at", { ascending: false }).limit(1000);
      return json({ data: res.data || [] });
    }
    case "analytics-settings": {
      const res = await supabase.from("analytics_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return json({ data: res.data || null });
    }

    // ── Email Marketing ──
    case "email-campaigns": {
      const res = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "email-templates": {
      const res = await supabase.from("email_templates").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }

    // ── Blog CMS ──
    case "blog-posts": {
      const res = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "blog-categories": {
      const res = await supabase.from("blog_categories").select("*").order("name", { ascending: true });
      return json({ data: res.data || [] });
    }
    case "blog-tags": {
      const res = await supabase.from("blog_tags").select("*").order("name", { ascending: true });
      return json({ data: res.data || [] });
    }

    // ── AI Insights ──
    case "ai-insights": {
      const res = await supabase.from("ai_insights").select("*").order("created_at", { ascending: false }).limit(50);
      return json({ data: res.data || [] });
    }

    // ── Marketing Dashboard (combined) ──
    case "marketing-dashboard": {
      const [campaignsRes, emailCampaignsRes, reviewsRes, eventsRes, bannersRes] = await Promise.all([
        supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("customer_reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("homepage_banners").select("*").order("created_at", { ascending: false }),
      ]);
      return json({
        campaigns: campaignsRes.data || [],
        emailCampaigns: emailCampaignsRes.data || [],
        reviews: reviewsRes.data || [],
        events: eventsRes.data || [],
        banners: bannersRes.data || [],
      });
    }

    // ── Reports ──
    case "report-bookings": {
      let q = supabase.from("bookings").select("*");
      const startDate = params.get("start_date");
      const endDate = params.get("end_date");
      if (startDate) q = q.gte("created_at", startDate);
      if (endDate) q = q.lte("created_at", endDate);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "report-invoices": {
      let q = supabase.from("invoices").select("*");
      const startDate = params.get("start_date");
      const endDate = params.get("end_date");
      if (startDate) q = q.gte("created_at", startDate);
      if (endDate) q = q.lte("created_at", endDate);
      const res = await q.order("created_at", { ascending: false });
      return json({ data: res.data || [] });
    }
    case "report-technician-performance": {
      const startDate = params.get("start_date");
      const endDate = params.get("end_date");
      const [techsRes, bookingsRes, reviewsRes, walletsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "technician").order("name", { ascending: true }),
        supabase.from("bookings").select("technician_id, status, amount"),
        supabase.from("reviews").select("technician_id, rating"),
        supabase.from("technician_wallets").select("technician_id, total_earnings"),
      ]);
      // Filter bookings by date range client-side since we fetched all
      let allBookings = bookingsRes.data || [];
      if (startDate || endDate) {
        allBookings = allBookings.filter((b: any) => {
          const d = new Date(b.created_at);
          if (startDate && d < new Date(startDate)) return false;
          if (endDate && d > new Date(endDate)) return false;
          return true;
        });
      }
      return json({ technicians: techsRes.data || [], bookings: allBookings, reviews: reviewsRes.data || [], wallets: walletsRes.data || [] });
    }

    // ── Booking detail (single booking + invoice) ──
    case "booking-invoice": {
      const bookingId = params.get("booking_id");
      const res = await supabase.from("invoices").select("id, invoice_number, status").eq("booking_id", bookingId).maybeSingle();
      return json({ data: res.data || null });
    }
    case "booking-detail": {
      const bookingId = params.get("booking_id");
      const res = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
      return json({ data: res.data || null });
    }

    // ── Settings (UPI only for invoice download) ──
    case "settings-upi": {
      const res = await supabase.from("settings").select("upi_id").maybeSingle();
      return json({ data: res.data || null });
    }

    // ── Users for notification sending ──
    case "notification-recipients": {
      const recipientType = params.get("recipient_type") || "all";
      let q = supabase.from("profiles").select("id");
      if (recipientType === "all") q = q.in("role", ["customer", "technician"]);
      else if (recipientType === "customers") q = q.eq("role", "customer");
      else if (recipientType === "technicians") q = q.eq("role", "technician").eq("verification_status", "approved");
      else if (recipientType === "broadcast") q = q.in("role", ["customer", "technician", "admin", "super_admin"]);
      const res = await q;
      return json({ data: res.data || [] });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

// ─── POST handlers ────────────────────────────────────────────────────────────

async function handlePost(supabase: any, body: any) {
  const { action } = body;
  switch (action) {
    // ── Booking mutations ──
    case "update-booking-status": {
      const res = await supabase.from("bookings").update({ status: body.status, updated_at: now() }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "assign-technician": {
      const res = await supabase.from("bookings").update({ technician_id: body.technician_id, status: "assigned", updated_at: now() }).eq("id", body.booking_id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Technician verification mutations ──
    case "approve-technician": {
      const res = await supabase.from("profiles").update({ verification_status: "approved", status: "active", rejection_reason: null }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "reject-technician": {
      const res = await supabase.from("profiles").update({ verification_status: "rejected", status: "inactive", rejection_reason: body.reason || null }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "move-to-review": {
      const res = await supabase.from("profiles").update({ verification_status: "under_review" }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "suspend-technician": {
      const res = await supabase.from("profiles").update({ verification_status: "suspended", status: "inactive", is_available: false }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Settings ──
    case "update-settings": {
      const { id, ...updates } = body;
      if (id) {
        const res = await supabase.from("settings").update({ ...updates, updated_at: now() }).eq("id", id);
        if (res.error) return json({ error: res.error.message }, 400);
      } else {
        const res = await supabase.from("settings").insert({ ...updates, updated_at: now() }).select("id").single();
        if (res.error) return json({ error: res.error.message }, 400);
        return json({ success: true, id: res.data?.id });
      }
      return json({ success: true });
    }

    // ── Notifications ──
    case "create-notification": {
      const res = await supabase.from("notifications").insert(body.notification);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "send-notifications": {
      // body.notifications = array of notification objects
      const res = await supabase.from("notifications").insert(body.notifications);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true, count: body.notifications.length });
    }

    // ── Audit log ──
    case "create-audit-log": {
      const res = await supabase.from("audit_logs").insert({
        user_id: body.user_id || "admin",
        action: body.action,
        entity_type: body.entity_type,
        entity_id: body.entity_id || null,
        details: body.details || null,
      });
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Coupons ──
    case "create-coupon": {
      const res = await supabase.from("coupons").insert(body.coupon);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Service Areas ──
    case "create-service-area": {
      const res = await supabase.from("service_areas").insert(body.area);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Reviews ──
    case "approve-review": {
      const res = await supabase.from("customer_reviews").update({ is_approved: true }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "reject-review": {
      const res = await supabase.from("customer_reviews").update({ is_approved: false }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-feature-review": {
      const res = await supabase.from("customer_reviews").update({ is_featured: body.is_featured }).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Invoice status ──
    case "update-invoice-status": {
      const updateData: any = { status: body.status, updated_at: now() };
      if (body.status === "paid") updateData.paid_at = now();
      const res = await supabase.from("invoices").update(updateData).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Referral ──
    case "update-referral-status": {
      const updateData: any = { reward_status: body.status, updated_at: now() };
      if (body.status === "completed") updateData.completed_at = now();
      const res = await supabase.from("referrals").update(updateData).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── CRM mutations ──
    case "create-customer-note": {
      const res = await supabase.from("customer_notes").insert(body.note);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-customer-followup": {
      const res = await supabase.from("customer_followups").insert(body.followup);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-service-reminder": {
      const res = await supabase.from("service_reminders").insert(body.reminder);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-customer-complaint": {
      const res = await supabase.from("customer_complaints").insert(body.complaint);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-followup-status": {
      const updateData: any = { status: body.status };
      if (body.status === "completed") updateData.completed_at = now();
      const res = await supabase.from("customer_followups").update(updateData).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-complaint-status": {
      const updateData: any = { status: body.status };
      if (body.status === "resolved") updateData.resolved_at = now();
      const res = await supabase.from("customer_complaints").update(updateData).eq("id", body.id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Marketing mutations ──
    case "create-marketing-campaign": {
      const res = await supabase.from("marketing_campaigns").insert(body.campaign);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-homepage-banner": {
      const res = await supabase.from("homepage_banners").insert(body.banner);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-popup-announcement": {
      const res = await supabase.from("popup_announcements").insert(body.popup);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Google Business ──
    case "create-google-business-profile": {
      const res = await supabase.from("google_business_profiles").insert(body.profile);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true, data: res.data });
    }

    // ── Email Marketing ──
    case "create-email-campaign": {
      const res = await supabase.from("email_campaigns").insert(body.campaign);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-email-template": {
      const res = await supabase.from("email_templates").insert(body.template);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Blog CMS ──
    case "create-blog-post": {
      const res = await supabase.from("blog_posts").insert(body.post);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-blog-category": {
      const res = await supabase.from("blog_categories").insert(body.category);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "create-blog-tag": {
      const res = await supabase.from("blog_tags").insert(body.tag);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── AI Insights ──
    case "clear-ai-insights": {
      const res = await supabase.from("ai_insights").delete().neq("id", "");
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

// ─── PUT handlers ─────────────────────────────────────────────────────────────

async function handlePut(supabase: any, action: string, body: any, params: URLSearchParams) {
  const id = params.get("id");
  switch (action) {
    // ── Service Areas ──
    case "update-service-area": {
      const res = await supabase.from("service_areas").update({ ...body, updated_at: now() }).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-service-area": {
      const res = await supabase.from("service_areas").update({ is_active: body.is_active, updated_at: now() }).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Coupons ──
    case "update-coupon": {
      const res = await supabase.from("coupons").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-coupon": {
      const res = await supabase.from("coupons").update({ is_active: body.is_active }).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Marketing ──
    case "update-marketing-campaign": {
      const res = await supabase.from("marketing_campaigns").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-homepage-banner": {
      const res = await supabase.from("homepage_banners").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-homepage-banner": {
      const res = await supabase.from("homepage_banners").update({ is_active: body.is_active }).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-popup-announcement": {
      const res = await supabase.from("popup_announcements").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-popup-announcement": {
      const res = await supabase.from("popup_announcements").update({ is_active: body.is_active }).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Google Business ──
    case "update-google-business-profile": {
      const res = await supabase.from("google_business_profiles").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Email Marketing ──
    case "update-email-campaign": {
      const res = await supabase.from("email_campaigns").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-email-template": {
      const res = await supabase.from("email_templates").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    // ── Blog CMS ──
    case "update-blog-post": {
      const res = await supabase.from("blog_posts").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "toggle-blog-post-publish": {
      const updateData: any = { is_published: body.is_published, updated_at: now() };
      if (body.is_published) updateData.published_at = now();
      const res = await supabase.from("blog_posts").update(updateData).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "update-blog-category": {
      const res = await supabase.from("blog_categories").update(body).eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }

    default:
      return json({ error: "Unknown action" }, 400);
  }
}

// ─── DELETE handlers ───────────────────────────────────────────────────────────

async function handleDelete(supabase: any, action: string, params: URLSearchParams) {
  const id = params.get("id");
  switch (action) {
    case "delete-service-area": {
      const res = await supabase.from("service_areas").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-coupon": {
      const res = await supabase.from("coupons").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-marketing-campaign": {
      const res = await supabase.from("marketing_campaigns").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-homepage-banner": {
      const res = await supabase.from("homepage_banners").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-popup-announcement": {
      const res = await supabase.from("popup_announcements").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-email-campaign": {
      const res = await supabase.from("email_campaigns").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-email-template": {
      const res = await supabase.from("email_templates").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-blog-post": {
      const res = await supabase.from("blog_posts").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-blog-category": {
      const res = await supabase.from("blog_categories").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    case "delete-blog-tag": {
      const res = await supabase.from("blog_tags").delete().eq("id", id);
      if (res.error) return json({ error: res.error.message }, 400);
      return json({ success: true });
    }
    default:
      return json({ error: "Unknown action" }, 400);
  }
}
