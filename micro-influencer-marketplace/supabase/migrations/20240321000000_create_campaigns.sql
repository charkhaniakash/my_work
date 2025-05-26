-- Create campaigns table
CREATE TABLE campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    target_location TEXT,
    target_niche TEXT[] NOT NULL DEFAULT '{}',
    requirements TEXT,
    deliverables TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for all users"
    ON campaigns FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON campaigns FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for users based on brand_id"
    ON campaigns FOR UPDATE
    TO authenticated
    USING (brand_id = auth.uid()::TEXT)
    WITH CHECK (brand_id = auth.uid()::TEXT);

CREATE POLICY "Enable delete for users based on brand_id"
    ON campaigns FOR DELETE
    TO authenticated
    USING (brand_id = auth.uid()::TEXT);

-- Create campaign_applications table
CREATE TABLE campaign_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    influencer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    brand_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'approved_and_paid')),
    pitch TEXT NOT NULL,
    proposed_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for campaign_applications
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_applications
CREATE POLICY "Enable read access for all users"
    ON campaign_applications FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON campaign_applications FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for users based on brand_id"
    ON campaign_applications FOR UPDATE
    TO authenticated
    USING (brand_id = auth.uid()::TEXT)
    WITH CHECK (brand_id = auth.uid()::TEXT);

CREATE POLICY "Enable delete for users based on brand_id"
    ON campaign_applications FOR DELETE
    TO authenticated
    USING (brand_id = auth.uid()::TEXT);

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
