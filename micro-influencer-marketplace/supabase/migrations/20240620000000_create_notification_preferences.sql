-- Create notification preferences table
CREATE TABLE notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    campaigns BOOLEAN DEFAULT TRUE,
    applications BOOLEAN DEFAULT TRUE,
    messages BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own notification preferences"
    ON notification_preferences FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid()::TEXT);

-- Create trigger for updated_at
CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to create default preferences on user creation
CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences(); 