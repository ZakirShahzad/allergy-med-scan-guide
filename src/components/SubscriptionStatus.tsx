import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Shield, Users, Zap, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatusProps {
  compact?: boolean;
}

const SubscriptionStatus = ({ compact = false }: SubscriptionStatusProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock subscription data - will be replaced with real data from context
  const [subscriptionData] = useState({
    subscribed: false,
    plan: null,
    endDate: null,
    scansUsed: 12,
    scansLimit: 50,
    isNearLimit: false,
  });

  const planIcons = {
    basic: Shield,
    premium: Crown,
    family: Users,
  };

  const usagePercentage = (subscriptionData.scansUsed / subscriptionData.scansLimit) * 100;
  const isNearLimit = usagePercentage >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {subscriptionData.subscribed ? (
          <Badge variant="default" className="bg-green-600 text-white">
            {subscriptionData.plan} Plan
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {subscriptionData.scansUsed}/{subscriptionData.scansLimit} scans
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
              <Crown className="w-5 h-5 text-yellow-600" />
              Premium Plan
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-blue-600" />
              Free Plan
            </>
          )}
        </CardTitle>
        <CardDescription>
          {subscriptionData.subscribed 
            ? `Your subscription renews on ${subscriptionData.endDate}`
            : 'Upgrade to unlock unlimited scans and advanced features'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!subscriptionData.subscribed && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Scans this month</span>
                <span className="font-medium">
                  {subscriptionData.scansUsed} / {subscriptionData.scansLimit}
                </span>
              </div>
              <Progress 
                value={usagePercentage} 
                className={`h-2 ${isNearLimit ? 'bg-orange-200' : ''}`}
              />
              {isNearLimit && (
                <p className="text-sm text-orange-600">
                  You're running low on scans this month!
                </p>
              )}
            </div>
            
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
          </div>
        )}
        
        {subscriptionData.subscribed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant="default" className="bg-green-600 text-white">
                Active
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