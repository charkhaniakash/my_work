-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable read access for all users" ON campaigns;

-- Recreate the restrictive policy to ensure it's properly applied
DROP POLICY IF EXISTS "Brands can view their own campaigns" ON campaigns;
CREATE POLICY "Brands can view their own campaigns"
    ON campaigns FOR SELECT
    USING (
        auth.uid()::TEXT = brand_id OR
        EXISTS (
            SELECT 1 FROM campaign_applications
            WHERE campaign_applications.campaign_id = campaigns.id
            AND campaign_applications.influencer_id = auth.uid()::TEXT
        )
    ); 