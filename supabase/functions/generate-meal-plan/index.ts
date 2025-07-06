
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAIService } from './openai-service.ts';
import { calculateBMR, calculateDailyCalories } from './nutrition-calculator.ts';
import { UserProfile, PlanDetails } from './types.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting meal plan generation...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.',
        type: 'ConfigurationError'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request received:', JSON.stringify(requestBody, null, 2));
    
    const { profile, planDetails }: { profile: UserProfile; planDetails: PlanDetails } = requestBody;

    console.log('Processing meal plan request for duration:', planDetails.duration);

    // Validate required data
    if (!profile || !planDetails) {
      console.error('Missing profile or plan details');
      return new Response(JSON.stringify({ 
        error: 'Missing profile or plan details',
        type: 'ValidationError'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile.age || !profile.weight || !profile.height || !profile.goal) {
      console.error('Incomplete profile data:', profile);
      return new Response(JSON.stringify({ 
        error: 'Incomplete profile data - missing age, weight, height, or goal',
        type: 'ValidationError'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate BMR and daily calorie needs
    const bmr = calculateBMR(profile.age, profile.weight, profile.height, 'male');
    const dailyCalories = planDetails.targetCalories || calculateDailyCalories(bmr, profile.activityLevel, profile.goal);

    console.log('Calculated daily calories:', dailyCalories);

    // Initialize OpenAI service
    const openAIService = new OpenAIService(openAIApiKey);
    
    // Generate meal plan
    console.log('Starting meal plan generation...');
    const mealPlan = await openAIService.generateMealPlan(profile, planDetails, dailyCalories);

    console.log('Meal plan generated successfully with', mealPlan.meals.length, 'meals');
    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    
    let errorMessage = 'Failed to generate meal plan';
    let errorType = 'UnknownError';
    
    if (error.message?.includes('API key')) {
      errorMessage = 'OpenAI API key is invalid or missing';
      errorType = 'AuthenticationError';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'OpenAI API quota exceeded';
      errorType = 'QuotaError';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error connecting to OpenAI';
      errorType = 'NetworkError';
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      type: errorType,
      details: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
