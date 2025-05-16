-- Add notes column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create campaign_files table
CREATE TABLE campaign_files (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    uploader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE campaign_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign participants can view files" ON campaign_files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_files.campaign_id
      AND (campaigns.brand_id = auth.uid()::TEXT OR auth.uid()::TEXT IN (SELECT influencer_id FROM campaign_applications WHERE campaign_id = campaigns.id AND status = 'accepted'))
  )
);

CREATE POLICY "Uploader or brand can insert/delete files" ON campaign_files FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_files.campaign_id
      AND (campaigns.brand_id = auth.uid()::TEXT OR campaign_files.uploader_id = auth.uid()::TEXT)
  )
);