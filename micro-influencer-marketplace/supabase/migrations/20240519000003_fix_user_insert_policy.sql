-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create comprehensive policies for users table
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid()::TEXT = id);

-- Add policy to allow insert during signup
CREATE POLICY "Enable insert for authentication"
    ON users FOR INSERT
    WITH CHECK (true);

-- Add policy to allow the trigger to insert
CREATE POLICY "Enable insert for trigger"
    ON users FOR INSERT
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 