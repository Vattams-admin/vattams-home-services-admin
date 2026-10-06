-- VATTAMS Home Services: technician joining fee enforcement
ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS join_fee_amount numeric(10,2) NOT NULL DEFAULT 49,
  ADD COLUMN IF NOT EXISTS join_fee_utr text,
  ADD COLUMN IF NOT EXISTS join_fee_status text NOT NULL DEFAULT 'unpaid'
    CHECK (join_fee_status IN ('unpaid','pending','verified','rejected'));

CREATE OR REPLACE FUNCTION submit_technician_application(
  p_full_name text,
  p_mobile text,
  p_email text,
  p_city text,
  p_specializations text[],
  p_experience_years integer,
  p_id_proof_type text,
  p_id_proof_number text,
  p_utr text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  clean_utr text := regexp_replace(coalesce(p_utr, ''), '\s+', '', 'g');
BEGIN
  IF length(trim(coalesce(p_full_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_mobile !~ '^[0-9]{10}$' THEN
    RAISE EXCEPTION 'Invalid mobile number';
  END IF;
  IF coalesce(array_length(p_specializations, 1), 0) < 1 THEN
    RAISE EXCEPTION 'At least one specialization is required';
  END IF;
  IF clean_utr !~ '^[A-Za-z0-9]{8,32}$' THEN
    RAISE EXCEPTION 'Invalid UPI transaction ID / UTR';
  END IF;
  IF EXISTS (SELECT 1 FROM technicians WHERE mobile = p_mobile) THEN
    RAISE EXCEPTION 'A technician application already exists for this mobile number';
  END IF;

  INSERT INTO technicians (
    full_name, mobile, email, city, specializations, experience_years,
    id_proof_type, id_proof_number, status,
    join_fee_amount, join_fee_utr, join_fee_status
  )
  VALUES (
    trim(p_full_name), p_mobile, nullif(trim(coalesce(p_email, '')), ''),
    trim(p_city), p_specializations, greatest(coalesce(p_experience_years, 0), 0),
    nullif(trim(coalesce(p_id_proof_type, '')), ''),
    nullif(trim(coalesce(p_id_proof_number, '')), ''),
    'pending', 49, clean_utr, 'pending'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_technician_application(text,text,text,text,text[],integer,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_technician_application(text,text,text,text,text[],integer,text,text,text) TO anon, authenticated;
