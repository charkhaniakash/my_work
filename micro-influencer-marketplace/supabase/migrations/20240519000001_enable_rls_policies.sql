-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Allow anon access for initial table reads
CREATE POLICY "Allow anon read access to users" ON users
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon read access to campaigns" ON campaigns
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon read access to campaign_applications" ON campaign_applications
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon read access to campaign_files" ON campaign_files
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon read access to deliverable_tasks" ON deliverable_tasks
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anon read access to campaign_templates" ON campaign_templates
    FOR SELECT TO anon
    USING (true);

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid()::TEXT = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid()::TEXT = id);

-- Campaigns table policies
DROP POLICY IF EXISTS "Brands can create campaigns" ON campaigns;
CREATE POLICY "Brands can create campaigns"
    ON campaigns FOR INSERT
    WITH CHECK (
        auth.uid()::TEXT = brand_id AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::TEXT
            AND users.role = 'brand'
        )
    );

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

DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
CREATE POLICY "Brands can update their own campaigns"
    ON campaigns FOR UPDATE
    USING (auth.uid()::TEXT = brand_id)
    WITH CHECK (auth.uid()::TEXT = brand_id);

DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
CREATE POLICY "Brands can delete their own campaigns"
    ON campaigns FOR DELETE
    USING (auth.uid()::TEXT = brand_id);

-- Campaign applications policies
DROP POLICY IF EXISTS "Users can view their own applications" ON campaign_applications;
CREATE POLICY "Users can view their own applications"
    ON campaign_applications FOR SELECT
    USING (
        influencer_id = auth.uid()::TEXT OR
        brand_id = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Influencers can create applications" ON campaign_applications;
CREATE POLICY "Influencers can create applications"
    ON campaign_applications FOR INSERT
    WITH CHECK (
        influencer_id = auth.uid()::TEXT AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()::TEXT
            AND users.role = 'influencer'
        )
    );

DROP POLICY IF EXISTS "Brands can update applications for their campaigns" ON campaign_applications;
CREATE POLICY "Brands can update applications for their campaigns"
    ON campaign_applications FOR UPDATE
    USING (brand_id = auth.uid()::TEXT)
    WITH CHECK (brand_id = auth.uid()::TEXT);

-- Campaign files policies
DROP POLICY IF EXISTS "Campaign participants can view files" ON campaign_files;
CREATE POLICY "Campaign participants can view files"
    ON campaign_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_files.campaign_id
            AND (
                campaigns.brand_id = auth.uid()::TEXT OR
                EXISTS (
                    SELECT 1 FROM campaign_applications
                    WHERE campaign_applications.campaign_id = campaigns.id
                    AND campaign_applications.influencer_id = auth.uid()::TEXT
                    AND campaign_applications.status = 'accepted'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Campaign participants can upload files" ON campaign_files;
CREATE POLICY "Campaign participants can upload files"
    ON campaign_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_files.campaign_id
            AND (
                campaigns.brand_id = auth.uid()::TEXT OR
                EXISTS (
                    SELECT 1 FROM campaign_applications
                    WHERE campaign_applications.campaign_id = campaigns.id
                    AND campaign_applications.influencer_id = auth.uid()::TEXT
                    AND campaign_applications.status = 'accepted'
                )
            )
        )
    );

-- Deliverable tasks policies
DROP POLICY IF EXISTS "Campaign participants can view tasks" ON deliverable_tasks;
CREATE POLICY "Campaign participants can view tasks"
    ON deliverable_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = deliverable_tasks.campaign_id
            AND (
                campaigns.brand_id = auth.uid()::TEXT OR
                EXISTS (
                    SELECT 1 FROM campaign_applications
                    WHERE campaign_applications.campaign_id = campaigns.id
                    AND campaign_applications.influencer_id = auth.uid()::TEXT
                    AND campaign_applications.status = 'accepted'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Campaign participants can manage tasks" ON deliverable_tasks;
CREATE POLICY "Campaign participants can manage tasks"
    ON deliverable_tasks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = deliverable_tasks.campaign_id
            AND (
                campaigns.brand_id = auth.uid()::TEXT OR
                EXISTS (
                    SELECT 1 FROM campaign_applications
                    WHERE campaign_applications.campaign_id = campaigns.id
                    AND campaign_applications.influencer_id = auth.uid()::TEXT
                    AND campaign_applications.status = 'accepted'
                )
            )
        )
    );

-- Campaign templates policies
DROP POLICY IF EXISTS "Brands can manage their own templates" ON campaign_templates;
CREATE POLICY "Brands can manage their own templates"
    ON campaign_templates FOR ALL
    USING (brand_id = auth.uid()::TEXT); 