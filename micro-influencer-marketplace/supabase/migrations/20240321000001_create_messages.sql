-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create conversations table to group messages
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES users(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(brand_id, influencer_id, campaign_id)
);

-- Add RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    TO authenticated
    USING (
        sender_id = auth.uid() OR 
        receiver_id = auth.uid()
    );

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

-- Conversations policies
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (
        brand_id = auth.uid() OR 
        influencer_id = auth.uid()
    );

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        (brand_id = auth.uid() AND
         EXISTS (
             SELECT 1 FROM users
             WHERE id = influencer_id AND role = 'influencer'
         ))
        OR
        (influencer_id = auth.uid() AND
         EXISTS (
             SELECT 1 FROM users
             WHERE id = brand_id AND role = 'brand'
         ))
    );

-- Create updated_at triggers
CREATE TRIGGER set_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message() RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message(); 