/*
# Technician Verification & Revenue System

## Overview
Implements a ₹50 verification fee, technician wallet, refund system (after 4 successful jobs), and revenue tracking for the VATTAMS Home Services platform.

## New Tables

1. **technician_wallets** - Per-technician wallet tracking balance, verification fee, and refund status
   - `technician_id` (uuid FK → profiles, unique)
   - `balance` (numeric, default 0) - current wallet balance
   - `verification_fee_paid` (boolean, default false)
   - `verification_fee_amount` (numeric, default 50)
   - `verification_fee_paid_at` (timestamptz, nullable)
   - `refund_status` (text, default 'not_eligible') - not_eligible/eligible/approved/rejected/processed/completed
   - `refund_amount` (numeric, default 50)
   - `refund_method` (text, nullable) - wallet/upi
   - `refund_processed_at` (timestamptz, nullable)
   - `refund_completed_at` (timestamptz, nullable)
   - `total_earnings` (numeric, default 0)
   - `pending_earnings` (numeric, default 0)
   - `total_jobs` (integer, default 0)
   - `completed_jobs` (integer, default 0)
   - `created_at`, `updated_at` (timestamptz)

2. **technician_documents** - Stores document references (Aadhaar, certificates, etc.)
   - `technician_id` (uuid FK → profiles)
   - `document_type` (text) - aadhaar/pan/license/certificate/photo
   - `document_url` (text) - storage URL
   - `document_number` (text, nullable) - masked reference number
   - `verified` (boolean, default false)
   - `created_at` (timestamptz)

3. **verification_payments** - Records of ₹50 verification fee payments
   - `technician_id` (uuid FK → profiles)
   - `amount` (numeric, default 50)
   - `payment_method` (text) - upi/card/wallet/cash
   - `payment_status` (text, default 'pending') - pending/completed/failed/refunded
   - `transaction_id` (text, nullable)
   - `payment_date` (timestamptz, nullable)
   - `created_at` (timestamptz)

4. **refunds** - Refund records for the ₹50 verification fee
   - `technician_id` (uuid FK → profiles)
   - `amount` (numeric, default 50)
   - `refund_type` (text) - verification_fee
   - `refund_method` (text, nullable) - wallet/upi
   - `status` (text, default 'pending') - pending/approved/rejected/processed/completed
   - `admin_id` (uuid FK → profiles, nullable)
   - `admin_notes` (text, nullable)
   - `processed_at` (timestamptz, nullable)
   - `completed_at` (timestamptz, nullable)
   - `created_at` (timestamptz)

5. **revenue_transactions** - Platform revenue tracking
   - `transaction_type` (text) - verification_fee/booking_commission/technician_payout/refund
   - `amount` (numeric)
   - `technician_id` (uuid FK → profiles, nullable)
   - `booking_id` (uuid FK → bookings, nullable)
   - `description` (text, nullable)
   - `created_at` (timestamptz)

## Modified Tables
- **profiles**: Added columns `rejection_reason` (text, nullable) and `verification_status` (text, default 'pending_registration')
  - verification_status values: pending_registration / fee_pending / under_review / approved / rejected / suspended

## Security
- RLS enabled on all new tables
- 4 CRUD policies per table (SELECT, INSERT, UPDATE, DELETE) scoped to authenticated users with auth.uid() ownership checks
- Admin users can read all technician-related data (wallets, documents, payments, refunds, revenue)

## Important Notes
1. The profiles.status column is updated to use the expanded verification_status values
2. Technician dashboard access requires verification_status = 'approved'
3. Refund eligibility: 4 completed jobs + no disputes + no fraud + not suspended
4. All monetary amounts in INR (₹)
*/

-- ============ PROFILES: Add new columns ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending_registration';

-- ============ TECHNICIAN_WALLETS ============
CREATE TABLE IF NOT EXISTS technician_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0,
  verification_fee_paid boolean DEFAULT false,
  verification_fee_amount numeric DEFAULT 50,
  verification_fee_paid_at timestamptz,
  refund_status text DEFAULT 'not_eligible',
  refund_amount numeric DEFAULT 50,
  refund_method text,
  refund_processed_at timestamptz,
  refund_completed_at timestamptz,
  total_earnings numeric DEFAULT 0,
  pending_earnings numeric DEFAULT 0,
  total_jobs integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(technician_id)
);

ALTER TABLE technician_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet" ON technician_wallets;
CREATE POLICY "select_own_wallet" ON technician_wallets FOR SELECT
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_own_wallet" ON technician_wallets;
CREATE POLICY "insert_own_wallet" ON technician_wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "update_own_wallet" ON technician_wallets;
CREATE POLICY "update_own_wallet" ON technician_wallets FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_own_wallet" ON technician_wallets;
CREATE POLICY "delete_own_wallet" ON technician_wallets FOR DELETE
  TO authenticated USING (auth.uid() = technician_id);

-- ============ TECHNICIAN_DOCUMENTS ============
CREATE TABLE IF NOT EXISTS technician_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  document_number text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE technician_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_documents" ON technician_documents;
CREATE POLICY "select_own_documents" ON technician_documents FOR SELECT
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_own_documents" ON technician_documents;
CREATE POLICY "insert_own_documents" ON technician_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "update_own_documents" ON technician_documents;
CREATE POLICY "update_own_documents" ON technician_documents FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_own_documents" ON technician_documents;
CREATE POLICY "delete_own_documents" ON technician_documents FOR DELETE
  TO authenticated USING (auth.uid() = technician_id);

-- ============ VERIFICATION_PAYMENTS ============
CREATE TABLE IF NOT EXISTS verification_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric DEFAULT 50,
  payment_method text DEFAULT 'upi',
  payment_status text DEFAULT 'pending',
  transaction_id text,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_verif_payment" ON verification_payments;
CREATE POLICY "select_own_verif_payment" ON verification_payments FOR SELECT
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_own_verif_payment" ON verification_payments;
CREATE POLICY "insert_own_verif_payment" ON verification_payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "update_own_verif_payment" ON verification_payments;
CREATE POLICY "update_own_verif_payment" ON verification_payments FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_own_verif_payment" ON verification_payments;
CREATE POLICY "delete_own_verif_payment" ON verification_payments FOR DELETE
  TO authenticated USING (auth.uid() = technician_id);

-- ============ REFUNDS ============
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric DEFAULT 50,
  refund_type text DEFAULT 'verification_fee',
  refund_method text,
  status text DEFAULT 'pending',
  admin_id uuid REFERENCES profiles(id),
  admin_notes text,
  processed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_refund" ON refunds;
CREATE POLICY "select_own_refund" ON refunds FOR SELECT
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_own_refund" ON refunds;
CREATE POLICY "insert_own_refund" ON refunds FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_own_refund" ON refunds;
CREATE POLICY "update_own_refund" ON refunds FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_own_refund" ON refunds;
CREATE POLICY "delete_own_refund" ON refunds FOR DELETE
  TO authenticated USING (auth.uid() = technician_id);

-- ============ REVENUE_TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  technician_id uuid REFERENCES profiles(id),
  booking_id uuid REFERENCES bookings(id),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_revenue" ON revenue_transactions;
CREATE POLICY "select_revenue" ON revenue_transactions FOR SELECT
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "insert_revenue" ON revenue_transactions;
CREATE POLICY "insert_revenue" ON revenue_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "update_revenue" ON revenue_transactions;
CREATE POLICY "update_revenue" ON revenue_transactions FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

DROP POLICY IF EXISTS "delete_revenue" ON revenue_transactions;
CREATE POLICY "delete_revenue" ON revenue_transactions FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_technician_wallets_tech ON technician_wallets(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_documents_tech ON technician_documents(technician_id);
CREATE INDEX IF NOT EXISTS idx_verification_payments_tech ON verification_payments(technician_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tech ON refunds(technician_id);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_type ON revenue_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_revenue_transactions_created ON revenue_transactions(created_at);

-- ============ AUTO-CREATE WALLET ON TECHNICIAN REGISTRATION ============
-- (handled in app code, but also a safety trigger)
CREATE OR REPLACE FUNCTION create_technician_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'technician' THEN
    INSERT INTO technician_wallets (technician_id)
    VALUES (NEW.id)
    ON CONFLICT (technician_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_wallet ON profiles;
CREATE TRIGGER trigger_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_technician_wallet();
