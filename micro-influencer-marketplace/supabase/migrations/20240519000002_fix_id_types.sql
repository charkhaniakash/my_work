-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Brands can manage their own profiles" ON brand_profiles;
DROP POLICY IF EXISTS "Influencers can manage their own profiles" ON influencer_profiles;
DROP POLICY IF EXISTS "Brands can manage their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can manage their own applications" ON campaign_applications;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view typing status in their conversations" ON typing_users;
DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_users;
DROP POLICY IF EXISTS "Users can delete their own typing status" ON typing_users;
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;
DROP POLICY IF EXISTS "Users can add attachments to their messages" ON message_attachments;
DROP POLICY IF EXISTS "Users can view any social media links" ON social_media_links;
DROP POLICY IF EXISTS "Users can manage their own social media links" ON social_media_links;
DROP POLICY IF EXISTS "Users can view any portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Users can manage their own portfolio items" ON portfolio_items;
DROP POLICY IF EXISTS "Users can view their own analytics" ON influencer_analytics;
DROP POLICY IF EXISTS "Users can manage their own analytics" ON influencer_analytics;
DROP POLICY IF EXISTS "Campaign participants can view files" ON campaign_files;
DROP POLICY IF EXISTS "Uploader or brand can insert/delete files" ON campaign_files;
DROP POLICY IF EXISTS "Campaign brand can manage tasks" ON deliverable_tasks;
DROP POLICY IF EXISTS "Participants can view tasks" ON deliverable_tasks;
DROP POLICY IF EXISTS "Brands can manage their own templates" ON campaign_templates;

-- Now alter the column types
ALTER TABLE users 
ALTER COLUMN id TYPE TEXT;

ALTER TABLE brand_profiles 
ALTER COLUMN id TYPE TEXT,
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE influencer_profiles 
ALTER COLUMN id TYPE TEXT,
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE campaigns 
ALTER COLUMN id TYPE TEXT,
ALTER COLUMN brand_id TYPE TEXT;

ALTER TABLE campaign_applications 
ALTER COLUMN id TYPE TEXT,
ALTER COLUMN campaign_id TYPE TEXT,
ALTER COLUMN influencer_id TYPE TEXT,
ALTER COLUMN brand_id TYPE TEXT;

-- Recreate RLS policies with TEXT type
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid()::TEXT = id);

CREATE POLICY "Brands can manage their own profiles"
    ON brand_profiles FOR ALL
    USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Influencers can manage their own profiles"
    ON influencer_profiles FOR ALL
    USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Brands can manage their own campaigns"
    ON campaigns FOR ALL
    USING (brand_id = auth.uid()::TEXT);

CREATE POLICY "Users can manage their own applications"
    ON campaign_applications FOR ALL
    USING (
        influencer_id = auth.uid()::TEXT OR
        brand_id = auth.uid()::TEXT
    );

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY; 