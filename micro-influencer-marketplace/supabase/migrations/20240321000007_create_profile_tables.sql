-- Create social_media_links table
CREATE TABLE social_media_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    username TEXT NOT NULL,
    followers_count INTEGER,
    engagement_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Create portfolio_items table
CREATE TABLE portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_analytics table
CREATE TABLE influencer_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_followers INTEGER NOT NULL DEFAULT 0,
    total_engagement INTEGER NOT NULL DEFAULT 0,
    total_reach INTEGER NOT NULL DEFAULT 0,
    total_impressions INTEGER NOT NULL DEFAULT 0,
    average_engagement_rate DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Add RLS policies
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_analytics ENABLE ROW LEVEL SECURITY;

-- Social media links policies
CREATE POLICY "Users can view any social media links"
    ON social_media_links FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own social media links"
    ON social_media_links FOR ALL
    USING (user_id::text = auth.uid()::text);

-- Portfolio items policies
CREATE POLICY "Users can view any portfolio items"
    ON portfolio_items FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own portfolio items"
    ON portfolio_items FOR ALL
    USING (user_id::text = auth.uid()::text);

-- Influencer analytics policies
CREATE POLICY "Users can view their own analytics"
    ON influencer_analytics FOR SELECT
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their own analytics"
    ON influencer_analytics FOR ALL
    USING (user_id::text = auth.uid()::text);

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_fields INTEGER := 0;
    completed_fields INTEGER := 0;
BEGIN
    -- Count total required fields
    SELECT 
        CASE 
            WHEN u.full_name IS NOT NULL THEN 1 ELSE 0 END +
        CASE 
            WHEN u.email IS NOT NULL THEN 1 ELSE 0 END +
        CASE 
            WHEN u.avatar_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE 
            WHEN EXISTS (SELECT 1 FROM social_media_links WHERE user_id = u.id) THEN 1 ELSE 0 END +
        CASE 
            WHEN EXISTS (SELECT 1 FROM portfolio_items WHERE user_id = u.id) THEN 1 ELSE 0 END +
        CASE 
            WHEN EXISTS (SELECT 1 FROM influencer_profiles WHERE user_id = u.id) THEN 1 ELSE 0 END
    INTO completed_fields
    FROM users u
    WHERE u.id = user_id;

    total_fields := 6; -- Total number of required fields

    RETURN (completed_fields * 100) / total_fields;
END;
$$ LANGUAGE plpgsql; 
$$ LANGUAGE plpgsql; 