/*
# Create hash_admin_pin RPC function

1. New Functions
- `hash_admin_pin(input_pin text)` — hashes a 6-digit PIN using bcrypt (via pgcrypto) and returns the hash string.
- This is used by the admin-change-pin edge function to securely update the admin PIN.

2. Security
- The function is SECURITY DEFINER so it can access the `extensions` schema where `crypt` lives.
- It only hashes input and returns a string — it does not read or modify any table.
- It validates that input_pin is exactly 6 digits before hashing.

3. Dependencies
- Requires the `pgcrypto` extension (already enabled).
*/

CREATE OR REPLACE FUNCTION public.hash_admin_pin(input_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  hashed text;
BEGIN
  IF input_pin IS NULL OR input_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;

  hashed := extensions.crypt(input_pin, extensions.gen_salt('bf', 6));
  RETURN hashed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hash_admin_pin(text) TO authenticated, anon;
