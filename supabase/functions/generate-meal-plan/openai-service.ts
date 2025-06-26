
import { UserProfile, PlanDetails, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    const systemPrompt = this.buildCompactSystemPrompt(profile, planDetails, dailyCalories);

    console.log('Calling OpenAI API with compact settings...');
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
        temperature: 0.2, // Lower temperature for more consistent output
        max_tokens: 4000, // Reduced token limit to prevent truncation
        top_p: 0.8,
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

  private buildCompactSystemPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): string {
    const restrictions = profile.dietaryRestrictions.length > 0 ? profile.dietaryRestrictions.join(', ') : 'None';
    const allergies = profile.allergies || 'None';
    
    return `Create a ${planDetails.duration}-day meal plan for:
- Goal: ${profile.goal}, Calories: ${dailyCalories}/day
- Restrictions: ${restrictions}, Allergies: ${allergies}
- Budget: ${profile.budgetRange}

Requirements:
- ${planDetails.duration} days × 4 meals (breakfast, lunch, dinner, snack)
- Simple recipes, brief instructions
- Common ingredients only
- Compact JSON format

JSON format:
{
  "meals": [
    {
      "name": "Meal Name",
      "type": "breakfast|lunch|dinner|snack",
      "dayOfWeek": 0,
      "instructions": "Brief steps",
      "prepTime": 5,
      "cookTime": 10,
      "servings": 1,
      "calories": 300,
      "ingredients": [
        {"name": "Ingredient", "quantity": 1, "unit": "cup", "category": "Protein", "estimatedCost": 2}
      ]
    }
  ]
}

Generate ${planDetails.duration * 4} meals total. Days 0-${planDetails.duration - 1}. Return ONLY JSON.`;
  }

  private parseResponse(generatedContent: string): MealPlan {
    console.log('Parsing AI response...');

    try {
      let jsonString = generatedContent.trim();
      
      // Remove markdown formatting
      if (jsonString.includes('```')) {
        const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        } else {
          // Fallback: remove all ```
          jsonString = jsonString.replace(/```[^`]*```/g, '').trim();
        }
      }
      
      // Find JSON boundaries more carefully
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('No valid JSON structure found');
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      
      // Clean up common JSON issues
      jsonString = this.cleanupJson(jsonString);
      
      console.log('Attempting to parse cleaned JSON...');
      const mealPlan = JSON.parse(jsonString);
      
      // Validate structure
      if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
        throw new Error('Invalid meal plan structure: missing meals array');
      }
      
      // Validate and fix each meal
      mealPlan.meals = mealPlan.meals.map((meal: any, index: number) => {
        if (!meal.name || !meal.type || meal.dayOfWeek === undefined) {
          console.warn(`Fixing incomplete meal at index ${index}:`, meal);
          return {
            name: meal.name || `Meal ${index + 1}`,
            type: meal.type || (index % 4 === 0 ? 'breakfast' : index % 4 === 1 ? 'lunch' : index % 4 === 2 ? 'dinner' : 'snack'),
            dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : Math.floor(index / 4),
            instructions: meal.instructions || 'Simple preparation',
            prepTime: meal.prepTime || 5,
            cookTime: meal.cookTime || 10,
            servings: meal.servings || 1,
            calories: meal.calories || 300,
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : []
          };
        }
        
        // Ensure ingredients array is valid
        if (!Array.isArray(meal.ingredients)) {
          meal.ingredients = [];
        }
        
        return meal;
      });
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Raw response length:', generatedContent.length);
      console.error('First 500 chars:', generatedContent.substring(0, 500));
      console.error('Last 500 chars:', generatedContent.substring(Math.max(0, generatedContent.length - 500)));
      
      // Return a fallback meal plan
      console.log('Generating fallback meal plan...');
      return this.generateFallbackMealPlan(parseInt(planDetails.duration.toString()));
    }
  }

  private cleanupJson(jsonString: string): string {
    // Remove trailing commas before closing brackets/braces
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete strings (add closing quotes if missing)
    jsonString = jsonString.replace(/("[^"]*$)/gm, '$1"');
    
    // Remove any trailing incomplete elements
    const lines = jsonString.split('\n');
    const cleanLines = [];
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (const line of lines) {
      let validLine = true;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === '{' || char === '[') {
            braceCount++;
          } else if (char === '}' || char === ']') {
            braceCount--;
          }
        }
      }
      
      if (validLine) {
        cleanLines.push(line);
      }
    }
    
    return cleanLines.join('\n');
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
