
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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    const { profile, planDetails }: { profile: UserProfile; planDetails: PlanDetails } = requestBody;

    console.log('Processing meal plan request for duration:', planDetails.duration);

    // Validate required data
    if (!profile || !planDetails) {
      throw new Error('Missing profile or plan details');
    }

    if (!profile.age || !profile.weight || !profile.height || !profile.goal) {
      throw new Error('Incomplete profile data - missing age, weight, height, or goal');
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
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate meal plan',
      type: error.constructor.name 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
