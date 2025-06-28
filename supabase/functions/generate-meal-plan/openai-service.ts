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
    
    console.log('Generating American-style meal plan with personalized nutrition:', {
      bmi,
      macroStrategy,
      dailyCalories,
      goal: profile.goal
    });

    const prompt = this.buildAmericanMealPlanPrompt(profile, planDetails, dailyCalories, macroStrategy);
    
    try {
      console.log('Calling OpenAI API with GPT-4.1 for American comfort food meal generation...');
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
              content: 'You are an expert American home cook who creates practical, familiar meal plans. You specialize in traditional American comfort foods, family recipes, and meals that most American households eat regularly. You ALWAYS respond with perfect, valid JSON format. Every meal plan focuses on classic American dishes with detailed step-by-step cooking instructions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7, // Moderate creativity but focused on familiar foods
          max_tokens: 4000,
          presence_penalty: 0.3,
          frequency_penalty: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT-4.1 API response received for American meal plan');

      const content = data.choices[0].message.content;
      console.log('Parsing AI response...');
      
      return this.parseAIResponseWithEnhancedHandling(content, planDetails.duration);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private buildAmericanMealPlanPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number, macroStrategy: any): string {
    return `
    🇺🇸 AMERICAN COMFORT FOOD MEAL PLAN 🇺🇸
    Create a ${planDetails.duration}-day meal plan featuring classic American dishes that families across the country eat regularly!
    
    AMERICAN FOOD FOCUS: All meals should be traditional American comfort foods, family favorites, and dishes commonly found in American households. Think classic recipes that have been passed down through generations.
    
    PROFILE & GOALS:
    - Person: ${profile.age}yo, ${profile.weight}lbs, ${profile.height}", Goal: ${profile.goal}
    - Daily Target: ${dailyCalories} calories (${macroStrategy.description})
    - Activity: ${profile.activityLevel} | Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'} | Budget: $${profile.budgetRange || '50-100'}/week
    - Special Notes: ${planDetails.additionalNotes || 'Focus on American comfort foods!'}
    
    🥞 AMERICAN BREAKFAST CLASSICS (Keep Traditional):
    - Classic American breakfast foods that families eat daily
    - Examples: "Scrambled Eggs with Bacon and Toast", "Pancakes with Maple Syrup", "Oatmeal with Brown Sugar", "French Toast", "Cereal with Milk", "Bagel with Cream Cheese"
    - Focus on familiar, comforting morning meals
    - 15-20 minutes preparation maximum
    
    🍔 AMERICAN LUNCH FAVORITES:
    - Traditional American lunch foods
    - Examples: "Grilled Cheese and Tomato Soup", "BLT Sandwich", "Chicken Caesar Salad", "Turkey Club Sandwich", "Mac and Cheese", "Cheeseburger with Fries"
    - Comfort foods that Americans grew up eating
    
    🍖 AMERICAN DINNER STAPLES:
    - Classic American dinner dishes that families make regularly
    - Examples: "Meatloaf with Mashed Potatoes", "Fried Chicken with Green Beans", "Spaghetti and Meatballs", "Pot Roast with Vegetables", "Grilled Steak with Baked Potato", "Chicken Casserole"
    - Hearty, satisfying meals that represent American home cooking
    
    🔄 MEAL ORDERING REQUIREMENT:
    - For each day (0-${planDetails.duration - 1}), provide meals in this EXACT order:
      1. Breakfast (dayOfWeek: X, type: "breakfast")
      2. Lunch (dayOfWeek: X, type: "lunch") 
      3. Dinner (dayOfWeek: X, type: "dinner")
    
    AMERICAN GROCERY STORE INGREDIENTS:
    PROTEINS: ground beef, chicken breast, pork chops, turkey, eggs, bacon, ham, canned tuna
    PRODUCE: potatoes, onions, carrots, celery, lettuce, tomatoes, corn, green beans
    PANTRY: bread, pasta, rice, flour, sugar, butter, cheese, milk, canned goods
    SEASONINGS: salt, pepper, garlic powder, onion powder, paprika, Italian seasoning
    
    NUTRITION TARGETS PER DAY:
    - Breakfast: ${Math.round(dailyCalories * 0.25)} cal (CLASSIC AMERICAN BREAKFAST)
    - Lunch: ${Math.round(dailyCalories * 0.35)} cal (TRADITIONAL AMERICAN LUNCH)
    - Dinner: ${Math.round(dailyCalories * 0.40)} cal (HEARTY AMERICAN DINNER)
    - Protein: ${Math.round(dailyCalories * macroStrategy.protein / 100 / 4)}g
    - Carbs: ${Math.round(dailyCalories * macroStrategy.carbs / 100 / 4)}g
    - Fat: ${Math.round(dailyCalories * macroStrategy.fat / 100 / 9)}g
    
    📝 DETAILED STEP-BY-STEP INSTRUCTIONS REQUIRED:
    For each meal, provide VERY DETAILED, step-by-step cooking instructions that include:
    1. Prep work (chopping, measuring, etc.)
    2. Cooking techniques with specific times and temperatures
    3. Seasoning and flavoring steps
    4. Cooking order and timing
    5. Final assembly and serving suggestions
    6. Tips for best results
    
    🎯 CRITICAL: Return ONLY perfect, valid JSON. No markdown, no extra text, just clean JSON.
    
    Order meals by day, then by meal type (breakfast first, lunch second, dinner third for each day):
    
    {
      "meals": [
        {
          "name": "Classic American breakfast name",
          "type": "breakfast",
          "dayOfWeek": 0,
          "instructions": "VERY DETAILED step-by-step cooking instructions with specific times, temperatures, and techniques. Include prep work, cooking order, seasoning tips, and serving suggestions.",
          "prepTime": 5-15,
          "cookTime": 5-15,
          "servings": 1,
          "calories": breakfast_target_calories,
          "ingredients": [...]
        },
        {
          "name": "Traditional American lunch name",
          "type": "lunch", 
          "dayOfWeek": 0,
          "instructions": "VERY DETAILED step-by-step cooking instructions with specific times, temperatures, and techniques. Include prep work, cooking order, seasoning tips, and serving suggestions.",
          "prepTime": 10-20,
          "cookTime": 10-25,
          "servings": 1,
          "calories": lunch_target_calories,
          "ingredients": [...]
        },
        {
          "name": "Hearty American dinner name",
          "type": "dinner",
          "dayOfWeek": 0,
          "instructions": "VERY DETAILED step-by-step cooking instructions with specific times, temperatures, and techniques. Include prep work, cooking order, seasoning tips, and serving suggestions.",
          "prepTime": 15-25,
          "cookTime": 20-35,
          "servings": 1,
          "calories": dinner_target_calories,
          "ingredients": [...]
        }
      ]
    }
    
    Make this meal plan completely focused on American comfort foods with detailed cooking instructions!
    `;
  }

  private parseAIResponseWithEnhancedHandling(content: string, duration: number): MealPlan {
    try {
      console.log('Enhanced JSON parsing with American comfort food content handling...');
      
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
      
      // Validate and clean up parsed meals
      const validatedMeals = sortedMeals.map((meal: any, index: number) => ({
        name: meal.name || `American Meal ${index + 1}`,
        type: meal.type || (index % 3 === 0 ? 'breakfast' : index % 3 === 1 ? 'lunch' : 'dinner'),
        dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : Math.floor(index / 3),
        instructions: meal.instructions || 'Prepare with traditional American cooking methods',
        prepTime: meal.prepTime || 15,
        cookTime: meal.cookTime || 20,
        servings: meal.servings || 1,
        calories: meal.calories || 400,
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : this.getDefaultAmericanIngredients(meal.type || 'lunch')
      }));
      
      console.log(`Successfully parsed American comfort food meal plan with ${validatedMeals.length} meals in proper order`);
      return { meals: validatedMeals };
      
    } catch (error) {
      console.error('Failed to parse GPT-4.1 response:', error);
      console.log('Raw response length:', content.length);
      console.log('Response preview:', content.substring(0, 500) + '...');
      
      // Enhanced fallback with proper ordering
      console.log('Generating American comfort food fallback meal plan with proper ordering...');
      return this.generateAmericanFallbackMealPlan(duration);
    }
  }

  private generateAmericanFallbackMealPlan(duration: number): MealPlan {
    const meals: Meal[] = [];
    
    // Classic American breakfast options
    const americanBreakfasts = [
      { name: "Scrambled Eggs with Bacon and Toast", style: "classic" },
      { name: "Pancakes with Maple Syrup and Butter", style: "classic" },
      { name: "French Toast with Powdered Sugar", style: "classic" },
      { name: "Oatmeal with Brown Sugar and Cinnamon", style: "classic" },
      { name: "Bagel with Cream Cheese", style: "classic" },
      { name: "Cereal with Cold Milk", style: "classic" },
      { name: "English Muffin with Egg and Cheese", style: "classic" }
    ];
    
    // Classic American lunch options
    const americanLunches = [
      { name: "Grilled Cheese Sandwich with Tomato Soup", style: "comfort" },
      { name: "BLT Sandwich with Potato Chips", style: "classic" },
      { name: "Turkey Club Sandwich with Pickles", style: "deli" },
      { name: "Chicken Caesar Salad", style: "salad" },
      { name: "Mac and Cheese with Breadcrumbs", style: "comfort" },
      { name: "Cheeseburger with French Fries", style: "grill" },
      { name: "Tuna Salad Sandwich with Lettuce", style: "classic" }
    ];
    
    // Classic American dinner options
    const americanDinners = [
      { name: "Meatloaf with Mashed Potatoes and Green Beans", style: "comfort" },
      { name: "Fried Chicken with Coleslaw and Biscuits", style: "southern" },
      { name: "Spaghetti and Meatballs with Garlic Bread", style: "italian-american" },
      { name: "Pot Roast with Carrots and Potatoes", style: "comfort" },
      { name: "Grilled Steak with Baked Potato", style: "grill" },
      { name: "Chicken Casserole with Mixed Vegetables", style: "casserole" },
      { name: "BBQ Ribs with Corn on the Cob", style: "bbq" }
    ];
    
    // Generate meals in proper order: breakfast, lunch, dinner for each day
    for (let day = 0; day < duration; day++) {
      // Breakfast (classic American)
      const breakfast = americanBreakfasts[day % americanBreakfasts.length];
      meals.push({
        name: breakfast.name,
        type: "breakfast",
        dayOfWeek: day,
        instructions: this.getDetailedAmericanInstructions("breakfast", breakfast.name, breakfast.style),
        prepTime: 8,
        cookTime: 10,
        servings: 1,
        calories: 320,
        ingredients: this.getAmericanBreakfastIngredients(breakfast.style)
      });
      
      // Lunch (traditional American)
      const lunch = americanLunches[day % americanLunches.length];
      meals.push({
        name: lunch.name,
        type: "lunch",
        dayOfWeek: day,
        instructions: this.getDetailedAmericanInstructions("lunch", lunch.name, lunch.style),
        prepTime: 15,
        cookTime: 15,
        servings: 1,
        calories: 480,
        ingredients: this.getAmericanLunchIngredients(lunch.style)
      });
      
      // Dinner (hearty American)
      const dinner = americanDinners[day % americanDinners.length];
      meals.push({
        name: dinner.name,
        type: "dinner",
        dayOfWeek: day,
        instructions: this.getDetailedAmericanInstructions("dinner", dinner.name, dinner.style),
        prepTime: 20,
        cookTime: 30,
        servings: 1,
        calories: 580,
        ingredients: this.getAmericanDinnerIngredients(dinner.style)
      });
    }
    
    console.log(`Generated American comfort food fallback meal plan with ${meals.length} properly ordered meals`);
    return { meals };
  }

  private getDetailedAmericanInstructions(mealType: string, mealName: string, style: string): string {
    if (mealType === "breakfast") {
      if (mealName.includes("Scrambled Eggs")) {
        return `1. Heat a non-stick pan over medium heat and add 1 tbsp butter. 2. While pan heats, crack 2-3 eggs into a bowl and whisk with salt and pepper. 3. Cook 2-3 strips of bacon in the pan until crispy, about 4-5 minutes per side. Remove and set aside. 4. Pour eggs into the same pan with bacon fat. 5. Using a spatula, gently scramble eggs by pushing them from edges to center, about 2-3 minutes. 6. Toast 2 slices of bread until golden brown. 7. Serve eggs immediately with bacon and buttered toast. Season with additional salt and pepper to taste.`;
      } else if (mealName.includes("Pancakes")) {
        return `1. Mix 1 cup flour, 2 tbsp sugar, 2 tsp baking powder, and 1/2 tsp salt in a large bowl. 2. In another bowl, whisk together 1 cup milk, 1 egg, and 2 tbsp melted butter. 3. Pour wet ingredients into dry ingredients and stir just until combined (don't overmix). 4. Heat a griddle or large pan over medium heat and lightly grease. 5. Pour 1/4 cup batter per pancake onto hot griddle. 6. Cook until bubbles form on surface (2-3 minutes), then flip and cook 1-2 minutes more until golden. 7. Serve hot with butter and maple syrup.`;
      }
    } else if (mealType === "lunch") {
      if (mealName.includes("Grilled Cheese")) {
        return `1. Heat a large skillet over medium heat. 2. Butter one side of each of 2 bread slices. 3. Place one slice butter-side down in the pan. 4. Add 2-3 slices of American or cheddar cheese on top. 5. Top with second bread slice, butter-side up. 6. Cook 2-3 minutes until golden brown, then flip carefully. 7. Cook another 2-3 minutes until second side is golden and cheese is melted. 8. Meanwhile, heat canned tomato soup according to package directions. 9. Cut sandwich diagonally and serve with hot soup.`;
      } else if (mealName.includes("BLT")) {
        return `1. Cook 4-6 strips of bacon in a large skillet over medium heat until crispy, about 4-5 minutes per side. 2. Drain on paper towels. 3. Toast 3 slices of bread until golden brown. 4. Spread mayonnaise on one side of each toast slice. 5. On first slice, layer lettuce leaves and tomato slices, season tomatoes with salt and pepper. 6. Add second slice of toast, then layer crispy bacon. 7. Top with third slice of toast. 8. Secure with toothpicks and cut in half diagonally. 9. Serve with potato chips and pickles.`;
      }
    } else if (mealType === "dinner") {
      if (mealName.includes("Meatloaf")) {
        return `1. Preheat oven to 350°F. 2. In a large bowl, mix 1.5 lbs ground beef, 1/2 cup breadcrumbs, 1 egg, 1/4 cup ketchup, 1 diced onion, salt, and pepper. 3. Shape into a loaf and place in a baking dish. 4. Bake for 45-60 minutes until internal temperature reaches 160°F. 5. Meanwhile, boil peeled potatoes in salted water for 15-20 minutes until tender. 6. Drain and mash with butter, milk, salt, and pepper. 7. Steam green beans for 5-7 minutes until tender-crisp. 8. Let meatloaf rest 5 minutes before slicing. 9. Serve slices with mashed potatoes and green beans.`;
      } else if (mealName.includes("Fried Chicken")) {
        return `1. Cut chicken into pieces and season with salt and pepper. 2. Soak in buttermilk for 30 minutes. 3. Mix flour with paprika, garlic powder, onion powder, salt, and pepper. 4. Heat oil to 350°F in a large pot or deep fryer. 5. Dredge chicken pieces in seasoned flour, shaking off excess. 6. Fry chicken pieces for 12-15 minutes until golden brown and internal temperature reaches 165°F. 7. Drain on paper towels. 8. Meanwhile, make coleslaw by mixing shredded cabbage with mayo, vinegar, and sugar. 9. Warm biscuits in oven. 10. Serve hot chicken with coleslaw and warm biscuits.`;
      }
    }
    
    return `Prepare this classic American ${mealName} using traditional cooking methods. Focus on proper seasoning, cooking temperatures, and timing for the best results. Serve hot and enjoy this comfort food favorite.`;
  }

  private getAmericanBreakfastIngredients(style: string) {
    return [
      { name: "large eggs", quantity: 2, unit: "pieces", category: "Dairy", estimatedCost: 0.50 },
      { name: "bacon strips", quantity: 3, unit: "pieces", category: "Meat", estimatedCost: 1.20 },
      { name: "white bread", quantity: 2, unit: "slices", category: "Bakery", estimatedCost: 0.30 },
      { name: "butter", quantity: 2, unit: "tbsp", category: "Dairy", estimatedCost: 0.25 },
      { name: "salt", quantity: 0.25, unit: "tsp", category: "Pantry", estimatedCost: 0.02 }
    ];
  }

  private getAmericanLunchIngredients(style: string) {
    if (style === "comfort") {
      return [
        { name: "white bread", quantity: 2, unit: "slices", category: "Bakery", estimatedCost: 0.30 },
        { name: "American cheese", quantity: 2, unit: "slices", category: "Dairy", estimatedCost: 0.60 },
        { name: "butter", quantity: 1, unit: "tbsp", category: "Dairy", estimatedCost: 0.15 },
        { name: "canned tomato soup", quantity: 1, unit: "can", category: "Pantry", estimatedCost: 1.00 }
      ];
    }
    return [
      { name: "turkey slices", quantity: 4, unit: "oz", category: "Meat", estimatedCost: 2.50 },
      { name: "white bread", quantity: 3, unit: "slices", category: "Bakery", estimatedCost: 0.45 },
      { name: "lettuce", quantity: 2, unit: "leaves", category: "Produce", estimatedCost: 0.30 },
      { name: "tomato", quantity: 3, unit: "slices", category: "Produce", estimatedCost: 0.50 },
      { name: "mayonnaise", quantity: 2, unit: "tbsp", category: "Condiments", estimatedCost: 0.25 }
    ];
  }

  private getAmericanDinnerIngredients(style: string) {
    if (style === "comfort") {
      return [
        { name: "ground beef", quantity: 1, unit: "lb", category: "Meat", estimatedCost: 5.00 },
        { name: "breadcrumbs", quantity: 0.5, unit: "cup", category: "Pantry", estimatedCost: 0.30 },
        { name: "yellow onion", quantity: 1, unit: "medium", category: "Produce", estimatedCost: 0.50 },
        { name: "russet potatoes", quantity: 3, unit: "medium", category: "Produce", estimatedCost: 1.00 },
        { name: "green beans", quantity: 1, unit: "lb", category: "Produce", estimatedCost: 1.50 },
        { name: "ketchup", quantity: 0.25, unit: "cup", category: "Condiments", estimatedCost: 0.20 }
      ];
    }
    return [
      { name: "chicken pieces", quantity: 2, unit: "lbs", category: "Meat", estimatedCost: 6.00 },
      { name: "all-purpose flour", quantity: 1, unit: "cup", category: "Pantry", estimatedCost: 0.25 },
      { name: "vegetable oil", quantity: 2, unit: "cups", category: "Pantry", estimatedCost: 1.00 },
      { name: "buttermilk", quantity: 1, unit: "cup", category: "Dairy", estimatedCost: 0.75 },
      { name: "coleslaw mix", quantity: 1, unit: "bag", category: "Produce", estimatedCost: 1.25 }
    ];
  }

  private getDefaultAmericanIngredients(mealType: string) {
    return this.getAmericanLunchIngredients("classic");
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
