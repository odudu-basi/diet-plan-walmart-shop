
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { profile, planDetails } = await req.json();

    // Calculate BMR and daily calorie needs
    const bmr = calculateBMR(profile.age, profile.weight, profile.height, 'male'); // Simplified - could be improved
    const dailyCalories = planDetails.targetCalories || calculateDailyCalories(bmr, profile.activityLevel, profile.goal);

    const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a detailed weekly meal plan based on the user's profile and goals.

User Profile:
- Age: ${profile.age} years
- Weight: ${profile.weight} lbs
- Height: ${profile.height} inches
- Goal: ${profile.goal}
- Activity Level: ${profile.activityLevel}
- Daily Calorie Target: ${dailyCalories} calories
- Dietary Restrictions: ${profile.dietaryRestrictions.join(', ') || 'None'}
- Allergies: ${profile.allergies || 'None'}
- Budget Range: ${profile.budgetRange}

Plan Requirements:
- Duration: ${planDetails.duration} days
- Plan Name: ${planDetails.planName}
- Additional Notes: ${planDetails.additionalNotes || 'None'}

Create a comprehensive meal plan with breakfast, lunch, dinner, and snacks for each day. Each meal should include:
1. Meal name
2. Detailed cooking instructions
3. Prep time and cook time
4. Number of servings
5. Estimated calories per serving
6. Complete ingredient list with quantities and units
7. Ingredient categories for shopping organization
8. Estimated cost per ingredient (in USD)

Focus on:
- Meeting the user's specific health goals
- Accommodating dietary restrictions and allergies
- Staying within budget constraints
- Providing variety and balanced nutrition
- Realistic prep times for busy lifestyles

Return the response as a JSON object with this exact structure:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast|lunch|dinner|snack",
      "dayOfWeek": 0-6,
      "instructions": "Detailed cooking instructions",
      "prepTime": 15,
      "cookTime": 20,
      "servings": 2,
      "calories": 450,
      "ingredients": [
        {
          "name": "Ingredient name",
          "quantity": 1.5,
          "unit": "cups",
          "category": "Dairy",
          "estimatedCost": 2.50
        }
      ]
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${planDetails.duration}-day meal plan for "${planDetails.planName}".` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse JSON response
    let mealPlan;
    try {
      mealPlan = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }

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

// Helper functions
function calculateBMR(age: number, weight: number, height: number, gender: string): number {
  // Harris-Benedict equation (simplified - using male formula)
  return 88.362 + (13.397 * weight * 0.453592) + (4.799 * height * 2.54) - (5.677 * age);
}

function calculateDailyCalories(bmr: number, activityLevel: string, goal: string): number {
  let activityMultiplier = 1.2; // sedentary
  
  switch (activityLevel) {
    case 'light':
      activityMultiplier = 1.375;
      break;
    case 'moderate':
      activityMultiplier = 1.55;
      break;
    case 'very':
      activityMultiplier = 1.725;
      break;
    case 'extra':
      activityMultiplier = 1.9;
      break;
  }
  
  let calories = bmr * activityMultiplier;
  
  // Adjust based on goal
  switch (goal) {
    case 'lose-weight':
      calories -= 500; // 1lb per week deficit
      break;
    case 'gain-weight':
    case 'build-muscle':
      calories += 300; // Moderate surplus
      break;
    default:
      // maintain weight - no change
      break;
  }
  
  return Math.round(calories);
}
