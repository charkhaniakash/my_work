-- Drop existing policies for influencer_profiles
DROP POLICY IF EXISTS "Influencers can insert own profile" ON influencer_profiles;
DROP POLICY IF EXISTS "Influencers can update own profile" ON influencer_profiles;
DROP POLICY IF EXISTS "Anyone can read influencer profiles" ON influencer_profiles;

-- Create more permissive policies
CREATE POLICY "Users can insert their own influencer profile" ON influencer_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own influencer profile" ON influencer_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can read influencer profiles" ON influencer_profiles
    FOR SELECT USING (true);

-- Also create delete policy
CREATE POLICY "Users can delete their own influencer profile" ON influencer_profiles
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- If needed, temporarily disable RLS for admin operations
-- Uncomment these lines if you need to perform admin operations
-- ALTER TABLE influencer_profiles DISABLE ROW LEVEL SECURITY;
-- [perform operations]
-- ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON influencer_profiles TO authenticated;