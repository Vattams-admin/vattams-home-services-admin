/*
# Add UPDATE policy for reviews table

1. Security Changes
- Add policy allowing customers to update their own reviews.
- This is needed for the ReviewPage edit functionality where customers
  can modify their existing review (rating + text) for a completed booking.
- Ownership check: auth.uid() = customer_id
*/

DROP POLICY IF EXISTS "reviews_customer_update" ON reviews;
CREATE POLICY "reviews_customer_update"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);
