-- Drop existing tables and policies
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create conversations table
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE (brand_id, influencer_id, campaign_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- ====================
-- ENABLE REAL-TIME REPLICATION (CRITICAL FOR REAL-TIME MESSAGING)
-- ====================

-- Enable real-time for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ====================
-- CONVERSATIONS POLICIES
-- ====================

-- Policy for viewing conversations
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (
        brand_id = auth.uid() OR 
        influencer_id = auth.uid()
    );

-- Policy for inserting conversations
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        brand_id = auth.uid() OR 
        influencer_id = auth.uid()
    );

-- Policy for updating conversations
CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE
    TO authenticated
    USING (
        brand_id = auth.uid() OR 
        influencer_id = auth.uid()
    )
    WITH CHECK (
        brand_id = auth.uid() OR 
        influencer_id = auth.uid()
    );

-- ====================
-- MESSAGES POLICIES (FIXED FOR REAL-TIME)
-- ====================

-- Policy for viewing messages (MUST allow both sender and receiver)
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    );

-- Policy for inserting messages (FIXED - must check sender)
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = conversation_id 
            AND (brand_id = auth.uid() OR influencer_id = auth.uid())
        )
    );

-- Policy for updating messages (for marking as read, etc.)
CREATE POLICY "Users can update messages in their conversations"
    ON messages FOR UPDATE
    TO authenticated
    USING (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    )
    WITH CHECK (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    );

-- ====================
-- ADDITIONAL REAL-TIME POLICIES (IMPORTANT)
-- ====================

-- These policies ensure real-time subscriptions work properly
CREATE POLICY "Real-time messages access"
    ON messages FOR ALL
    TO authenticated
    USING (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    )
    WITH CHECK (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    );

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- Index for conversations lookups
CREATE INDEX idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX idx_conversations_influencer_id ON conversations(influencer_id);
CREATE INDEX idx_conversations_campaign_id ON conversations(campaign_id);
CREATE INDEX idx_conversations_participants ON conversations(brand_id, influencer_id);

-- Index for messages lookups
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_participants ON messages(sender_id, receiver_id);

-- ====================
-- TRIGGERS FOR UPDATING TIMESTAMPS
-- ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for messages
CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_message_at in conversations when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- ====================
-- VERIFICATION QUERIES (Run these to check setup)
-- ====================

-- Check if real-time is enabled
-- SELECT schemaname, tablename, hasinserts, hasupdates, hasdeletes 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('messages', 'conversations');