
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
    const { profile, planDetails }: { profile: UserProfile; planDetails: PlanDetails } = await req.json();

    // Calculate BMR and daily calorie needs
    const bmr = calculateBMR(profile.age, profile.weight, profile.height, 'male');
    const dailyCalories = planDetails.targetCalories || calculateDailyCalories(bmr, profile.activityLevel, profile.goal);

    // Initialize OpenAI service
    const openAIService = new OpenAIService(openAIApiKey!);
    
    // Generate meal plan with no timeout - let it run as long as needed
    console.log('Starting meal plan generation...');
    const mealPlan = await openAIService.generateMealPlan(profile, planDetails, dailyCalories);

    console.log('Meal plan generated successfully with', mealPlan.meals.length, 'meals');
    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    
    // More detailed error logging
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error Details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      type: error.constructor.name 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
