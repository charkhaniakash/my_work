-- Function to handle expired campaigns
CREATE OR REPLACE FUNCTION expire_campaigns()
RETURNS void AS $$
BEGIN
  -- Mark campaigns as completed when end_date is reached
  UPDATE campaigns
  SET status = 'completed'
  WHERE status IN ('active', 'scheduled')
    AND end_date < NOW()::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign status based on dates (computed status)
CREATE OR REPLACE FUNCTION get_campaign_status(start_date DATE, end_date DATE, current_status TEXT)
RETURNS TEXT AS $$
BEGIN
  -- If end date has passed, should be completed
  IF end_date < NOW()::DATE THEN
    RETURN 'completed';
  END IF;
  
  -- If start date hasn't arrived, should be scheduled
  IF start_date > NOW()::DATE THEN
    RETURN 'scheduled';
  END IF;
  
  -- If between start and end date, and not manually paused/completed
  IF current_status NOT IN ('paused', 'completed') THEN
    RETURN 'active';
  END IF;
  
  -- Otherwise, keep current status
  RETURN current_status;
END;
$$ LANGUAGE plpgsql;

-- Create a view for campaign status with computed fields
CREATE OR REPLACE VIEW campaign_status_view AS
SELECT 
  *,
  get_campaign_status(start_date, end_date, status) as computed_status,
  CASE 
    WHEN end_date < NOW()::DATE THEN 'expired'
    WHEN start_date > NOW()::DATE THEN 'upcoming'
    ELSE 'current'
  END as date_status,
  (end_date - NOW()::DATE) as days_remaining
FROM campaigns;

-- Function to auto-update campaign status based on dates
CREATE OR REPLACE FUNCTION auto_update_campaign_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire campaigns when they are updated
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    -- Update the current row if it should be expired
    IF NEW.end_date < NOW()::DATE AND NEW.status IN ('active', 'scheduled') THEN
      NEW.status := 'completed';
    END IF;
    
    -- Auto-activate scheduled campaigns when their start date arrives
    IF NEW.start_date <= NOW()::DATE AND NEW.status = 'scheduled' AND NEW.end_date >= NOW()::DATE THEN
      NEW.status := 'active';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs on INSERT/UPDATE to auto-update status
CREATE TRIGGER auto_update_campaign_status_trigger
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_campaign_status();

-- Note: For batch expiration of existing campaigns, use the expire_campaigns() function
-- via the API endpoint at /api/campaigns/expire or call it manually 