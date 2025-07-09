-- Create cart_backups table for storing cart backup data
CREATE TABLE IF NOT EXISTS cart_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,
  backup_name VARCHAR(255),
  backup_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for better performance
  CONSTRAINT fk_cart_backups_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_backups_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_backups_user_id ON cart_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_backups_restaurant_id ON cart_backups(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_backups_created_at ON cart_backups(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE cart_backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own backups
CREATE POLICY "Users can view their own backups" ON cart_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups" ON cart_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups" ON cart_backups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups" ON cart_backups
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically clean up old backups (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_cart_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_backups 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old backups (if using pg_cron extension)
-- Uncomment if you have pg_cron installed:
-- SELECT cron.schedule('cleanup-old-cart-backups', '0 3 * * *', 'SELECT cleanup_old_cart_backups();');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_backups TO authenticated;
GRANT USAGE ON SEQUENCE cart_backups_id_seq TO authenticated; 