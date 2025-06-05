-- Add missing columns to influencer_profiles table
ALTER TABLE influencer_profiles 
ADD COLUMN IF NOT EXISTS audience_size TEXT,
ADD COLUMN IF NOT EXISTS engagement_rate TEXT,
ADD COLUMN IF NOT EXISTS preferred_categories TEXT,
ADD COLUMN IF NOT EXISTS content_types TEXT,
ADD COLUMN IF NOT EXISTS rate_card TEXT;

-- Fix the niche column type if it's not working with form
-- Check if niche is already TEXT - if it's TEXT[], we need to modify it to accept string input
DO $$
BEGIN
    -- First attempt to handle the niche column
    BEGIN
        -- If niche is an array, convert it to TEXT
        ALTER TABLE influencer_profiles 
        ALTER COLUMN niche TYPE TEXT USING niche::TEXT;
    EXCEPTION
        WHEN others THEN
            -- If an error occurs, the column might already be TEXT or have a different constraint
            RAISE NOTICE 'Could not convert niche to TEXT, it may already be the right type.';
    END;
END $$;

-- Handle social_links column, ensure it can accept string values
DO $$
BEGIN
    -- First attempt to handle the social_links column
    BEGIN
        -- Check if we need to convert JSONB to TEXT
        ALTER TABLE influencer_profiles 
        ALTER COLUMN social_links TYPE TEXT USING social_links::TEXT;
    EXCEPTION
        WHEN others THEN
            -- If an error occurs, the column might already be TEXT
            RAISE NOTICE 'Could not convert social_links to TEXT, it may already be the right type.';
    END;
END $$;

-- Add comment explaining the changes
COMMENT ON TABLE influencer_profiles IS 'Extended with additional fields to match the form in the settings page.'; 