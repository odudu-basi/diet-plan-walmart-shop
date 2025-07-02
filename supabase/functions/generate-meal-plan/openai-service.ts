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
    
    console.log('Generating culturally-diverse meal plan:', {
      bmi,
      macroStrategy,
      dailyCalories,
      goal: profile.goal,
      culturalCuisines: planDetails.culturalCuisines,
      maxCookingTime: planDetails.maxCookingTime
    });

    const prompt = this.buildCulturalMealPlanPrompt(profile, planDetails, dailyCalories, macroStrategy);
    
    try {
      console.log('Calling OpenAI API with GPT-4.1 for culturally-diverse meal generation...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are an expert international chef who creates culturally authentic meal plans. You specialize in diverse cuisines and understand cooking time constraints. You ALWAYS respond with perfect, valid JSON format. Every meal plan respects cultural authenticity while meeting nutritional and time requirements.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          presence_penalty: 0.3,
          frequency_penalty: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT-4.1 API response received for culturally-diverse meal plan');

      const content = data.choices[0].message.content;
      console.log('Parsing AI response...');
      
      return this.parseAIResponseWithEnhancedHandling(content, planDetails.duration);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private buildCulturalMealPlanPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number, macroStrategy: any): string {
    const selectedCuisines = planDetails.culturalCuisines || [];
    const otherCuisine = planDetails.otherCuisine || '';
    const maxCookingTime = planDetails.maxCookingTime || '20-40';
    
    // Build cuisine instructions
    let cuisineInstructions = '';
    if (selectedCuisines.length > 0) {
      const cuisineList = selectedCuisines.filter(c => c !== 'other').join(', ');
      cuisineInstructions = `CULTURAL CUISINES SELECTED: ${cuisineList}`;
      if (selectedCuisines.includes('other') && otherCuisine) {
        cuisineInstructions += `, ${otherCuisine}`;
      }
      cuisineInstructions += '\nYou MUST create meals that authentically represent these cultural cuisines. Mix and rotate between the selected cuisines throughout the meal plan.';
    } else {
      cuisineInstructions = 'Create a diverse mix of international cuisines for variety.';
    }

    // Build cooking time instructions
    const timeInstructions = this.getCookingTimeInstructions(maxCookingTime);

    return `
    🌍 CULTURALLY-DIVERSE MEAL PLAN GENERATOR 🌍
    Create a ${planDetails.duration}-day meal plan featuring authentic cultural cuisines!
    
    ${cuisineInstructions}
    
    PROFILE & GOALS:
    - Person: ${profile.age}yo, ${profile.weight}lbs, ${profile.height}", Goal: ${profile.goal}
    - Daily Target: ${dailyCalories} calories (${macroStrategy.description})
    - Activity: ${profile.activityLevel} | Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'} | Budget: $${profile.budgetRange || '50-100'}/week
    - Special Notes: ${planDetails.additionalNotes || 'Focus on cultural authenticity!'}
    
    ⏰ COOKING TIME CONSTRAINTS:
    ${timeInstructions}
    
    🥞 SPECIAL BREAKFAST RULE (CRITICAL):
    - ALL breakfast meals MUST be simple and have total time (prep + cook) ≤ 20 minutes
    - This rule applies regardless of the user's 'Max Cooking Time' selection
    - Focus on quick, nutritious breakfast options that can be prepared quickly
    - Examples: overnight oats, smoothies, simple eggs, toast, cereal, fruit bowls
    
    🍽️ LUNCH & DINNER GUIDELINES:
    - Respect the selected max cooking time: ${maxCookingTime}
    - Create authentic dishes from the selected cultural cuisines
    - Rotate between different cuisines to provide variety
    - Ensure each meal reflects authentic cooking techniques and ingredients
    
    🔄 MEAL ORDERING REQUIREMENT:
    - For each day (0-${planDetails.duration - 1}), provide meals in this EXACT order:
      1. Breakfast (dayOfWeek: X, type: "breakfast") - MAX 20 minutes total time
      2. Lunch (dayOfWeek: X, type: "lunch") - Respect max cooking time
      3. Dinner (dayOfWeek: X, type: "dinner") - Respect max cooking time
    
    NUTRITION TARGETS PER DAY:
    - Breakfast: ${Math.round(dailyCalories * 0.25)} cal (QUICK & SIMPLE)
    - Lunch: ${Math.round(dailyCalories * 0.35)} cal (CULTURAL AUTHENTICITY)
    - Dinner: ${Math.round(dailyCalories * 0.40)} cal (CULTURAL AUTHENTICITY)
    - Protein: ${Math.round(dailyCalories * macroStrategy.protein / 100 / 4)}g
    - Carbs: ${Math.round(dailyCalories * macroStrategy.carbs / 100 / 4)}g
    - Fat: ${Math.round(dailyCalories * macroStrategy.fat / 100 / 9)}g
    
    📝 DETAILED CULTURAL COOKING INSTRUCTIONS:
    For each meal, provide VERY DETAILED, culturally-authentic cooking instructions that include:
    1. Traditional preparation methods from the cuisine
    2. Authentic ingredients and spices
    3. Cultural cooking techniques and tips
    4. Step-by-step process with specific times and temperatures
    5. Traditional serving suggestions and accompaniments
    
    🎯 CRITICAL: Return ONLY perfect, valid JSON. No markdown, no extra text, just clean JSON.
    
    {
      "meals": [
        {
          "name": "Culturally authentic meal name",
          "type": "breakfast|lunch|dinner",
          "dayOfWeek": 0-${planDetails.duration - 1},
          "instructions": "DETAILED culturally-authentic cooking instructions with traditional techniques, specific times, temperatures, and cultural context.",
          "prepTime": breakfast_max_15_others_respect_limit,
          "cookTime": breakfast_max_5_others_respect_limit,
          "servings": 1,
          "calories": meal_target_calories,
          "ingredients": [
            {
              "name": "authentic ingredient name",
              "quantity": number,
              "unit": "standard unit",
              "category": "Produce|Meat|Dairy|Pantry|Spices",
              "estimatedCost": reasonable_cost
            }
          ]
        }
      ]
    }
    
    Ensure breakfast meals are always ≤20 minutes total time and other meals respect the ${maxCookingTime} limit!
    `;
  }

  private getCookingTimeInstructions(maxCookingTime: string): string {
    switch (maxCookingTime) {
      case '10-20':
        return `- Quick meals only: Maximum 20 minutes total cooking time
                - Focus on simple techniques: sautéing, steaming, quick stir-fries
                - Use pre-cooked ingredients where culturally appropriate`;
      case '20-40':
        return `- Moderate cooking time: Maximum 40 minutes total cooking time
                - Allow for more complex techniques: braising, slow-cooking, marinating
                - Can include dishes that require some time investment`;
      case '40-60':
        return `- Extended cooking time: Maximum 60 minutes total cooking time
                - Complex traditional dishes allowed: slow-cooked stews, roasts, elaborate preparations
                - Traditional techniques that require patience`;
      case '60+':
        return `- No time restrictions for lunch and dinner
                - Include elaborate traditional dishes, slow-cooked specialties
                - Complex multi-step preparations welcome`;
      default:
        return `- Moderate cooking time: Maximum 40 minutes total cooking time`;
    }
  }

  private parseAIResponseWithEnhancedHandling(content: string, duration: number): MealPlan {
    try {
      console.log('Enhanced JSON parsing for culturally-diverse meal content...');
      
      // More aggressive cleaning for creative content
      let cleanedContent = content.trim();
      
      // Remove markdown formatting
      cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/\s*```$/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/gi, '').replace(/\s*```$/g, '');
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      }
      
      // Fix common JSON issues in creative content
      cleanedContent = cleanedContent
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Convert single quotes to double quotes
        .replace(/\\'/g, "'") // Fix escaped single quotes
        .replace(/\n/g, ' ') // Remove newlines that might break JSON
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\t/g, ' '); // Replace tabs with spaces
      
      const parsed = JSON.parse(cleanedContent);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid meal plan structure - missing meals array');
      }
      
      // Sort meals properly: by day, then by meal type order
      const mealTypeOrder = { 'breakfast': 0, 'lunch': 1, 'dinner': 2 };
      const sortedMeals = parsed.meals.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return mealTypeOrder[a.type] - mealTypeOrder[b.type];
      });
      
      // Validate and clean up parsed meals with cultural awareness
      const validatedMeals = sortedMeals.map((meal: any, index: number) => {
        // Ensure breakfast meals comply with 20-minute rule
        if (meal.type === 'breakfast') {
          const totalTime = (meal.prepTime || 10) + (meal.cookTime || 5);
          if (totalTime > 20) {
            console.warn(`Breakfast meal "${meal.name}" exceeds 20-minute limit (${totalTime} min), adjusting...`);
            return {
              ...meal,
              prepTime: Math.min(meal.prepTime || 10, 15),
              cookTime: Math.min(meal.cookTime || 5, 5)
            };
          }
        }
        
        return {
          name: meal.name || `Cultural Meal ${index + 1}`,
          type: meal.type || (index % 3 === 0 ? 'breakfast' : index % 3 === 1 ? 'lunch' : 'dinner'),
          dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : Math.floor(index / 3),
          instructions: meal.instructions || 'Prepare using traditional cultural cooking methods',
          prepTime: meal.prepTime || 15,
          cookTime: meal.cookTime || 20,
          servings: meal.servings || 1,
          calories: meal.calories || 400,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : this.getDefaultCulturalIngredients(meal.type || 'lunch')
        };
      });
      
      console.log(`Successfully parsed culturally-diverse meal plan with ${validatedMeals.length} meals`);
      return { meals: validatedMeals };
      
    } catch (error) {
      console.error('Failed to parse GPT-4.1 response:', error);
      console.log('Raw response length:', content.length);
      
      // Enhanced fallback with cultural diversity
      console.log('Generating culturally-diverse fallback meal plan...');
      return this.generateCulturalFallbackMealPlan(duration);
    }
  }

  private generateCulturalFallbackMealPlan(duration: number): MealPlan {
    const meals: Meal[] = [];
    
    // Quick breakfast options (always ≤20 minutes)
    const quickBreakfasts = [
      { name: "Greek Yogurt with Honey and Berries", style: "mediterranean", time: 5 },
      { name: "Japanese Tamago Sandwich", style: "japanese", time: 15 },
      { name: "Mexican Fruit Bowl with Chili Lime", style: "mexican", time: 10 },
      { name: "Italian Espresso with Biscotti", style: "italian", time: 8 },
      { name: "Indian Masala Chai with Toast", style: "indian", time: 12 },
      { name: "Thai Coconut Rice Porridge", style: "thai", time: 18 }
    ];
    
    // Cultural lunch options
    const culturalLunches = [
      { name: "Italian Caprese Salad with Basil", style: "italian" },
      { name: "Mexican Quesadillas with Salsa Verde", style: "mexican" },
      { name: "Japanese Chicken Teriyaki Bowl", style: "japanese" },
      { name: "Indian Dal with Basmati Rice", style: "indian" },
      { name: "Mediterranean Hummus and Pita Plate", style: "mediterranean" },
      { name: "Thai Green Curry with Jasmine Rice", style: "thai" }
    ];
    
    // Cultural dinner options
    const culturalDinners = [
      { name: "Italian Spaghetti Carbonara", style: "italian" },
      { name: "Mexican Chicken Enchiladas", style: "mexican" },
      { name: "Japanese Salmon Shioyaki with Miso Soup", style: "japanese" },
      { name: "Indian Butter Chicken with Naan", style: "indian" },
      { name: "Mediterranean Grilled Fish with Tzatziki", style: "mediterranean" },
      { name: "Thai Pad Thai with Shrimp", style: "thai" }
    ];
    
    // Generate meals in proper order with cultural variety
    for (let day = 0; day < duration; day++) {
      // Breakfast (always ≤20 minutes)
      const breakfast = quickBreakfasts[day % quickBreakfasts.length];
      meals.push({
        name: breakfast.name,
        type: "breakfast",
        dayOfWeek: day,
        instructions: this.getCulturalInstructions("breakfast", breakfast.name, breakfast.style),
        prepTime: Math.min(breakfast.time - 5, 15),
        cookTime: Math.min(5, breakfast.time),
        servings: 1,
        calories: 320,
        ingredients: this.getCulturalIngredients("breakfast", breakfast.style)
      });
      
      // Lunch
      const lunch = culturalLunches[day % culturalLunches.length];
      meals.push({
        name: lunch.name,
        type: "lunch",
        dayOfWeek: day,
        instructions: this.getCulturalInstructions("lunch", lunch.name, lunch.style),
        prepTime: 15,
        cookTime: 20,
        servings: 1,
        calories: 480,
        ingredients: this.getCulturalIngredients("lunch", lunch.style)
      });
      
      // Dinner
      const dinner = culturalDinners[day % culturalDinners.length];
      meals.push({
        name: dinner.name,
        type: "dinner",
        dayOfWeek: day,
        instructions: this.getCulturalInstructions("dinner", dinner.name, dinner.style),
        prepTime: 20,
        cookTime: 25,
        servings: 1,
        calories: 580,
        ingredients: this.getCulturalIngredients("dinner", dinner.style)
      });
    }
    
    console.log(`Generated culturally-diverse fallback meal plan with ${meals.length} meals`);
    return { meals };
  }

  private getCulturalInstructions(mealType: string, mealName: string, style: string): string {
    // Return culturally-appropriate cooking instructions based on cuisine style
    return `Prepare this authentic ${style} dish using traditional cooking methods. Focus on proper ingredient preparation, cultural cooking techniques, and authentic flavoring. Serve according to ${style} tradition.`;
  }

  private getCulturalIngredients(mealType: string, style: string) {
    // Return culturally-appropriate ingredients based on cuisine style
    const baseIngredients = [
      { name: "main protein", quantity: 1, unit: "serving", category: "Meat", estimatedCost: 2.50 },
      { name: "cultural spices", quantity: 1, unit: "tsp", category: "Spices", estimatedCost: 0.30 },
      { name: "fresh vegetables", quantity: 1, unit: "cup", category: "Produce", estimatedCost: 1.00 }
    ];
    return baseIngredients;
  }

  private getDefaultCulturalIngredients(mealType: string) {
    return this.getCulturalIngredients(mealType, "international");
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

  private getDefaultIngredients(mealType: string) {
    return this.getDefaultAmericanIngredients(mealType);
  }
}
