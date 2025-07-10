-- Enable real-time updates for subscribers table
ALTER PUBLICATION supabase_realtime ADD TABLE subscribers;

-- Ensure complete row data is captured during updates
ALTER TABLE subscribers REPLICA IDENTITY FULL;