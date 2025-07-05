
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevenueCatWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number;
    environment: string;
    entitlement_ids: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json() as RevenueCatWebhookEvent;
    const { event } = body;

    console.log('RevenueCat webhook received:', event.type, 'for user:', event.app_user_id);

    // Extract user ID from app_user_id (assuming it's the Supabase user ID)
    const userId = event.app_user_id;

    // Update or create subscription record
    const subscriptionData = {
      user_id: userId,
      product_id: event.product_id,
      period_type: event.period_type,
      purchased_at: new Date(event.purchased_at_ms),
      expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
      environment: event.environment,
      entitlements: event.entitlement_ids,
      status: getSubscriptionStatus(event.type),
      updated_at: new Date()
    };

    if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
      // Create or update subscription
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Error upserting subscription:', upsertError);
        throw upsertError;
      }

      // Update user profile with premium status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          premium_expires_at: subscriptionData.expires_at
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

    } else if (event.type === 'CANCELLATION' || event.type === 'EXPIRATION') {
      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_premium: false,
          premium_expires_at: null
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }

    console.log('Successfully processed RevenueCat webhook for user:', userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process webhook',
      type: error.constructor.name 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSubscriptionStatus(eventType: string): string {
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      return 'active';
    case 'CANCELLATION':
      return 'cancelled';
    case 'EXPIRATION':
      return 'expired';
    default:
      return 'unknown';
  }
}
