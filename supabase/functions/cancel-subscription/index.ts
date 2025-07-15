import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key for database updates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find the customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Find active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });
    
    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found to cancel");
    }

    // Cancel all active subscriptions for this customer
    const cancelledSubscriptions = [];
    let subscriptionEndDate = null;
    
    for (const subscription of subscriptions.data) {
      logStep("Cancelling subscription", { subscriptionId: subscription.id });
      const cancelledSub = await stripe.subscriptions.cancel(subscription.id);
      cancelledSubscriptions.push(cancelledSub);
      
      // Keep track of when the subscription period ends
      if (cancelledSub.current_period_end) {
        const endDate = new Date(cancelledSub.current_period_end * 1000);
        if (!subscriptionEndDate || endDate > subscriptionEndDate) {
          subscriptionEndDate = endDate;
        }
      }
      
      logStep("Subscription cancelled", { 
        subscriptionId: cancelledSub.id, 
        status: cancelledSub.status,
        current_period_end: subscriptionEndDate?.toISOString()
      });
    }

    // Update the subscribers table - keep subscribed true until end of billing period
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: true, // Keep true until billing period ends
      subscription_tier: null, // Clear tier to indicate cancelled
      subscription_end: subscriptionEndDate?.toISOString() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with cancellation", { 
      subscribed: true, 
      subscription_end: subscriptionEndDate?.toISOString(),
      message: "User will retain access until billing period ends"
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cancelled successfully",
      cancelled_subscriptions: cancelledSubscriptions.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});