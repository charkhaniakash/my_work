-- Add unique constraint to prevent duplicate applications
-- First, remove any existing duplicates (keeping the most recent one)

-- Create a temporary table to identify duplicates
CREATE TEMP TABLE duplicate_applications AS
SELECT 
    campaign_id, 
    influencer_id,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created,
    COUNT(*) as count
FROM campaign_applications 
GROUP BY campaign_id, influencer_id 
HAVING COUNT(*) > 1;

-- Delete older duplicate applications, keeping the most recent one
DELETE FROM campaign_applications 
WHERE (campaign_id, influencer_id, created_at) IN (
    SELECT ca.campaign_id, ca.influencer_id, ca.created_at
    FROM campaign_applications ca
    INNER JOIN duplicate_applications da 
        ON ca.campaign_id = da.campaign_id 
        AND ca.influencer_id = da.influencer_id
        AND ca.created_at < da.last_created
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE campaign_applications 
ADD CONSTRAINT unique_campaign_influencer_application 
UNIQUE (campaign_id, influencer_id);

-- Update the invitation trigger to handle existing applications
CREATE OR REPLACE FUNCTION convert_invitation_to_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if application already exists
    IF EXISTS (SELECT 1 FROM campaign_applications 
               WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id) THEN
      -- Update existing application instead of creating new one
      UPDATE campaign_applications 
      SET 
        status = 'accepted',
        pitch = COALESCE(NEW.custom_message, pitch),
        proposed_rate = COALESCE(NEW.proposed_rate, proposed_rate),
        updated_at = NOW()
      WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id;
    ELSE
      -- Create a new application if none exists
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

-- Create a function to check for existing invitations before allowing applications
CREATE OR REPLACE FUNCTION check_invitation_before_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an accepted invitation for this campaign-influencer pair
  IF EXISTS (
    SELECT 1 FROM campaign_invitations 
    WHERE campaign_id = NEW.campaign_id 
    AND influencer_id = NEW.influencer_id 
    AND status = 'accepted'
  ) THEN
    -- If there's an accepted invitation, don't allow direct application
    RAISE EXCEPTION 'You have already accepted an invitation for this campaign. Check your applications page.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to prevent applications when invitation is already accepted
CREATE TRIGGER prevent_duplicate_application_after_invitation
  BEFORE INSERT ON campaign_applications
  FOR EACH ROW
  EXECUTE FUNCTION check_invitation_before_application(); 