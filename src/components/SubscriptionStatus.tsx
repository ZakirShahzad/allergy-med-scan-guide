import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Shield, Users, Zap, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatusProps {
  compact?: boolean;
}

interface SubscriptionData {
  scans_used_this_month: number;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

const SubscriptionStatus = ({ compact = false }: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, subscriptionData, refreshSubscription } = useAuth();
  const [loading, setLoading] = useState(false);

  const FREE_SCAN_LIMIT = 5;
  const BASIC_SCAN_LIMIT = 50;

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      await refreshSubscription();
      toast({
        title: "Status refreshed",
        description: "Your subscription status has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh subscription status.",
      });
    } finally {
      setLoading(false);
    }
  };

  const planIcons = {
    basic: Shield,
    premium: Crown,
    family: Users,
  };

  if (loading || !subscriptionData) {
    return compact ? (
      <div className="animate-pulse flex items-center gap-2">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    ) : (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scansUsed = subscriptionData.scans_used_this_month;
  const isBasicPlan = subscriptionData.subscribed && subscriptionData.subscription_tier === 'Basic';
  const scansRemaining = subscriptionData.subscribed ? 
    (isBasicPlan ? Math.max(0, BASIC_SCAN_LIMIT - scansUsed) : -1) : 
    Math.max(0, FREE_SCAN_LIMIT - scansUsed);
  const usagePercentage = isBasicPlan ? 
    (scansUsed / BASIC_SCAN_LIMIT) * 100 : 
    subscriptionData.subscribed ? 0 : (scansUsed / FREE_SCAN_LIMIT) * 100;
  const isNearLimit = (isBasicPlan && usagePercentage >= 80) || (!subscriptionData.subscribed && usagePercentage >= 80);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {subscriptionData.subscribed ? (
          <Badge variant="default" className="bg-green-600 text-white">
            {subscriptionData.subscription_tier || 'Basic'} Plan
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Free Trial: {scansUsed}/{FREE_SCAN_LIMIT} scans
            </Badge>
            {isNearLimit && (
              <AlertCircle className="w-4 h-4 text-orange-500" />
            )}
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/billing')}
          className="text-xs px-2"
        >
          {subscriptionData.subscribed ? 'Manage' : 'Upgrade'}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`${isNearLimit ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {subscriptionData.subscribed ? (
            <>
              {subscriptionData.subscription_tier === 'Family' ? (
                <Users className="w-5 h-5 text-blue-600" />
              ) : subscriptionData.subscription_tier === 'Premium' ? (
                <Crown className="w-5 h-5 text-yellow-600" />
              ) : (
                <Shield className="w-5 h-5 text-green-600" />
              )}
              {subscriptionData.subscription_tier || 'Basic'} Plan
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-blue-600" />
              Free Trial
            </>
          )}
        </CardTitle>
        <CardDescription>
          {subscriptionData.subscribed 
            ? subscriptionData.subscription_end 
              ? `Your subscription renews on ${new Date(subscriptionData.subscription_end).toLocaleDateString()}`
              : `You have an active ${subscriptionData.subscription_tier?.toLowerCase() || 'basic'} subscription`
            : 'Upgrade to unlock unlimited scans and advanced features'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show usage for Basic plan or Free users */}
        {(isBasicPlan || !subscriptionData.subscribed) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scans this month</span>
                <span className="font-medium">
                  {scansUsed} / {isBasicPlan ? BASIC_SCAN_LIMIT : FREE_SCAN_LIMIT}
                  {!subscriptionData.subscribed && ' (Free Trial)'}
                  {isBasicPlan && ' (Basic Plan)'}
                </span>
              </div>
              <Progress 
                value={usagePercentage} 
                className={`h-2 ${isNearLimit ? 'bg-orange-200' : ''}`}
              />
              {isNearLimit && (
                <p className="text-sm text-orange-600">
                  {isBasicPlan ? 
                    "You're running low on scans this month! Consider upgrading to Premium for unlimited scans." :
                    "You're running low on scans this month!"
                  }
                </p>
              )}
            </div>
            
            {!subscriptionData.subscribed && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/billing')}
                  className="flex-1"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Learn more about plans",
                      description: "Compare features and pricing options.",
                    });
                    navigate('/billing');
                  }}
                >
                  Compare Plans
                </Button>
              </div>
            )}
            
            <Button 
              onClick={handleRefreshStatus}
              variant="ghost" 
              size="sm"
              className="w-full"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>
        )}
        
        {subscriptionData.subscribed && !isBasicPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant="default" className="bg-green-600 text-white">
                Active - Unlimited Scans
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/billing')}
                className="flex-1"
              >
                Manage Subscription
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Usage stats",
                    description: "View your detailed usage statistics.",
                  });
                }}
              >
                View Usage
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;