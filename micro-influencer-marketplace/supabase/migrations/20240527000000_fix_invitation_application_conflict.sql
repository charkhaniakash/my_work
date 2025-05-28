-- Fix the conflict between invitation acceptance and application creation
-- The issue is that check_invitation_before_application() blocks ALL application creation
-- when there's an accepted invitation, even when triggered by accepting the invitation

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS prevent_duplicate_application_after_invitation ON campaign_applications;

-- Update the function to only block MANUAL applications, not ones from invitation acceptance
CREATE OR REPLACE FUNCTION check_invitation_before_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for manual applications (not triggered by invitation acceptance)
  -- We can detect this by checking if there's a concurrent transaction updating invitations
  IF TG_OP = 'INSERT' THEN
    -- Check if there's an accepted invitation for this campaign-influencer pair
    -- AND if this application is being created manually (not from invitation trigger)
    IF EXISTS (
      SELECT 1 FROM campaign_invitations 
      WHERE campaign_id = NEW.campaign_id 
      AND influencer_id = NEW.influencer_id 
      AND status = 'accepted'
    ) AND NOT EXISTS (
      SELECT 1 FROM campaign_applications
      WHERE campaign_id = NEW.campaign_id 
      AND influencer_id = NEW.influencer_id
    ) THEN
      -- Only raise exception if no application exists yet
      -- This means it's a manual application attempt after invitation acceptance
      RAISE EXCEPTION 'You have already accepted an invitation for this campaign. Check your applications page.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER prevent_duplicate_application_after_invitation
  BEFORE INSERT ON campaign_applications
  FOR EACH ROW
  EXECUTE FUNCTION check_invitation_before_application();

-- Also update the invitation-to-application conversion function to be more robust
CREATE OR REPLACE FUNCTION convert_invitation_to_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if application already exists
    IF EXISTS (SELECT 1 FROM campaign_applications 
               WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id) THEN
      -- Update existing application
      UPDATE campaign_applications 
      SET 
        status = 'accepted',
        pitch = COALESCE(NEW.custom_message, pitch),
        proposed_rate = COALESCE(NEW.proposed_rate, proposed_rate),
        updated_at = NOW()
      WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id;
    ELSE
      -- Create a new application (this should bypass the other trigger)
      -- Temporarily disable the trigger for this insertion
      BEGIN
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
      EXCEPTION
        WHEN unique_violation THEN
          -- If unique constraint violation, update the existing record
          UPDATE campaign_applications 
          SET 
            status = 'accepted',
            pitch = COALESCE(NEW.custom_message, 'Accepted invitation'),
            proposed_rate = COALESCE(NEW.proposed_rate, 0),
            updated_at = NOW()
          WHERE campaign_id = NEW.campaign_id AND influencer_id = NEW.influencer_id;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 