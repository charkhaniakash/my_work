-- Drop existing status check constraint
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS campaigns_status_check;
 
-- Add new status check constraint with 'paused' status
ALTER TABLE campaigns
ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')); 