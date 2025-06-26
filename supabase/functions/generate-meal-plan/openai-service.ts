
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
          { role: 'user', content: `Create ${planDetails.duration} days of meals. Return ONLY JSON.` }
        ],
        temperature: 0.1, // Lower for more consistent, faster responses
        max_tokens: 4000, // Reduced from 8000 for faster generation
        top_p: 0.9, // Add for more focused responses
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
    
    return `Create a ${planDetails.duration}-day meal plan. Each day needs breakfast, lunch, dinner, and 1 snack.

Profile: ${profile.age}y, ${profile.weight}lbs, ${profile.goal}, ${profile.activityLevel} activity, ${dailyCalories} daily calories
Restrictions: ${restrictions}
Allergies: ${allergies}
Budget: ${profile.budgetRange}

Return JSON only:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast|lunch|dinner|snack",
      "dayOfWeek": 0-${planDetails.duration - 1},
      "instructions": "Brief cooking steps",
      "prepTime": 15,
      "cookTime": 20,
      "servings": 2,
      "calories": 400,
      "ingredients": [
        {
          "name": "Ingredient",
          "quantity": 1,
          "unit": "cup",
          "category": "Protein",
          "estimatedCost": 2.5
        }
      ]
    }
  ]
}

Make meals simple, affordable, and aligned with the goal. Keep instructions concise.`;
  }

  private parseResponse(generatedContent: string): MealPlan {
    console.log('Parsing AI response...');

    try {
      let jsonString = generatedContent.trim();
      
      // Extract JSON from response
      const startIndex = jsonString.indexOf('{');
      const lastIndex = jsonString.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        jsonString = jsonString.substring(startIndex, lastIndex + 1);
      }
      
      // Quick fix for common truncation issues
      if (!jsonString.endsWith('}')) {
        const lastCompleteObject = jsonString.lastIndexOf('    }');
        if (lastCompleteObject !== -1) {
          jsonString = jsonString.substring(0, lastCompleteObject + 5) + '\n  ]\n}';
        }
      }
      
      const mealPlan = JSON.parse(jsonString);
      
      // Validate structure
      if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure: missing meals array');
      }
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      throw new Error(`Invalid response format from AI: ${parseError.message}`);
    }
  }
}
