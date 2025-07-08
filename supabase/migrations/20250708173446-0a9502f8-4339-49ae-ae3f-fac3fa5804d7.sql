-- Add settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN email_alerts BOOLEAN DEFAULT false,
ADD COLUMN emergency_sharing BOOLEAN DEFAULT true,
ADD COLUMN data_retention_days INTEGER DEFAULT 365;