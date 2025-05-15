-- Change requirements column from TEXT[] to TEXT
ALTER TABLE campaigns
ALTER COLUMN requirements TYPE TEXT USING requirements::TEXT; 