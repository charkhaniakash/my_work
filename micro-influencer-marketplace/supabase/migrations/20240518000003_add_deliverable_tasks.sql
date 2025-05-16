-- Create deliverable_tasks table
CREATE TABLE deliverable_tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE deliverable_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign brand can manage tasks" ON deliverable_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = deliverable_tasks.campaign_id
      AND campaigns.brand_id = auth.uid()::TEXT
  )
);

CREATE POLICY "Participants can view tasks" ON deliverable_tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = deliverable_tasks.campaign_id
      AND (campaigns.brand_id = auth.uid()::TEXT OR auth.uid()::TEXT IN (SELECT influencer_id FROM campaign_applications WHERE campaign_id = campaigns.id AND status = 'accepted'))
  )
); 