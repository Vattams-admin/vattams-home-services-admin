-- Production hardening: prevent bypassing the ₹49 technician application flow
DROP POLICY IF EXISTS "public_insert_technicians" ON technicians;
DROP POLICY IF EXISTS "public_update_technicians" ON technicians;
DROP POLICY IF EXISTS "public_delete_technicians" ON technicians;
