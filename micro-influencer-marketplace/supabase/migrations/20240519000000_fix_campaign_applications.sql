-- Add brand_id column to campaign_applications table
ALTER TABLE campaign_applications
ADD COLUMN brand_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Update existing applications with brand_id from campaigns
UPDATE campaign_applications ca
SET brand_id = c.brand_id
FROM campaigns c
WHERE ca.campaign_id = c.id;

-- Make brand_id NOT NULL after populating existing records
ALTER TABLE campaign_applications
ALTER COLUMN brand_id SET NOT NULL;

-- Update RLS policies to include brand_id
DROP POLICY IF EXISTS "Users can view their own applications" ON campaign_applications;
CREATE POLICY "Users can view their own applications"
    ON campaign_applications FOR SELECT
    TO authenticated
    USING (
        influencer_id = auth.uid()::TEXT
        OR
        brand_id = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Brands can update applications for their campaigns" ON campaign_applications;
CREATE POLICY "Brands can update applications for their campaigns"
    ON campaign_applications FOR UPDATE
    TO authenticated
    USING (brand_id = auth.uid()::TEXT)
    WITH CHECK (brand_id = auth.uid()::TEXT); 