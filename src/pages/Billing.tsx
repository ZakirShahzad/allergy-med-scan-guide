import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Crown, Shield, Users, Zap, CreditCard, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRateLimitedFunction } from '@/hooks/useRateLimitedFunction';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
const Billing = () => {
  const {
    user,
    subscriptionData,
    refreshSubscription
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    invokeFunction,
    loading: functionLoading
  } = useRateLimitedFunction();
  const [cancelLoading, setCancelLoading] = useState(false);

  // Listen for messages from payment windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'PAYMENT_SUCCESS') {
        toast({
          title: "Payment successful!",
          description: "Refreshing subscription..."
        });
        setTimeout(() => {
          refreshSubscription();
        }, 1000);
      } else if (event.data.type === 'PAYMENT_CANCELLED') {
        toast({
          title: "Payment cancelled",
          description: "Your payment was cancelled."
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshSubscription, toast]);
  const handleRefreshSubscription = async () => {
    try {
      await refreshSubscription();
      toast({
        title: "Subscription refreshed",
        description: "Your subscription status has been updated."
      });
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh subscription status."
      });
    }
  };
  const plans = [{
    id: 'free',
    name: 'Free Trial',
    price: 0,
    interval: 'forever',
    features: ['5 scans per month', 'Basic medication analysis', 'Safety warnings and alerts'],
    badge: null,
    popular: false,
    icon: Zap,
    description: 'Perfect for trying out our medication safety features'
  }, {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    features: ['50 scans per month', 'Complete medication analysis', 'Safety warnings and alerts'],
    badge: null,
    popular: false,
    icon: Shield
  }, {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    features: ['Unlimited scans', 'Complete medication analysis', 'Safety warnings and alerts'],
    badge: 'Most Popular',
    popular: true,
    icon: Crown
  }];
  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan."
      });
      navigate('/auth');
      return;
    }
    try {
      const {
        data,
        error
      } = await invokeFunction('create-checkout', {
        body: {
          planId
        }
      });
      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast({
        title: "Redirecting to checkout",
        description: "You'll be redirected to our secure payment page."
      });
// added for ios compatability
      // Open Stripe Checkout in an in-app browser (SFSafariViewController)
      await Browser.open({
        url: data.url,
        presentationStyle: 'fullscreen',
      });


    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create checkout session. Please try again."
      });
    }
  };
  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const {
        data,
        error
      } = await invokeFunction('cancel-subscription');
      if (error) throw error;
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully. Your access to premium features has been removed."
      });

      // Refresh subscription status
      await refreshSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel subscription. Please try again."
      });
    } finally {
      setCancelLoading(false);
    }
  };
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
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
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
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
          {subscriptionData.subscribed && <Card className="border-success bg-success-lighter">
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
                      {subscriptionData.subscription_end ? 
                        (new Date(subscriptionData.subscription_end) < new Date() ? 
                          'Subscription expired' : 
                          `Active until ${new Date(subscriptionData.subscription_end).toLocaleDateString()}`) : 
                        'Active subscription'}
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <X className="w-4 h-4" />
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Cancel Subscription
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your subscription? Your access to premium 
                            scan limits will be removed immediately upon cancellation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription} disabled={cancelLoading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {cancelLoading ? <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Cancelling...
                              </div> : 'Yes, Cancel Subscription'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>}


          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-8 justify-center">
            {plans.map(plan => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === 'free' && !subscriptionData.subscribed || plan.id === 'basic' && subscriptionData.subscribed && (subscriptionData.subscription_tier === 'Basic' || subscriptionData.subscription_tier === 'Family') || plan.id === 'premium' && subscriptionData.subscribed && subscriptionData.subscription_tier === 'Premium';
            const isLoading = functionLoading === 'create-checkout';
            return <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''} ${isCurrentPlan ? 'border-green-500 border-2 bg-green-50' : ''}`}>
                  {plan.badge && !isCurrentPlan && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="bg-blue-600 text-white">
                        {plan.badge}
                      </Badge>
                    </div>}
                  
                  {isCurrentPlan && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="bg-green-600 text-white">
                        Current Plan
                      </Badge>
                    </div>}
                  
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
                      {plan.features.map((feature, index) => <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>)}
                    </ul>
                    
                    {isCurrentPlan ? <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button> : plan.id === 'free' ? <Button variant="outline" className="w-full" disabled>
                        Free Trial
                      </Button> : <Button onClick={() => handleSubscribe(plan.id)} disabled={isLoading} className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                        {isLoading ? <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Processing...
                          </div> : <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Subscribe to {plan.name}
                          </>}
                      </Button>}
                  </CardContent>
                </Card>;
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
                    Yes, you can cancel your subscription at any time. When you cancel, your access 
                    to premium scan limits will be removed immediately.
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
                  <p className="text-gray-600">Yes, you can change your plan at any time. Upgrades and downgrades take effect immediately.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Trust Indicators */}
          <Card className="mt-8 border-success bg-success-lighter">
            
          </Card>
        </div>
      </div>
    </div>;
};
export default Billing;