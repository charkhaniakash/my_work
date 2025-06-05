-- Update the status check constraint to include 'pending_payment'
ALTER TABLE campaign_applications
DROP CONSTRAINT IF EXISTS campaign_applications_status_check;

ALTER TABLE campaign_applications
ADD CONSTRAINT campaign_applications_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'approved_and_paid', 'pending_payment'));

-- Update any existing 'accepted' applications to 'pending_payment'
UPDATE campaign_applications
SET status = 'pending_payment'
WHERE status = 'accepted';

-- Add comment to explain the status flow
COMMENT ON COLUMN campaign_applications.status IS 
'Application status flow: pending -> pending_payment -> approved_and_paid or pending -> rejected'; 