
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
    const bmr = calculateBMR(profile.age, profile.weight, profile.height, 'male'); // Simplified - could be improved
    const dailyCalories = planDetails.targetCalories || calculateDailyCalories(bmr, profile.activityLevel, profile.goal);

    // Initialize OpenAI service
    const openAIService = new OpenAIService(openAIApiKey!);
    
    // Generate meal plan
    const mealPlan = await openAIService.generateMealPlan(profile, planDetails, dailyCalories);

    return new Response(JSON.stringify(mealPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
