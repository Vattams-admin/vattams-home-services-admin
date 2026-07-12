-- Fix: handle_new_user trigger should also create auth.identities record
-- This prevents "Database error querying schema" on login for users created via direct SQL insert

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  -- Insert profile, ignoring duplicates
  INSERT INTO public.profiles (id, email, name, full_name, mobile, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Ensure auth.identities record exists (required for login in newer Supabase versions)
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    NEW.email,
    NEW.id,
    jsonb_build_object('sub', NEW.id, 'email', NEW.email),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
