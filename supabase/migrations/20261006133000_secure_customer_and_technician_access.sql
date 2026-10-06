-- Secure post-RLS access paths for customers and technicians.
-- Customer tracking requires both booking number and registered mobile.
-- Technician portal requires registered mobile + submitted UTR and active status.

CREATE OR REPLACE FUNCTION get_customer_booking(
  p_booking_number text,
  p_mobile text
)
RETURNS TABLE (
  id uuid,
  booking_number text,
  service_category text,
  city text,
  preferred_date date,
  preferred_time text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.booking_number,
    b.service_category,
    b.city,
    b.preferred_date,
    b.preferred_time,
    b.status,
    b.created_at
  FROM bookings b
  WHERE b.booking_number = upper(trim(p_booking_number))
    AND b.mobile_number = regexp_replace(trim(p_mobile), '[^0-9]', '', 'g')
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION get_customer_booking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_customer_booking(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION authenticate_technician(
  p_mobile text,
  p_utr text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  mobile text,
  email text,
  city text,
  specializations text[],
  experience_years int,
  status text,
  rating numeric,
  total_jobs int,
  earnings numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.full_name,
    t.mobile,
    t.email,
    t.city,
    t.specializations,
    t.experience_years,
    t.status,
    t.rating,
    t.total_jobs,
    t.earnings
  FROM technicians t
  WHERE t.mobile = regexp_replace(trim(p_mobile), '[^0-9]', '', 'g')
    AND lower(trim(t.join_fee_utr)) = lower(trim(p_utr))
    AND t.join_fee_status = 'verified'
    AND t.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION authenticate_technician(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authenticate_technician(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_technician_jobs(
  p_mobile text,
  p_utr text
)
RETURNS TABLE (
  id uuid,
  booking_id uuid,
  technician_id uuid,
  status text,
  notes text,
  service_photo_urls text[],
  customer_signature text,
  job_amount numeric,
  assigned_at timestamptz,
  completed_at timestamptz,
  booking_number text,
  customer_name text,
  mobile_number text,
  city text,
  address text,
  service_category text,
  problem_description text,
  preferred_date date,
  preferred_time text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.booking_id,
    j.technician_id,
    j.status,
    j.notes,
    j.service_photo_urls,
    j.customer_signature,
    j.job_amount,
    j.assigned_at,
    j.completed_at,
    b.booking_number,
    b.customer_name,
    b.mobile_number,
    b.city,
    b.address,
    b.service_category,
    b.problem_description,
    b.preferred_date,
    b.preferred_time
  FROM technician_jobs j
  JOIN technicians t ON t.id = j.technician_id
  JOIN bookings b ON b.id = j.booking_id
  WHERE t.mobile = regexp_replace(trim(p_mobile), '[^0-9]', '', 'g')
    AND lower(trim(t.join_fee_utr)) = lower(trim(p_utr))
    AND t.join_fee_status = 'verified'
    AND t.status = 'active'
    AND j.technician_id = t.id
  ORDER BY j.assigned_at DESC;
$$;

REVOKE ALL ON FUNCTION get_technician_jobs(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_technician_jobs(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION update_technician_job_status(
  p_mobile text,
  p_utr text,
  p_job_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_technician_id uuid;
BEGIN
  IF p_status NOT IN ('accepted', 'in_progress', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid job status';
  END IF;

  SELECT t.id INTO v_technician_id
  FROM technicians t
  WHERE t.mobile = regexp_replace(trim(p_mobile), '[^0-9]', '', 'g')
    AND lower(trim(t.join_fee_utr)) = lower(trim(p_utr))
    AND t.join_fee_status = 'verified'
    AND t.status = 'active'
  LIMIT 1;

  IF v_technician_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE technician_jobs
  SET
    status = p_status,
    completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE completed_at END
  WHERE id = p_job_id
    AND technician_id = v_technician_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION update_technician_job_status(text, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_technician_job_status(text, text, uuid, text) TO anon, authenticated;
