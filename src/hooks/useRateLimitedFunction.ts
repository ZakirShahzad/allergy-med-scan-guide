import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rateLimiter } from '@/utils/rateLimiter';
import { useToast } from '@/hooks/use-toast';

interface FunctionResponse {
  data: any;
  error: any;
}

export const useRateLimitedFunction = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const invokeFunction = async (
    functionName: string, 
    options?: { body?: any }
  ): Promise<FunctionResponse> => {
    // Check rate limit first
    if (!rateLimiter.canExecute(functionName)) {
      const remaining = rateLimiter.getRemainingCalls(functionName);
      const resetTime = new Date(rateLimiter.getResetTime(functionName));
      
      toast({
        variant: "destructive",
        title: "Rate limit exceeded",
        description: `Too many calls to ${functionName}. Try again after ${resetTime.toLocaleTimeString()}.`
      });
      
      return { data: null, error: new Error('Rate limit exceeded') };
    }

    setLoading(functionName);
    
    try {
      console.log(`🚀 Calling edge function: ${functionName}`);
      const result = await supabase.functions.invoke(functionName, options);
      
      const remaining = rateLimiter.getRemainingCalls(functionName);
      console.log(`✅ Function ${functionName} completed. Remaining calls: ${remaining}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Function ${functionName} failed:`, error);
      return { data: null, error };
    } finally {
      setLoading(null);
    }
  };

  return {
    invokeFunction,
    loading,
    getRemainingCalls: rateLimiter.getRemainingCalls.bind(rateLimiter)
  };
};