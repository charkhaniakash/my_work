-- Add deliverables column to campaigns table
ALTER TABLE campaigns
ADD COLUMN deliverables TEXT NOT NULL DEFAULT '';
 
-- Update existing rows to have a default value
UPDATE campaigns
SET deliverables = 'No deliverables specified'
WHERE deliverables = ''; 