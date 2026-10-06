-- Service catalog is public-read only. Mutations require an authenticated admin session.
DROP POLICY IF EXISTS "admin_insert_service_categories" ON service_categories;
DROP POLICY IF EXISTS "admin_update_service_categories" ON service_categories;
DROP POLICY IF EXISTS "admin_delete_service_categories" ON service_categories;

CREATE POLICY "admin_insert_service_categories" ON service_categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_update_service_categories" ON service_categories FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_delete_service_categories" ON service_categories FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);
