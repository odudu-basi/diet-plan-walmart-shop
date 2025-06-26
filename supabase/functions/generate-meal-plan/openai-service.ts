
import { UserProfile, PlanDetails, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    const systemPrompt = this.buildCompactSystemPrompt(profile, planDetails, dailyCalories);

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
          { role: 'user', content: `Generate exactly ${planDetails.duration} days of meals. Return ONLY valid JSON with no extra text.` }
        ],
        temperature: 0.1,
        max_tokens: 3000,
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

    return this.parseResponse(data.choices[0].message.content, planDetails);
  }

  private buildCompactSystemPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): string {
    const restrictions = profile.dietaryRestrictions.length > 0 ? profile.dietaryRestrictions.join(', ') : 'None';
    const allergies = profile.allergies || 'None';
    
    return `Create a ${planDetails.duration}-day meal plan.

Profile: ${profile.goal}, ${dailyCalories} cal/day, Restrictions: ${restrictions}, Allergies: ${allergies}, Budget: ${profile.budgetRange}

Return ONLY this JSON structure with ${planDetails.duration * 4} meals:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast",
      "dayOfWeek": 0,
      "instructions": "Brief steps",
      "prepTime": 5,
      "cookTime": 10,
      "servings": 1,
      "calories": 300,
      "ingredients": [
        {"name": "Item", "quantity": 1, "unit": "cup", "category": "Protein", "estimatedCost": 2}
      ]
    }
  ]
}

Requirements:
- ${planDetails.duration} days (0 to ${planDetails.duration - 1})
- 4 meals per day: breakfast, lunch, dinner, snack
- Simple ingredients only
- Brief instructions
- Valid JSON only`;
  }

  private parseResponse(generatedContent: string, planDetails: PlanDetails): MealPlan {
    console.log('Parsing AI response...');

    try {
      // Clean the response content
      let jsonString = generatedContent.trim();
      
      // Remove markdown code blocks
      if (jsonString.includes('```')) {
        const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        } else {
          jsonString = jsonString.replace(/```[^`]*```/g, '').trim();
        }
      }
      
      // Find JSON boundaries
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('No valid JSON structure found');
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      
      // Clean control characters and fix common JSON issues
      jsonString = this.sanitizeJsonString(jsonString);
      
      console.log('Attempting to parse JSON...');
      const mealPlan = JSON.parse(jsonString);
      
      // Validate structure
      if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure: missing meals array');
      }
      
      // Validate meals
      mealPlan.meals = this.validateAndFixMeals(mealPlan.meals, planDetails);
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Response preview:', generatedContent.substring(0, 200));
      
      // Return fallback meal plan
      console.log('Generating fallback meal plan...');
      return this.generateFallbackMealPlan(planDetails.duration);
    }
  }

  private sanitizeJsonString(jsonString: string): string {
    // Remove control characters that cause JSON parsing errors
    jsonString = jsonString.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Fix trailing commas
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete strings
    jsonString = jsonString.replace(/("[^"]*$)/gm, '$1"');
    
    // Remove any text after the last closing brace
    const lastBrace = jsonString.lastIndexOf('}');
    if (lastBrace !== -1) {
      jsonString = jsonString.substring(0, lastBrace + 1);
    }
    
    return jsonString;
  }

  private validateAndFixMeals(meals: any[], planDetails: PlanDetails): any[] {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const expectedMealCount = planDetails.duration * 4;
    
    // Fix incomplete meals
    const validMeals = meals.map((meal: any, index: number) => {
      const dayOfWeek = Math.floor(index / 4);
      const mealTypeIndex = index % 4;
      
      return {
        name: meal.name || `Meal ${index + 1}`,
        type: meal.type || mealTypes[mealTypeIndex],
        dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : dayOfWeek,
        instructions: meal.instructions || 'Simple preparation',
        prepTime: meal.prepTime || 5,
        cookTime: meal.cookTime || 10,
        servings: meal.servings || 1,
        calories: meal.calories || 300,
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : []
      };
    });
    
    // Ensure we have the right number of meals
    while (validMeals.length < expectedMealCount) {
      const index = validMeals.length;
      const dayOfWeek = Math.floor(index / 4);
      const mealTypeIndex = index % 4;
      
      validMeals.push({
        name: `Simple ${mealTypes[mealTypeIndex]}`,
        type: mealTypes[mealTypeIndex],
        dayOfWeek,
        instructions: 'Quick and easy preparation',
        prepTime: 5,
        cookTime: 5,
        servings: 1,
        calories: 250,
        ingredients: [
          { name: 'Basic ingredient', quantity: 1, unit: 'serving', category: 'Other', estimatedCost: 2 }
        ]
      });
    }
    
    return validMeals.slice(0, expectedMealCount);
  }

  private generateFallbackMealPlan(duration: number): MealPlan {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const fallbackMeals = {
      breakfast: { name: 'Scrambled Eggs', calories: 300, ingredients: [{ name: 'Eggs', quantity: 2, unit: 'pieces', category: 'Protein', estimatedCost: 1.5 }] },
      lunch: { name: 'Turkey Sandwich', calories: 400, ingredients: [{ name: 'Turkey', quantity: 3, unit: 'slices', category: 'Protein', estimatedCost: 2.0 }] },
      dinner: { name: 'Grilled Chicken', calories: 500, ingredients: [{ name: 'Chicken Breast', quantity: 1, unit: 'piece', category: 'Protein', estimatedCost: 3.0 }] },
      snack: { name: 'Greek Yogurt', calories: 150, ingredients: [{ name: 'Greek Yogurt', quantity: 1, unit: 'cup', category: 'Dairy', estimatedCost: 1.0 }] }
    };
    
    const meals = [];
    for (let day = 0; day < duration; day++) {
      for (let mealIndex = 0; mealIndex < 4; mealIndex++) {
        const mealType = mealTypes[mealIndex] as keyof typeof fallbackMeals;
        const template = fallbackMeals[mealType];
        
        meals.push({
          name: template.name,
          type: mealType,
          dayOfWeek: day,
          instructions: 'Simple preparation as needed',
          prepTime: 5,
          cookTime: 10,
          servings: 1,
          calories: template.calories,
          ingredients: template.ingredients
        });
      }
    }
    
    return { meals };
  }
}
