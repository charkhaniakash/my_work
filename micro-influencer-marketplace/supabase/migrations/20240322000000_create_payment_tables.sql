-- Create payment transactions table
CREATE TABLE payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  influencer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create payment methods table
CREATE TABLE payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add RLS policies for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = brand_id OR 
    auth.uid()::text = influencer_id
  );

CREATE POLICY "Brands can create transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = brand_id AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'brand'
    )
  );

-- Add RLS policies for payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 