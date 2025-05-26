-- Create a table for campaign invitations

-- DROP TABLE IF EXISTS campaign_invitations CASCADE;


CREATE TABLE campaign_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  custom_message TEXT,
  proposed_rate DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);

-- Add RLS policies
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;

-- Policy for brands to insert invitations
CREATE POLICY campaign_invitations_insert_policy ON campaign_invitations
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid()::text = brand_id AND
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()::text)
  );

-- Policy for brands to view their own invitations
CREATE POLICY campaign_invitations_select_brand_policy ON campaign_invitations
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = brand_id
  );

-- Policy for influencers to view invitations sent to them
CREATE POLICY campaign_invitations_select_influencer_policy ON campaign_invitations
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = influencer_id
  );

-- Policy for influencers to update their own invitations (accept/decline)
CREATE POLICY campaign_invitations_update_influencer_policy ON campaign_invitations
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid()::text = influencer_id AND 
    status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'declined') AND
    auth.uid()::text = influencer_id
  );

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_campaign_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call timestamp function on update
CREATE TRIGGER update_campaign_invitation_timestamp
BEFORE UPDATE ON campaign_invitations
FOR EACH ROW
EXECUTE FUNCTION update_campaign_invitation_timestamp();

-- Create trigger to create campaign application when invitation is accepted
CREATE OR REPLACE FUNCTION convert_invitation_to_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if application exists
    IF NOT EXISTS (SELECT 1 FROM campaign_applications 
                   WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id) THEN
      -- Create a new application
      INSERT INTO campaign_applications (
        campaign_id, 
        influencer_id, 
        brand_id, 
        status, 
        pitch, 
        proposed_rate
      ) VALUES (
        NEW.campaign_id, 
        NEW.influencer_id, 
        NEW.brand_id, 
        'accepted', 
        COALESCE(NEW.custom_message, 'Accepted invitation'), 
        COALESCE(NEW.proposed_rate, 0)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invitation acceptance
CREATE TRIGGER convert_accepted_invitation
AFTER UPDATE ON campaign_invitations
FOR EACH ROW
EXECUTE FUNCTION convert_invitation_to_application(); 