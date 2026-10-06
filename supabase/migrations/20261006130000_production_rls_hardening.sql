-- Production RLS hardening for Home Services
DROP POLICY IF EXISTS "public_select_bookings" ON bookings;
DROP POLICY IF EXISTS "public_update_bookings" ON bookings;
DROP POLICY IF EXISTS "public_delete_bookings" ON bookings;
DROP POLICY IF EXISTS "public_select_technicians" ON technicians;
DROP POLICY IF EXISTS "public_insert_technicians" ON technicians;
DROP POLICY IF EXISTS "public_update_technicians" ON technicians;
DROP POLICY IF EXISTS "public_delete_technicians" ON technicians;
DROP POLICY IF EXISTS "public_select_technician_jobs" ON technician_jobs;
DROP POLICY IF EXISTS "public_insert_technician_jobs" ON technician_jobs;
DROP POLICY IF EXISTS "public_update_technician_jobs" ON technician_jobs;
DROP POLICY IF EXISTS "public_delete_technician_jobs" ON technician_jobs;

CREATE POLICY "customer_insert_bookings" ON bookings FOR INSERT
TO anon, authenticated WITH CHECK (
  length(trim(customer_name)) BETWEEN 2 AND 120
  AND mobile_number ~ '^[0-9]{10}$'
  AND length(trim(city)) BETWEEN 2 AND 80
  AND length(trim(address)) BETWEEN 5 AND 500
);

CREATE POLICY "customer_select_own_bookings" ON bookings FOR SELECT
TO anon, authenticated USING (false);

CREATE POLICY "admin_manage_bookings" ON bookings FOR ALL
TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manage_technicians" ON technicians FOR ALL
TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_manage_technician_jobs" ON technician_jobs FOR ALL
TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
