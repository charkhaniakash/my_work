-- Function to activate scheduled campaigns
CREATE OR REPLACE FUNCTION activate_scheduled_campaigns()
RETURNS void AS $$
BEGIN
  UPDATE campaigns
  SET status = 'active'
  WHERE status = 'scheduled'
    AND start_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run every minute
SELECT cron.schedule(
  'activate-scheduled-campaigns',
  '* * * * *',  -- Run every minute
  $$SELECT activate_scheduled_campaigns()$$
); 