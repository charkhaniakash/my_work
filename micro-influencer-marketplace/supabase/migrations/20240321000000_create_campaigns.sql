-- Create campaigns table
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    target_location TEXT,
    target_niche TEXT[] NOT NULL DEFAULT '{}',
    requirements TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create campaign applications table
CREATE TABLE campaign_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    pitch TEXT NOT NULL,
    proposed_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can create campaigns"
    ON campaigns FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = brand_id AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'brand'
        )
    );

CREATE POLICY "Everyone can view active campaigns"
    ON campaigns FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY "Brands can view their own campaigns"
    ON campaigns FOR SELECT
    TO authenticated
    USING (auth.uid() = brand_id);

CREATE POLICY "Brands can update their own campaigns"
    ON campaigns FOR UPDATE
    TO authenticated
    USING (brand_id = auth.uid())
    WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Brands can delete their own campaigns"
    ON campaigns FOR DELETE
    TO authenticated
    USING (brand_id = auth.uid());

-- Add RLS policies for campaign applications
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers can create applications"
    ON campaign_applications FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'influencer'
        )
    );

CREATE POLICY "Users can view their own applications"
    ON campaign_applications FOR SELECT
    TO authenticated
    USING (
        influencer_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_applications.campaign_id
            AND campaigns.brand_id = auth.uid()
        )
    );

CREATE POLICY "Brands can update applications for their campaigns"
    ON campaign_applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_applications.campaign_id
            AND campaigns.brand_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = campaign_applications.campaign_id
            AND campaigns.brand_id = auth.uid()
        )
    );

-- Create updated_at triggers
CREATE TRIGGER set_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_campaign_applications_updated_at
    BEFORE UPDATE ON campaign_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    TO authenticated
    USING (
        auth.uid() = sender_id
        OR
        auth.uid() = receiver_id
    );

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id);

-- Create updated_at trigger for messages
CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 