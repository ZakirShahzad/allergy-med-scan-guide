import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  subscriptionData: {
    subscribed: boolean;
    subscription_tier: string | null;
    subscription_end: string | null;
    scans_used_this_month: number;
  };
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState({
    subscribed: false,
    subscription_tier: null as string | null,
    subscription_end: null as string | null,
    scans_used_this_month: 0,
  });
  const [lastSubscriptionCheck, setLastSubscriptionCheck] = useState<number>(0);
  const [edgeFunctionDisabled, setEdgeFunctionDisabled] = useState(false);
  
  // Emergency fix: Significantly increased cooldown to prevent excessive calls
  const SUBSCRIPTION_CHECK_COOLDOWN = 300000; // 5 minutes

  const fetchSubscriptionData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('scans_used_this_month, subscribed, subscription_tier, subscription_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription data:', error);
        return;
      }

      if (data) {
        setSubscriptionData({
          subscribed: data.subscribed,
          subscription_tier: data.subscription_tier,
          subscription_end: data.subscription_end,
          scans_used_this_month: data.scans_used_this_month,
        });
      } else {
        setSubscriptionData({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          scans_used_this_month: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  }, [user]);

  const checkSubscription = useCallback(async (force = false) => {
    // Circuit breaker: if edge functions are disabled, only fetch local data
    if (edgeFunctionDisabled && !force) {
      console.log('Edge functions disabled due to quota limits, fetching local data only');
      await fetchSubscriptionData();
      return;
    }
    
    // Rate limiting: only check subscription every 5 minutes (unless forced)
    const now = Date.now();
    if (!force && now - lastSubscriptionCheck < SUBSCRIPTION_CHECK_COOLDOWN) {
      console.log('Subscription check skipped due to rate limiting');
      await fetchSubscriptionData(); // Still fetch local data
      return;
    }
    
    setLastSubscriptionCheck(now);
    
    try {
      const { error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Subscription check error:', error);
        
        // If we hit quota limits, disable edge functions for a while
        if (error.message?.includes('quota') || error.message?.includes('limit') || error.status === 429) {
          console.warn('Edge function quota exceeded, disabling for 30 minutes');
          setEdgeFunctionDisabled(true);
          // Re-enable after 30 minutes
          setTimeout(() => {
            setEdgeFunctionDisabled(false);
          }, 30 * 60 * 1000);
        }
        
        // Always try to fetch local data as fallback
        await fetchSubscriptionData();
        return;
      }
      // After successful edge function call, fetch the updated data
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Try to fetch local data even if remote check fails
      try {
        await fetchSubscriptionData();
      } catch (fetchError) {
        console.error('Failed to fetch subscription data:', fetchError);
      }
    }
  }, [fetchSubscriptionData, lastSubscriptionCheck, SUBSCRIPTION_CHECK_COOLDOWN, edgeFunctionDisabled]);

  const refreshSubscription = useCallback(async () => {
    // Force refresh - bypass rate limiting for manual refresh
    await checkSubscription(true);
  }, [checkSubscription]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Only check subscription on actual sign-in events, not on initial load
        if (event === 'SIGNED_IN' && session?.user) {
          // Use a longer delay and check if we really need to call the edge function
          setTimeout(() => {
            // Only if we don't have recent subscription data
            if (Date.now() - lastSubscriptionCheck > SUBSCRIPTION_CHECK_COOLDOWN) {
              checkSubscription();
            }
          }, 2000);
        }
      }
    );

    // Get initial session - only fetch local data, don't call edge function
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Don't automatically check subscription on page load to prevent excessive calls
      // Users can manually refresh if needed
    });

    return () => subscription.unsubscribe();
  }, []); // Remove checkSubscription dependency to prevent infinite re-renders

  useEffect(() => {
    if (!user) return;

    // Only fetch subscription data from local database, not edge function
    // This prevents excessive edge function calls while still showing cached data
    fetchSubscriptionData();
  }, [user]); // Remove fetchSubscriptionData dependency to prevent infinite re-renders

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
    subscriptionData,
    refreshSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};