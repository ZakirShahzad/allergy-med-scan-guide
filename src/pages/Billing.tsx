import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Crown, Shield, Users, Zap, CreditCard, Settings, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Billing = () => {
  const { user, subscriptionData, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleRefreshSubscription = async () => {
    try {
      await refreshSubscription();
      toast({
        title: "Subscription refreshed",
        description: "Your subscription status has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh subscription status.",
      });
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      interval: 'month',
      features: [
        '50 medication scans per month',
        'Basic drug interaction analysis',
        'Allergy checking',
        'Email support',
        'Basic medication reminders'
      ],
      badge: null,
      popular: false,
      icon: Shield
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      interval: 'month',
      features: [
        'Unlimited medication scans',
        'Advanced drug interaction analysis',
        'Comprehensive allergy checking',
        'Priority support',
        'Smart medication reminders',
        'Emergency sharing with contacts',
        'Detailed health reports',
        'Medicine expiration tracking'
      ],
      badge: 'Most Popular',
      popular: true,
      icon: Crown
    },
    {
      id: 'family',
      name: 'Family',
      price: 29.99,
      interval: 'month',
      features: [
        'Everything in Premium',
        'Up to 5 family members',
        'Shared emergency information',
        'Family medication calendar',
        'Caregiver notifications',
        'Multi-profile management',
        'Family health insights',
        'Bulk medication scanning'
      ],
      badge: 'Best Value',
      popular: false,
      icon: Users
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
      });
      navigate('/auth');
      return;
    }

    setLoading(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to checkout",
        description: "You'll be redirected to our secure payment page.",
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Opening billing portal",
        description: "You'll be redirected to manage your subscription.",
      });
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    setLoading('cancel');
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully.",
      });

      // Refresh subscription data
      await handleRefreshSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view billing information and manage your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Flikkt
          </Button>
        </div>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get the medication analysis and safety features you need to stay healthy
            </p>
          </div>

          {/* Current Subscription Status */}
          {subscriptionData.subscribed && (
            <Card className="border-success bg-success-lighter">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold">{subscriptionData.subscription_tier || 'Basic'} Plan</p>
                    <p className="text-sm text-gray-600">
                      {subscriptionData.subscription_end 
                        ? `Renews on ${new Date(subscriptionData.subscription_end).toLocaleDateString()}`
                        : 'Active subscription'
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleManageSubscription} className="gap-2 flex-1">
                      <Settings className="w-4 h-4" />
                      Manage Subscription
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription} 
                      disabled={loading === 'cancel'}
                      className="gap-2 flex-1"
                    >
                      {loading === 'cancel' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Cancel Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="bg-blue-600 text-white">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-gray-900 mt-2">
                      ${plan.price}
                      <span className="text-lg font-normal text-gray-600">
                        /{plan.interval}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id}
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Subscribe to {plan.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes, you can cancel your subscription at any time. You'll continue to have access 
                    to your plan features until the end of your current billing period.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What happens to my data?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Your medication history and health data remain secure and accessible even 
                    after cancellation. We follow strict privacy guidelines to protect your information.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    We offer a 30-day money-back guarantee for all new subscriptions. 
                    Contact support if you're not satisfied with your plan.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I upgrade or downgrade?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Yes, you can change your plan at any time. Upgrades take effect immediately, 
                    while downgrades take effect at the next billing cycle.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trust Indicators */}
          <Card className="mt-8 border-success bg-success-lighter">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Trusted by Healthcare Professionals</h3>
                <div className="flex justify-center items-center gap-8 text-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">99.9%</div>
                    <div className="text-sm">Uptime</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">256-bit</div>
                    <div className="text-sm">SSL Encryption</div>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">HIPAA</div>
                    <div className="text-sm">Compliant</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Billing;