-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('brand', 'influencer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_login TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT
);

-- Create brand_profiles table
CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT,
  description TEXT,
  location TEXT,
  company_size TEXT,
  budget_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create influencer_profiles table
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  bio TEXT,
  niche TEXT[],
  location TEXT,
  pricing_tier TEXT CHECK (pricing_tier IN ('basic', 'standard', 'premium')),
  min_rate DECIMAL,
  max_rate DECIMAL,
  languages TEXT[],
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Brand profiles policies
CREATE POLICY "Anyone can read brand profiles" ON brand_profiles
  FOR SELECT USING (true);

CREATE POLICY "Brands can insert own profile" ON brand_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Brands can update own profile" ON brand_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Influencer profiles policies
CREATE POLICY "Anyone can read influencer profiles" ON influencer_profiles
  FOR SELECT USING (true);

CREATE POLICY "Influencers can insert own profile" ON influencer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Influencers can update own profile" ON influencer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 