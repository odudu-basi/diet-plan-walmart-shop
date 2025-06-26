
import { UserProfile, PlanDetails, MealPlan } from './types.ts';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMealPlan(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): Promise<MealPlan> {
    const systemPrompt = this.buildPersonalizedSystemPrompt(profile, planDetails, dailyCalories);

    console.log('Calling OpenAI API with personalized meal generation...');
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
          { role: 'user', content: `Create a diverse ${planDetails.duration}-day meal plan with COMPLETELY DIFFERENT meals for each day. Focus on variety, nutrition balance, and achieving the specified goals. Return ONLY valid JSON.` }
        ],
        temperature: 0.7, // Increased for more variety
        max_tokens: 4000, // Increased for more detailed responses
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

  private buildPersonalizedSystemPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number): string {
    const restrictions = profile.dietaryRestrictions.length > 0 ? profile.dietaryRestrictions.join(', ') : 'None';
    const allergies = profile.allergies || 'None';
    
    // Calculate BMI and determine nutrition focus
    const heightInMeters = (profile.height * 2.54) / 100; // Convert inches to meters
    const weightInKg = profile.weight * 0.453592; // Convert lbs to kg
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    
    // Determine macro distribution based on goal
    let macroGuidance = '';
    let mealVarietyFocus = '';
    
    switch (profile.goal) {
      case 'lose-weight':
        macroGuidance = 'Focus on high protein (30-35%), moderate carbs (30-35%), healthy fats (30-35%). Emphasize lean proteins, vegetables, and whole grains.';
        mealVarietyFocus = 'Include filling, low-calorie density foods. Vary protein sources daily (chicken, fish, tofu, legumes, eggs).';
        break;
      case 'gain-weight':
        macroGuidance = 'Higher calorie density with balanced macros: protein (25-30%), carbs (40-45%), healthy fats (25-30%). Include calorie-dense healthy foods.';
        mealVarietyFocus = 'Include nutrient-dense, higher-calorie foods. Vary between different grains, nuts, seeds, and protein sources.';
        break;
      case 'build-muscle':
        macroGuidance = 'High protein focus (35-40%), moderate carbs (30-35%), healthy fats (25-30%). Prioritize complete proteins and post-workout nutrition.';
        mealVarietyFocus = 'Different protein sources each day. Include pre/post workout meal timing considerations.';
        break;
      case 'maintain-weight':
        macroGuidance = 'Balanced macros: protein (25-30%), carbs (40-45%), fats (25-30%). Focus on nutrient density and satisfaction.';
        mealVarietyFocus = 'Emphasize variety and enjoyment. Include different cuisines and cooking methods.';
        break;
      default:
        macroGuidance = 'Balanced nutrition with adequate protein, complex carbs, and healthy fats.';
        mealVarietyFocus = 'Focus on whole foods and variety.';
    }

    // Activity level considerations
    let activityGuidance = '';
    switch (profile.activityLevel) {
      case 'very':
      case 'extra':
        activityGuidance = 'Higher carbohydrate needs for energy. Include pre/post workout snacks.';
        break;
      case 'moderate':
        activityGuidance = 'Balanced energy needs. Include some pre-workout fuel options.';
        break;
      case 'light':
      case 'sedentary':
        activityGuidance = 'Focus on nutrient density over high energy foods.';
        break;
    }

    return `You are a certified nutritionist creating a personalized ${planDetails.duration}-day meal plan.

PROFILE ANALYSIS:
- Age: ${profile.age}, Weight: ${profile.weight}lbs, Height: ${profile.height}"
- Goal: ${profile.goal} 
- Activity: ${profile.activityLevel}
- Daily Calories: ${dailyCalories}
- Restrictions: ${restrictions}
- Allergies: ${allergies}
- Budget: ${profile.budgetRange}

NUTRITION STRATEGY:
${macroGuidance}
${activityGuidance}

VARIETY REQUIREMENTS:
- NEVER repeat the same meal twice across the entire plan
- ${mealVarietyFocus}
- Use different cooking methods daily (grilled, baked, sautéed, raw, steamed)
- Vary cuisines (American, Mediterranean, Asian, Mexican, etc.)
- Different protein sources each day
- Seasonal variety in vegetables and fruits

MEAL STRUCTURE (per day):
- Breakfast: 20-25% of daily calories (${Math.round(dailyCalories * 0.225)} cal)
- Lunch: 30-35% of daily calories (${Math.round(dailyCalories * 0.325)} cal)  
- Dinner: 30-35% of daily calories (${Math.round(dailyCalories * 0.325)} cal)
- Snack: 10-15% of daily calories (${Math.round(dailyCalories * 0.125)} cal)

Return ONLY this JSON structure with ${planDetails.duration * 4} UNIQUE meals:
{
  "meals": [
    {
      "name": "Unique Meal Name",
      "type": "breakfast",
      "dayOfWeek": 0,
      "instructions": "Detailed cooking steps with timing",
      "prepTime": 10,
      "cookTime": 15,
      "servings": 1,
      "calories": 450,
      "ingredients": [
        {"name": "Specific Ingredient", "quantity": 1.5, "unit": "cup", "category": "Protein", "estimatedCost": 2.50}
      ]
    }
  ]
}

CRITICAL: Each meal must be completely different. No repeated meals or similar combinations.`;
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
      
      // Validate and enhance meals
      mealPlan.meals = this.validateAndEnhanceMeals(mealPlan.meals, planDetails);
      
      console.log('Successfully parsed meal plan with', mealPlan.meals.length, 'meals');
      return mealPlan;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError.message);
      console.error('Response preview:', generatedContent.substring(0, 200));
      
      // Return fallback meal plan
      console.log('Generating diverse fallback meal plan...');
      return this.generateDiverseFallbackMealPlan(planDetails.duration);
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

  private validateAndEnhanceMeals(meals: any[], planDetails: PlanDetails): any[] {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const expectedMealCount = planDetails.duration * 4;
    
    // Ensure we have diverse meal names and don't repeat
    const usedMealNames = new Set<string>();
    
    // Fix incomplete meals and ensure variety
    const validMeals = meals.map((meal: any, index: number) => {
      const dayOfWeek = Math.floor(index / 4);
      const mealTypeIndex = index % 4;
      const mealType = mealTypes[mealTypeIndex];
      
      // Generate unique meal name if needed
      let mealName = meal.name || `${mealType} Day ${dayOfWeek + 1}`;
      let counter = 1;
      while (usedMealNames.has(mealName.toLowerCase())) {
        mealName = `${meal.name || mealType} ${counter}`;
        counter++;
      }
      usedMealNames.add(mealName.toLowerCase());
      
      return {
        name: mealName,
        type: mealType,
        dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : dayOfWeek,
        instructions: meal.instructions || `Prepare this nutritious ${mealType} following standard cooking methods`,
        prepTime: meal.prepTime || (mealType === 'breakfast' ? 5 : mealType === 'snack' ? 2 : 10),
        cookTime: meal.cookTime || (mealType === 'snack' ? 0 : mealType === 'breakfast' ? 10 : 15),
        servings: meal.servings || 1,
        calories: meal.calories || this.getTargetCaloriesForMealType(mealType),
        ingredients: Array.isArray(meal.ingredients) && meal.ingredients.length > 0 
          ? meal.ingredients 
          : this.getDefaultIngredientsForMealType(mealType)
      };
    });
    
    // If we don't have enough meals, generate diverse ones
    while (validMeals.length < expectedMealCount) {
      const index = validMeals.length;
      const dayOfWeek = Math.floor(index / 4);
      const mealTypeIndex = index % 4;
      const mealType = mealTypes[mealTypeIndex];
      
      validMeals.push({
        name: this.generateUniqueMealName(mealType, dayOfWeek, usedMealNames),
        type: mealType,
        dayOfWeek,
        instructions: `Prepare this healthy ${mealType} with fresh ingredients`,
        prepTime: mealType === 'snack' ? 2 : 8,
        cookTime: mealType === 'snack' ? 0 : 12,
        servings: 1,
        calories: this.getTargetCaloriesForMealType(mealType),
        ingredients: this.getDefaultIngredientsForMealType(mealType)
      });
    }
    
    return validMeals.slice(0, expectedMealCount);
  }

  private generateUniqueMealName(mealType: string, day: number, usedNames: Set<string>): string {
    const mealOptions = {
      breakfast: ['Protein Scramble', 'Overnight Oats', 'Greek Yogurt Bowl', 'Avocado Toast', 'Smoothie Bowl', 'Quinoa Breakfast Bowl', 'Chia Pudding'],
      lunch: ['Power Salad', 'Grain Bowl', 'Wrap', 'Soup & Sandwich', 'Buddha Bowl', 'Stir-fry', 'Mediterranean Bowl'],
      dinner: ['Grilled Protein Plate', 'One-Pan Meal', 'Curry Bowl', 'Pasta Dish', 'Roasted Veggie Plate', 'Seafood Special', 'Lean Meat & Veggies'],
      snack: ['Trail Mix', 'Fruit & Nuts', 'Veggie Sticks', 'Protein Smoothie', 'Energy Balls', 'Hummus & Veggies', 'Greek Yogurt']
    };
    
    const options = mealOptions[mealType as keyof typeof mealOptions] || [`${mealType} option`];
    
    for (const option of options) {
      const name = `${option} - Day ${day + 1}`;
      if (!usedNames.has(name.toLowerCase())) {
        usedNames.add(name.toLowerCase());
        return name;
      }
    }
    
    // Fallback with timestamp
    const fallbackName = `${mealType} Day ${day + 1} - ${Date.now()}`;
    usedNames.add(fallbackName.toLowerCase());
    return fallbackName;
  }

  private getTargetCaloriesForMealType(mealType: string): number {
    const calorieMap = {
      breakfast: 350,
      lunch: 450,
      dinner: 500,
      snack: 200
    };
    return calorieMap[mealType as keyof typeof calorieMap] || 300;
  }

  private getDefaultIngredientsForMealType(mealType: string) {
    const ingredientMap = {
      breakfast: [
        { name: 'Eggs', quantity: 2, unit: 'pieces', category: 'Protein', estimatedCost: 1.5 },
        { name: 'Spinach', quantity: 1, unit: 'cup', category: 'Vegetable', estimatedCost: 1.0 }
      ],
      lunch: [
        { name: 'Chicken Breast', quantity: 4, unit: 'oz', category: 'Protein', estimatedCost: 3.0 },
        { name: 'Mixed Greens', quantity: 2, unit: 'cups', category: 'Vegetable', estimatedCost: 2.0 }
      ],
      dinner: [
        { name: 'Salmon Fillet', quantity: 5, unit: 'oz', category: 'Protein', estimatedCost: 4.0 },
        { name: 'Broccoli', quantity: 1, unit: 'cup', category: 'Vegetable', estimatedCost: 1.5 }
      ],
      snack: [
        { name: 'Greek Yogurt', quantity: 1, unit: 'cup', category: 'Dairy', estimatedCost: 1.5 }
      ]
    };
    return ingredientMap[mealType as keyof typeof ingredientMap] || [];
  }

  private generateDiverseFallbackMealPlan(duration: number): MealPlan {
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    // More diverse fallback meals
    const fallbackMeals = {
      breakfast: [
        { name: 'Protein Scramble with Veggies', calories: 320, ingredients: [{ name: 'Eggs', quantity: 2, unit: 'pieces', category: 'Protein', estimatedCost: 1.5 }, { name: 'Bell Peppers', quantity: 0.5, unit: 'cup', category: 'Vegetable', estimatedCost: 1.0 }] },
        { name: 'Greek Yogurt Parfait', calories: 280, ingredients: [{ name: 'Greek Yogurt', quantity: 1, unit: 'cup', category: 'Dairy', estimatedCost: 2.0 }, { name: 'Berries', quantity: 0.5, unit: 'cup', category: 'Fruit', estimatedCost: 2.5 }] },
        { name: 'Avocado Toast', calories: 350, ingredients: [{ name: 'Whole Grain Bread', quantity: 2, unit: 'slices', category: 'Grain', estimatedCost: 1.0 }, { name: 'Avocado', quantity: 1, unit: 'piece', category: 'Fat', estimatedCost: 1.5 }] },
        { name: 'Oatmeal Bowl', calories: 300, ingredients: [{ name: 'Oats', quantity: 0.5, unit: 'cup', category: 'Grain', estimatedCost: 0.5 }, { name: 'Banana', quantity: 1, unit: 'piece', category: 'Fruit', estimatedCost: 0.75 }] }
      ],
      lunch: [
        { name: 'Grilled Chicken Salad', calories: 420, ingredients: [{ name: 'Chicken Breast', quantity: 4, unit: 'oz', category: 'Protein', estimatedCost: 3.0 }, { name: 'Mixed Greens', quantity: 2, unit: 'cups', category: 'Vegetable', estimatedCost: 2.0 }] },
        { name: 'Quinoa Power Bowl', calories: 450, ingredients: [{ name: 'Quinoa', quantity: 0.75, unit: 'cup', category: 'Grain', estimatedCost: 1.5 }, { name: 'Black Beans', quantity: 0.5, unit: 'cup', category: 'Protein', estimatedCost: 1.0 }] },
        { name: 'Turkey Wrap', calories: 380, ingredients: [{ name: 'Turkey Slices', quantity: 4, unit: 'oz', category: 'Protein', estimatedCost: 2.5 }, { name: 'Whole Wheat Tortilla', quantity: 1, unit: 'piece', category: 'Grain', estimatedCost: 0.75 }] },
        { name: 'Lentil Soup', calories: 320, ingredients: [{ name: 'Red Lentils', quantity: 0.5, unit: 'cup', category: 'Protein', estimatedCost: 1.0 }, { name: 'Carrots', quantity: 0.5, unit: 'cup', category: 'Vegetable', estimatedCost: 0.75 }] }
      ],
      dinner: [
        { name: 'Baked Salmon with Vegetables', calories: 520, ingredients: [{ name: 'Salmon Fillet', quantity: 5, unit: 'oz', category: 'Protein', estimatedCost: 4.0 }, { name: 'Asparagus', quantity: 1, unit: 'cup', category: 'Vegetable', estimatedCost: 2.0 }] },
        { name: 'Lean Beef Stir-fry', calories: 480, ingredients: [{ name: 'Lean Beef', quantity: 4, unit: 'oz', category: 'Protein', estimatedCost: 3.5 }, { name: 'Broccoli', quantity: 1, unit: 'cup', category: 'Vegetable', estimatedCost: 1.5 }] },
        { name: 'Mediterranean Chicken', calories: 460, ingredients: [{ name: 'Chicken Thigh', quantity: 5, unit: 'oz', category: 'Protein', estimatedCost: 2.5 }, { name: 'Zucchini', quantity: 1, unit: 'cup', category: 'Vegetable', estimatedCost: 1.25 }] },
        { name: 'Tofu Buddha Bowl', calories: 420, ingredients: [{ name: 'Firm Tofu', quantity: 4, unit: 'oz', category: 'Protein', estimatedCost: 2.0 }, { name: 'Sweet Potato', quantity: 1, unit: 'medium', category: 'Vegetable', estimatedCost: 1.0 }] }
      ],
      snack: [
        { name: 'Apple with Almond Butter', calories: 180, ingredients: [{ name: 'Apple', quantity: 1, unit: 'piece', category: 'Fruit', estimatedCost: 0.75 }, { name: 'Almond Butter', quantity: 1, unit: 'tbsp', category: 'Fat', estimatedCost: 0.5 }] },
        { name: 'Protein Smoothie', calories: 220, ingredients: [{ name: 'Protein Powder', quantity: 1, unit: 'scoop', category: 'Protein', estimatedCost: 1.5 }, { name: 'Banana', quantity: 0.5, unit: 'piece', category: 'Fruit', estimatedCost: 0.4 }] },
        { name: 'Mixed Nuts', calories: 160, ingredients: [{ name: 'Mixed Nuts', quantity: 1, unit: 'oz', category: 'Fat', estimatedCost: 1.0 }] },
        { name: 'Cottage Cheese Bowl', calories: 150, ingredients: [{ name: 'Cottage Cheese', quantity: 0.5, unit: 'cup', category: 'Dairy', estimatedCost: 1.25 }] }
      ]
    };
    
    const meals = [];
    for (let day = 0; day < duration; day++) {
      for (let mealIndex = 0; mealIndex < 4; mealIndex++) {
        const mealType = mealTypes[mealIndex] as keyof typeof fallbackMeals;
        const mealOptions = fallbackMeals[mealType];
        const selectedMeal = mealOptions[day % mealOptions.length]; // Cycle through options
        
        meals.push({
          name: `${selectedMeal.name} - Day ${day + 1}`,
          type: mealType,
          dayOfWeek: day,
          instructions: `Prepare this nutritious ${mealType} using fresh, quality ingredients`,
          prepTime: mealType === 'snack' ? 2 : 8,
          cookTime: mealType === 'snack' ? 0 : 15,
          servings: 1,
          calories: selectedMeal.calories,
          ingredients: selectedMeal.ingredients
        });
      }
    }
    
    return { meals };
  }
}
