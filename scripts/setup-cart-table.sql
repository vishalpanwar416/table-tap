-- Create user_carts table for storing user cart data
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one cart per user per restaurant
  UNIQUE(user_id, restaurant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_restaurant_id ON user_carts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_updated_at ON user_carts(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own carts
CREATE POLICY "Users can view their own carts" ON user_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own carts" ON user_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carts" ON user_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carts" ON user_carts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_carts_updated_at
  BEFORE UPDATE ON user_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old carts (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_carts 
  WHERE updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old carts (if using pg_cron extension)
-- Uncomment if you have pg_cron installed:
-- SELECT cron.schedule('cleanup-old-carts', '0 2 * * *', 'SELECT cleanup_old_carts();');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_carts TO authenticated;
GRANT USAGE ON SEQUENCE user_carts_id_seq TO authenticated; 