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
  
  // Rate limiting - only allow subscription checks every 30 seconds
  const SUBSCRIPTION_CHECK_COOLDOWN = 30000;

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

  const checkSubscription = useCallback(async () => {
    // Rate limiting: only check subscription every 30 seconds
    const now = Date.now();
    if (now - lastSubscriptionCheck < SUBSCRIPTION_CHECK_COOLDOWN) {
      console.log('Subscription check skipped due to rate limiting');
      return;
    }
    
    setLastSubscriptionCheck(now);
    
    try {
      await supabase.functions.invoke('check-subscription');
      // After checking subscription, fetch the updated data
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Don't throw the error to prevent infinite loops
    }
  }, [fetchSubscriptionData, lastSubscriptionCheck, SUBSCRIPTION_CHECK_COOLDOWN]);

  const refreshSubscription = useCallback(async () => {
    // Force refresh - bypass rate limiting for manual refresh
    setLastSubscriptionCheck(0);
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription status when user logs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            checkSubscription();
          }, 0);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription status on initial load
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  useEffect(() => {
    if (!user) return;

    // Just fetch the subscription data when user changes, don't set up real-time listener to avoid infinite loops
    fetchSubscriptionData();
  }, [user, fetchSubscriptionData]);

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