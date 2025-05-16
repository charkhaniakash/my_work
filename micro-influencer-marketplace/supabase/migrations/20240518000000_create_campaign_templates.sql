-- Create campaign_templates table
CREATE TABLE campaign_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    brand_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    target_location TEXT,
    target_niche TEXT[] NOT NULL DEFAULT '{}',
    requirements TEXT,
    deliverables TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can manage their own templates"
    ON campaign_templates FOR ALL
    USING (brand_id = auth.uid()::TEXT); 