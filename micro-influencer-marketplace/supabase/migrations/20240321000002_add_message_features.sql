-- Add typing_users table to track who is currently typing in each conversation
CREATE TABLE typing_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_typed TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- Add attachments table for message files
CREATE TABLE message_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for typing_users
ALTER TABLE typing_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status in their conversations"
    ON typing_users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = typing_users.conversation_id
            AND (conversations.brand_id = auth.uid() OR conversations.influencer_id = auth.uid())
        )
    );

CREATE POLICY "Users can update their own typing status"
    ON typing_users FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = typing_users.conversation_id
            AND (conversations.brand_id = auth.uid() OR conversations.influencer_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete their own typing status"
    ON typing_users FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Add RLS policies for message_attachments
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their conversations"
    ON message_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE m.id = message_attachments.message_id
            AND (c.brand_id = auth.uid() OR c.influencer_id = auth.uid())
        )
    );

CREATE POLICY "Users can add attachments to their messages"
    ON message_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = message_attachments.message_id
            AND messages.sender_id = auth.uid()
        )
    );

-- Create function to clean up old typing status
CREATE OR REPLACE FUNCTION cleanup_typing_status() RETURNS void AS $$
BEGIN
    DELETE FROM typing_users
    WHERE last_typed < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up typing status every 10 seconds
SELECT cron.schedule(
    'cleanup-typing-status',
    '*/10 * * * * *',
    'SELECT cleanup_typing_status();'
); 