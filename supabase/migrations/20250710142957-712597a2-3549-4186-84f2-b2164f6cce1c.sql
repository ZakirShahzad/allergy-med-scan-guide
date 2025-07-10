
-- Create subscribers table to track subscription information and scan usage
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  scans_used_this_month INTEGER NOT NULL DEFAULT 0,
  last_scan_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Create function to reset monthly scans
CREATE OR REPLACE FUNCTION public.reset_monthly_scans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscribers 
  SET 
    scans_used_this_month = 0,
    last_scan_reset = CURRENT_DATE,
    updated_at = now()
  WHERE last_scan_reset < CURRENT_DATE;
END;
$$;

-- Create function to check and increment scan usage (only if product was identified)
CREATE OR REPLACE FUNCTION public.increment_scan_usage(
  p_user_id UUID,
  p_product_identified BOOLEAN DEFAULT true
)
RETURNS TABLE(
  scans_remaining INTEGER,
  is_subscribed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscriber RECORD;
  v_free_scan_limit INTEGER := 5;
BEGIN
  -- First, reset monthly scans if needed
  PERFORM public.reset_monthly_scans();
  
  -- Get current subscriber info
  SELECT * INTO v_subscriber 
  FROM public.subscribers 
  WHERE user_id = p_user_id;
  
  -- If subscriber doesn't exist, create them
  IF v_subscriber IS NULL THEN
    INSERT INTO public.subscribers (user_id, email, scans_used_this_month, last_scan_reset)
    SELECT p_user_id, email, 0, CURRENT_DATE
    FROM auth.users 
    WHERE id = p_user_id;
    
    SELECT * INTO v_subscriber 
    FROM public.subscribers 
    WHERE user_id = p_user_id;
  END IF;
  
  -- Only increment if product was successfully identified
  IF p_product_identified THEN
    -- If not subscribed and would exceed free limit, don't increment
    IF NOT COALESCE(v_subscriber.subscribed, false) AND 
       v_subscriber.scans_used_this_month >= v_free_scan_limit THEN
      RETURN QUERY SELECT 0 as scans_remaining, COALESCE(v_subscriber.subscribed, false) as is_subscribed;
      RETURN;
    END IF;
    
    -- Increment scan usage
    UPDATE public.subscribers 
    SET 
      scans_used_this_month = scans_used_this_month + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Refresh subscriber info
    SELECT * INTO v_subscriber 
    FROM public.subscribers 
    WHERE user_id = p_user_id;
  END IF;
  
  -- Calculate remaining scans
  IF COALESCE(v_subscriber.subscribed, false) THEN
    -- Subscribed users have unlimited scans
    RETURN QUERY SELECT -1 as scans_remaining, true as is_subscribed;
  ELSE
    -- Free users have limited scans
    RETURN QUERY SELECT 
      GREATEST(0, v_free_scan_limit - v_subscriber.scans_used_this_month) as scans_remaining,
      false as is_subscribed;
  END IF;
END;
$$;

-- Create trigger to update the updated_at column
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
