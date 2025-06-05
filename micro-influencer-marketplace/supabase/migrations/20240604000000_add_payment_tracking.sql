-- Add payment tracking fields to campaign_applications
ALTER TABLE campaign_applications
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'escrowed', 'released', 'refunded')),
ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_amount DECIMAL(10,2),
ADD COLUMN escrow_id VARCHAR(255),
ADD COLUMN payment_transaction_id VARCHAR(255);

-- Create an index for faster payment status queries
CREATE INDEX idx_campaign_applications_payment_status ON campaign_applications(payment_status);

-- Add trigger to prevent status changes without payment
CREATE OR REPLACE FUNCTION prevent_status_change_without_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set status to 'accepted' but payment is not escrowed
  IF NEW.status = 'accepted' AND NEW.payment_status != 'escrowed' THEN
    RAISE EXCEPTION 'Cannot accept application without securing payment in escrow';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_payment_before_accept
BEFORE UPDATE ON campaign_applications
FOR EACH ROW
WHEN (OLD.status != 'accepted' AND NEW.status = 'accepted')
EXECUTE FUNCTION prevent_status_change_without_payment();

-- Add function to release payment from escrow
CREATE OR REPLACE FUNCTION release_payment_from_escrow(application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE campaign_applications
  SET payment_status = 'released'
  WHERE id = application_id AND payment_status = 'escrowed';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql; 