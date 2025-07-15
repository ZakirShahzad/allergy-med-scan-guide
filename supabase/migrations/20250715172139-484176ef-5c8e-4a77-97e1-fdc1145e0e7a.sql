-- Update the increment_scan_usage function to check subscription end date
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
  v_has_active_subscription BOOLEAN := false;
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
  
  -- Check if user has active subscription
  -- User is considered subscribed if:
  -- 1. subscribed = true AND
  -- 2. (subscription_end is null OR subscription_end > now())
  v_has_active_subscription := COALESCE(v_subscriber.subscribed, false) AND 
    (v_subscriber.subscription_end IS NULL OR v_subscriber.subscription_end > now());
  
  -- Only increment if product was successfully identified
  IF p_product_identified THEN
    -- If not subscribed and would exceed free limit, don't increment
    IF NOT v_has_active_subscription AND 
       v_subscriber.scans_used_this_month >= v_free_scan_limit THEN
      RETURN QUERY SELECT 0 as scans_remaining, v_has_active_subscription as is_subscribed;
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
  IF v_has_active_subscription THEN
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