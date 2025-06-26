
import { UserProfile, PlanDetails, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    const systemPrompt = this.buildSystemPrompt(profile, planDetails, dailyCalories);

    console.log('Calling OpenAI API...');
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
          { role: 'user', content: `Generate a ${planDetails.duration}-day meal plan. Respond with ONLY valid JSON.` }
        ],
        temperature: 0.2,
        max_tokens: 8000,
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

  private buildSystemPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): string {
    return `You are a professional nutritionist and meal planning expert. Create a detailed meal plan based on the user's profile and goals.

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

Create a meal plan with breakfast, lunch, dinner, and one snack for ${planDetails.duration} days. Each meal should include:
1. Meal name
2. Cooking instructions (keep concise)
3. Prep time and cook time
4. Number of servings
5. Estimated calories per serving
6. Complete ingredient list with quantities, units, categories, and estimated costs

CRITICAL: You must respond with ONLY valid JSON. No explanatory text, no markdown, no additional content.

Response format:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast|lunch|dinner|snack",
      "dayOfWeek": 0-6,
      "instructions": "Concise cooking instructions",
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
  }

  private parseResponse(generatedContent: string): MealPlan {
    console.log('Raw AI response length:', generatedContent.length);

    try {
      let jsonString = generatedContent.trim();
      
      // Extract JSON from response
      const startIndex = jsonString.indexOf('{');
      const lastIndex = jsonString.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        jsonString = jsonString.substring(startIndex, lastIndex + 1);
      }
      
      console.log('Attempting to parse JSON...');
      
      // Try to fix common JSON truncation issues
      if (!jsonString.endsWith('}')) {
        console.log('Response appears truncated, attempting to fix...');
        
        // Find the last complete meal object
        const lastCompleteObject = jsonString.lastIndexOf('    }');
        if (lastCompleteObject !== -1) {
          jsonString = jsonString.substring(0, lastCompleteObject + 5) + '\n  ]\n}';
        }
      }
      
      const mealPlan = JSON.parse(jsonString);
      
      // Validate the structure
      if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure: missing meals array');
      }
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Response content preview:', generatedContent.substring(0, 500));
      throw new Error(`Invalid response format from AI: ${parseError.message}`);
    }
  }
}
