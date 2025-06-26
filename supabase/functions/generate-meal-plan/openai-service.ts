
import { UserProfile, PlanDetails, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    const systemPrompt = this.buildOptimizedSystemPrompt(profile, planDetails, dailyCalories);

    console.log('Calling OpenAI API with optimized settings...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate exactly ${planDetails.duration} days of meals. Return ONLY valid JSON.` }
        ],
        temperature: 0.3,
        max_tokens: 6000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response structure from OpenAI');
    }

    return this.parseResponse(data.choices[0].message.content);
  }

  private buildOptimizedSystemPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): string {
    const restrictions = profile.dietaryRestrictions.length > 0 ? profile.dietaryRestrictions.join(', ') : 'None';
    const allergies = profile.allergies || 'None';
    
    return `You are a professional nutritionist creating a ${planDetails.duration}-day meal plan.

PROFILE:
- Age: ${profile.age}, Weight: ${profile.weight}lbs, Goal: ${profile.goal}
- Activity: ${profile.activityLevel}, Daily calories: ${dailyCalories}
- Restrictions: ${restrictions}, Allergies: ${allergies}
- Budget: ${profile.budgetRange}

REQUIREMENTS:
- Create exactly ${planDetails.duration} days of meals
- Each day needs: breakfast, lunch, dinner, snack (4 meals per day)
- Keep meals simple and budget-friendly
- Use common ingredients
- Instructions should be brief (2-3 sentences max)

RETURN FORMAT - ONLY JSON:
{
  "meals": [
    {
      "name": "Scrambled Eggs with Toast",
      "type": "breakfast",
      "dayOfWeek": 0,
      "instructions": "Scramble 2 eggs in butter. Serve with whole grain toast.",
      "prepTime": 5,
      "cookTime": 5,
      "servings": 1,
      "calories": 350,
      "ingredients": [
        {
          "name": "Eggs",
          "quantity": 2,
          "unit": "pieces",
          "category": "Protein",
          "estimatedCost": 1.5
        },
        {
          "name": "Whole grain bread",
          "quantity": 2,
          "unit": "slices",
          "category": "Grains",
          "estimatedCost": 1.0
        }
      ]
    }
  ]
}

Generate ${planDetails.duration * 4} total meals (${planDetails.duration} days × 4 meals per day).
Day numbering: 0 to ${planDetails.duration - 1}.
Meal types: breakfast, lunch, dinner, snack.
Return ONLY the JSON object.`;
  }

  private parseResponse(generatedContent: string): MealPlan {
    console.log('Parsing AI response...');

    try {
      let jsonString = generatedContent.trim();
      
      // Remove any markdown formatting
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Extract JSON from response
      const startIndex = jsonString.indexOf('{');
      const lastIndex = jsonString.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        jsonString = jsonString.substring(startIndex, lastIndex + 1);
      }
      
      console.log('Attempting to parse JSON...');
      const mealPlan = JSON.parse(jsonString);
      
      // Validate structure
      if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure: missing meals array');
      }
      
      // Validate each meal has required fields
      for (const meal of mealPlan.meals) {
        if (!meal.name || !meal.type || meal.dayOfWeek === undefined || !meal.ingredients) {
          console.error('Invalid meal structure:', meal);
          throw new Error('Invalid meal structure: missing required fields');
        }
        
        // Ensure ingredients array is valid
        if (!Array.isArray(meal.ingredients)) {
          throw new Error('Invalid meal structure: ingredients must be an array');
        }
      }
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Raw response:', generatedContent);
      throw new Error(`Invalid response format from AI: ${parseError.message}`);
    }
  }
}
