
import { UserProfile, PlanDetails, Meal, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    // Calculate personalized nutrition targets
    const bmi = this.calculateBMI(profile.weight, profile.height);
    const macroStrategy = this.getMacroStrategy(profile.goal, bmi);
    
    console.log('Generating meal plan with personalized nutrition:', {
      bmi,
      macroStrategy,
      dailyCalories,
      goal: profile.goal
    });

    const prompt = this.buildWalmartMealPlanPrompt(profile, planDetails, dailyCalories, macroStrategy);
    
    try {
      console.log('Calling OpenAI API with Walmart-specific meal generation...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a nutrition expert and meal planning specialist with extensive knowledge of Walmart grocery availability and pricing. Create diverse, goal-specific meal plans using only ingredients commonly available at Walmart.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8, // Higher temperature for more variety
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI API response received');

      const content = data.choices[0].message.content;
      console.log('Parsing AI response...');
      
      return this.parseAIResponse(content, planDetails.duration);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private buildWalmartMealPlanPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number, macroStrategy: any): string {
    const walmartIngredients = `
    Focus on these Walmart-available ingredients:
    - Proteins: chicken breast, ground beef, salmon, eggs, Greek yogurt, canned tuna
    - Vegetables: broccoli, spinach, bell peppers, onions, carrots, tomatoes, frozen mixed vegetables
    - Grains: brown rice, quinoa, whole wheat bread, oats, whole wheat pasta
    - Dairy: milk, cheese, cottage cheese
    - Pantry: olive oil, garlic, black beans, canned tomatoes, spices
    `;

    return `
    Create a ${planDetails.duration}-day personalized meal plan for a ${profile.age}-year-old with the following profile:
    
    PERSONAL DETAILS:
    - Current weight: ${profile.weight} lbs
    - Height: ${profile.height} inches  
    - Goal: ${profile.goal}
    - Activity level: ${profile.activityLevel}
    - Daily calorie target: ${dailyCalories} calories
    - Dietary restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'}
    - Budget range: $${profile.budgetRange || '50-100'} per week
    
    NUTRITION STRATEGY:
    ${macroStrategy.description}
    - Protein: ${macroStrategy.protein}% of calories
    - Carbs: ${macroStrategy.carbs}% of calories  
    - Fat: ${macroStrategy.fat}% of calories
    
    WALMART INGREDIENT REQUIREMENTS:
    ${walmartIngredients}
    
    MEAL VARIETY REQUIREMENTS:
    - NO meal should repeat during the plan
    - Use different protein sources each day
    - Vary cooking methods (grilled, baked, sautéed, etc.)
    - Include different cuisines (American, Mediterranean, Asian-inspired, Mexican)
    - Rotate vegetable combinations
    - Mix different grain/starch options
    
    MEAL STRUCTURE (${Math.round(dailyCalories)} calories/day):
    - Breakfast: ${Math.round(dailyCalories * 0.25)} calories
    - Lunch: ${Math.round(dailyCalories * 0.35)} calories  
    - Dinner: ${Math.round(dailyCalories * 0.40)} calories
    
    Generate exactly ${planDetails.duration * 3} unique meals (breakfast, lunch, dinner for each day).
    
    Return ONLY valid JSON in this exact format:
    {
      "meals": [
        {
          "name": "Unique meal name",
          "type": "breakfast|lunch|dinner",
          "dayOfWeek": 0-6,
          "instructions": "Detailed cooking instructions",
          "prepTime": 15,
          "cookTime": 20,
          "servings": 1,
          "calories": 400,
          "ingredients": [
            {
              "name": "ingredient name",
              "quantity": 1.5,
              "unit": "cup",
              "category": "Produce|Meat|Dairy|Pantry",
              "estimatedCost": 2.99
            }
          ]
        }
      ]
    }
    
    CRITICAL: Ensure all ingredients are commonly available at Walmart and include realistic estimated costs.
    `;
  }

  private calculateBMI(weight: number, height: number): number {
    const heightMeters = height * 0.0254;
    const weightKg = weight * 0.453592;
    return weightKg / (heightMeters * heightMeters);
  }

  private getMacroStrategy(goal: string, bmi: number) {
    switch (goal) {
      case 'lose-weight':
        return {
          description: 'Higher protein, moderate carbs, lower fat for weight loss',
          protein: 35,
          carbs: 40,
          fat: 25
        };
      case 'gain-weight':
      case 'build-muscle':
        return {
          description: 'High protein, moderate carbs and fats for muscle building',
          protein: 30,
          carbs: 45,
          fat: 25
        };
      default:
        return {
          description: 'Balanced macronutrients for weight maintenance',
          protein: 25,
          carbs: 50,
          fat: 25
        };
    }
  }

  private parseAIResponse(content: string, duration: number): MealPlan {
    try {
      console.log('Attempting to parse JSON...');
      
      // Clean the response
      let cleanedContent = content.trim();
      
      // Remove any markdown formatting
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanedContent);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid meal plan structure');
      }
      
      console.log(`Parsed meal plan with ${parsed.meals.length} meals`);
      return parsed;
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Response preview:', content.substring(0, 200) + '...');
      
      // Generate diverse fallback meal plan
      console.log('Generating diverse fallback meal plan...');
      return this.generateDiverseFallbackMealPlan(duration);
    }
  }

  private generateDiverseFallbackMealPlan(duration: number): MealPlan {
    const meals: Meal[] = [];
    
    // Diverse breakfast options
    const breakfasts = [
      { name: "Greek Yogurt Parfait with Berries", protein: "Greek yogurt", style: "healthy" },
      { name: "Scrambled Eggs with Spinach", protein: "eggs", style: "classic" },
      { name: "Overnight Oats with Banana", protein: "oats", style: "prep-ahead" },
      { name: "Avocado Toast with Egg", protein: "eggs", style: "trendy" },
      { name: "Protein Berry Smoothie", protein: "protein powder", style: "quick" },
      { name: "Whole Grain Pancakes", protein: "eggs", style: "weekend" },
      { name: "Breakfast Burrito Bowl", protein: "eggs", style: "Mexican" }
    ];
    
    // Diverse lunch options
    const lunches = [
      { name: "Grilled Chicken Caesar Salad", protein: "chicken", style: "Mediterranean" },
      { name: "Quinoa Buddha Bowl", protein: "quinoa", style: "plant-based" },
      { name: "Turkey and Avocado Wrap", protein: "turkey", style: "sandwich" },
      { name: "Asian Chicken Stir-fry", protein: "chicken", style: "Asian" },
      { name: "Mediterranean Tuna Salad", protein: "tuna", style: "Mediterranean" },
      { name: "Black Bean and Rice Bowl", protein: "beans", style: "Mexican" },
      { name: "Salmon Poke Bowl", protein: "salmon", style: "Hawaiian" }
    ];
    
    // Diverse dinner options
    const dinners = [
      { name: "Baked Salmon with Roasted Vegetables", protein: "salmon", style: "healthy" },
      { name: "Lean Beef Stir-fry with Brown Rice", protein: "beef", style: "Asian" },
      { name: "Chicken Fajita Bowls", protein: "chicken", style: "Mexican" },
      { name: "Mediterranean Chicken Skillet", protein: "chicken", style: "Mediterranean" },
      { name: "Turkey Meatballs with Pasta", protein: "turkey", style: "Italian" },
      { name: "Cod Fish Tacos", protein: "fish", style: "Mexican" },
      { name: "Chicken Teriyaki with Vegetables", protein: "chicken", style: "Asian" }
    ];
    
    for (let day = 0; day < duration; day++) {
      // Breakfast
      const breakfast = breakfasts[day % breakfasts.length];
      meals.push({
        name: breakfast.name,
        type: "breakfast",
        dayOfWeek: day,
        instructions: `Prepare ${breakfast.name} using fresh Walmart ingredients`,
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        calories: 350,
        ingredients: this.getDefaultIngredients("breakfast")
      });
      
      // Lunch
      const lunch = lunches[day % lunches.length];
      meals.push({
        name: lunch.name,
        type: "lunch",
        dayOfWeek: day,
        instructions: `Prepare ${lunch.name} with fresh Walmart ingredients`,
        prepTime: 15,
        cookTime: 20,
        servings: 1,
        calories: 450,
        ingredients: this.getDefaultIngredients("lunch")
      });
      
      // Dinner
      const dinner = dinners[day % dinners.length];
      meals.push({
        name: dinner.name,
        type: "dinner",
        dayOfWeek: day,
        instructions: `Cook ${dinner.name} using quality Walmart ingredients`,
        prepTime: 20,
        cookTime: 25,
        servings: 1,
        calories: 550,
        ingredients: this.getDefaultIngredients("dinner")
      });
    }
    
    console.log(`Generated diverse fallback meal plan with ${meals.length} unique meals`);
    return { meals };
  }

  private getDefaultIngredients(mealType: string) {
    const baseIngredients = [
      { name: "olive oil", quantity: 1, unit: "tbsp", category: "Pantry", estimatedCost: 0.25 },
      { name: "garlic", quantity: 1, unit: "clove", category: "Produce", estimatedCost: 0.15 },
      { name: "onion", quantity: 0.25, unit: "cup", category: "Produce", estimatedCost: 0.30 }
    ];
    
    if (mealType === "breakfast") {
      return [
        { name: "eggs", quantity: 2, unit: "large", category: "Dairy", estimatedCost: 0.50 },
        { name: "spinach", quantity: 1, unit: "cup", category: "Produce", estimatedCost: 0.75 },
        ...baseIngredients
      ];
    } else if (mealType === "lunch") {
      return [
        { name: "chicken breast", quantity: 4, unit: "oz", category: "Meat", estimatedCost: 3.00 },
        { name: "mixed greens", quantity: 2, unit: "cups", category: "Produce", estimatedCost: 1.00 },
        ...baseIngredients
      ];
    } else {
      return [
        { name: "salmon fillet", quantity: 6, unit: "oz", category: "Meat", estimatedCost: 5.00 },
        { name: "broccoli", quantity: 1, unit: "cup", category: "Produce", estimatedCost: 0.80 },
        ...baseIngredients
      ];
    }
  }
}
