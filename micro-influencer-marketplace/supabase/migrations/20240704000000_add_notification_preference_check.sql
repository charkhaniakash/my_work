
-- Create function to check notification preferences before inserting notifications
CREATE OR REPLACE FUNCTION check_notification_preferences()
RETURNS TRIGGER AS $$
DECLARE
    preference_exists BOOLEAN;
    is_enabled BOOLEAN;
    preference_type TEXT;
BEGIN
    -- Map notification type to preference type
    IF NEW.type = 'message' THEN
        preference_type := 'messages';
    ELSIF NEW.type = 'application' OR NEW.type = 'application_status' THEN
        preference_type := 'applications';
    ELSIF NEW.type = 'campaign' OR NEW.type = 'invitation' OR NEW.type = 'invitation_response' THEN
        preference_type := 'campaigns';
    ELSE
        preference_type := 'campaigns'; -- Default
    END IF;
    
    -- Check if user has preferences and if the specific notification type is enabled
    SELECT 
        EXISTS(SELECT 1 FROM notification_preferences WHERE user_id = NEW.user_id) INTO preference_exists;
    
    -- If user has preferences, check if the notification type is enabled
    IF preference_exists THEN
        EXECUTE format('SELECT %I FROM notification_preferences WHERE user_id = $1', preference_type)
        INTO is_enabled
        USING NEW.user_id;
        
        -- Log the check (visible in server logs)
        RAISE NOTICE 'Notification preference check for user %, type %: enabled = %', 
            NEW.user_id, preference_type, is_enabled;
        
        -- If notifications are disabled for this type, cancel the insert
        IF NOT is_enabled THEN
            RAISE NOTICE 'Notification blocked: % notifications disabled for user %', 
                preference_type, NEW.user_id;
            RETURN NULL; -- Cancel the insert
        END IF;
    END IF;
    
    -- Allow the insert
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to check preferences before inserting notifications
DROP TRIGGER IF EXISTS check_notification_preferences_trigger ON notifications;
CREATE TRIGGER check_notification_preferences_trigger
    BEFORE INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION check_notification_preferences();

-- Add comment explaining the trigger
COMMENT ON TRIGGER check_notification_preferences_trigger ON notifications IS 
    'Checks user notification preferences before inserting a notification';

-- Update RLS on notifications table to ensure proper access
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

-- Service role can insert notifications (but will be filtered by trigger)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE notifications IS 'Notifications are filtered by user preferences via trigger';