-- Temporarily disable the conflicting triggers to allow manual handling in the API
-- We'll handle invitation-to-application conversion manually in the API

-- Drop the trigger that prevents application creation when invitation is accepted
DROP TRIGGER IF EXISTS prevent_duplicate_application_after_invitation ON campaign_applications;

-- Drop the trigger that automatically creates applications from invitations
DROP TRIGGER IF EXISTS convert_accepted_invitation ON campaign_invitations;

-- Keep the unique constraint on applications
-- ALTER TABLE campaign_applications 
-- ADD CONSTRAINT unique_campaign_influencer_application 
-- UNIQUE (campaign_id, influencer_id);
-- (This should already exist from previous migration)

-- Add a comment to track this change
COMMENT ON TABLE campaign_invitations IS 'Invitation acceptance is now handled manually in the API to avoid trigger conflicts'; 