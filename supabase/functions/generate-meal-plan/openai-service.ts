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

    const prompt = this.buildCreativeWalmartMealPlanPrompt(profile, planDetails, dailyCalories, macroStrategy);
    
    try {
      console.log('Calling OpenAI API with GPT-4.1 for enhanced meal generation...');
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
              content: 'You are an innovative culinary AI with expertise in creating unique, personalized meal plans. You have deep knowledge of nutrition, international cuisines, cooking techniques, and Walmart ingredient availability. Your specialty is creating meal plans that are never repetitive and always surprising while meeting specific health goals. Each meal plan you create should feel like a culinary adventure.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8, // Increased for more creativity
          max_tokens: 4500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT-4.1 API response received');

      const content = data.choices[0].message.content;
      console.log('Parsing AI response...');
      
      return this.parseAIResponse(content, planDetails.duration);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private buildCreativeWalmartMealPlanPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number, macroStrategy: any): string {
    // Generate random elements to ensure variety
    const timestamp = Date.now();
    const creativitySeeds = this.getCreativitySeeds(timestamp);
    
    const walmartIngredients = `
    Available Walmart ingredients (be creative with combinations):
    PROTEINS: chicken breast, ground turkey, salmon, tilapia, shrimp, eggs, Greek yogurt, cottage cheese, canned tuna, black beans, chickpeas, lentils, tofu, ground beef (93/7)
    VEGETABLES: spinach, kale, broccoli, cauliflower, bell peppers, zucchini, mushrooms, asparagus, Brussels sprouts, sweet potatoes, carrots, onions, garlic, cherry tomatoes, cucumber, avocado
    GRAINS: quinoa, brown rice, wild rice, oats, whole wheat pasta, whole grain bread, barley, farro
    PANTRY: olive oil, coconut oil, herbs, spices, nuts, seeds, vinegars, low-sodium broths
    `;

    return `
    🎨 CREATIVE MEAL PLAN CHALLENGE 🎨
    Create a COMPLETELY UNIQUE ${planDetails.duration}-day meal plan that has NEVER been made before!
    
    PROFILE CONTEXT:
    - Age: ${profile.age}, Weight: ${profile.weight}lbs, Height: ${profile.height}"
    - Goal: ${profile.goal} (${dailyCalories} calories/day)
    - Activity: ${profile.activityLevel}
    - Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'}
    - Budget: $${profile.budgetRange || '50-100'}/week
    - Additional notes: ${planDetails.additionalNotes || 'None'}
    
    NUTRITION TARGETS:
    ${macroStrategy.description}
    - Protein: ${macroStrategy.protein}% (${Math.round(dailyCalories * macroStrategy.protein / 100 / 4)}g)
    - Carbs: ${macroStrategy.carbs}% (${Math.round(dailyCalories * macroStrategy.carbs / 100 / 4)}g)
    - Fat: ${macroStrategy.fat}% (${Math.round(dailyCalories * macroStrategy.fat / 100 / 9)}g)
    
    🌟 CREATIVITY REQUIREMENTS:
    ${creativitySeeds.theme}
    ${creativitySeeds.inspiration}
    ${creativitySeeds.techniques}
    ${creativitySeeds.flavors}
    
    🍳 MEAL VARIETY MANDATES:
    - Each meal must be COMPLETELY different from any standard meal plan
    - Use unexpected ingredient combinations that work together
    - Include fusion cuisines (Korean-Mexican, Italian-Indian, etc.)
    - Vary cooking methods: grilling, roasting, sautéing, steaming, slow-cooking, air-frying
    - Include breakfast-for-dinner or lunch-for-breakfast creative swaps
    - Use different texture combinations (crunchy + creamy, soft + chewy)
    - Include both hot and cold meal options
    - Create meals that tell a story or have a theme
    
    WALMART INGREDIENTS:
    ${walmartIngredients}
    
    DAILY CALORIE BREAKDOWN:
    - Breakfast: ${Math.round(dailyCalories * 0.25)} calories
    - Lunch: ${Math.round(dailyCalories * 0.35)} calories
    - Dinner: ${Math.round(dailyCalories * 0.40)} calories
    
    🎯 OUTPUT FORMAT:
    Return ONLY valid JSON with exactly ${planDetails.duration * 3} unique meals:
    
    {
      "meals": [
        {
          "name": "Creative, unique meal name that sounds exciting",
          "type": "breakfast|lunch|dinner",
          "dayOfWeek": 0-6,
          "instructions": "Detailed, step-by-step cooking instructions with creative tips",
          "prepTime": 10-30,
          "cookTime": 15-45,
          "servings": 1,
          "calories": target_calories,
          "ingredients": [
            {
              "name": "specific ingredient name",
              "quantity": number,
              "unit": "cup|oz|tbsp|etc",
              "category": "Produce|Meat|Dairy|Pantry|Grains",
              "estimatedCost": realistic_walmart_price
            }
          ]
        }
      ]
    }
    
    Remember: This meal plan should be so creative and unique that if someone made it twice, they'd have completely different experiences each time!
    `;
  }

  private getCreativitySeeds(timestamp: number) {
    const themes = [
      "🌍 GLOBAL FUSION THEME: Blend flavors from 3+ different countries in unexpected ways",
      "🌈 COLOR PALETTE THEME: Each day should feature meals in a different color family",
      "🏛️ HISTORICAL CUISINE THEME: Draw inspiration from ancient civilizations and traditional cooking methods",
      "🌿 GARDEN-TO-TABLE THEME: Focus on fresh, herb-forward meals with creative vegetable preparations",
      "🔥 COOKING METHOD THEME: Each day features a different primary cooking technique",
      "🌊 COASTAL THEME: Ocean-inspired meals with fresh, light flavors",
      "🏔️ MOUNTAIN THEME: Hearty, warming meals perfect for cold weather",
      "🌺 TROPICAL THEME: Bright, fresh flavors with exotic fruit and spice combinations"
    ];
    
    const inspirations = [
      "Draw inspiration from street food vendors around the world",
      "Create meals inspired by different seasons and holidays",
      "Think like a chef competing on a cooking show - be bold!",
      "Imagine you're creating Instagram-worthy meals that taste amazing",
      "Channel the creativity of food trucks and pop-up restaurants",
      "Create meals that would surprise even experienced home cooks",
      "Think of combining comfort food with gourmet techniques",
      "Imagine you're a food blogger creating viral recipes"
    ];
    
    const techniques = [
      "Use marinades, rubs, and flavor layering techniques",
      "Incorporate texture contrasts in every meal",
      "Create signature sauces and dressings from scratch",
      "Use creative plating and presentation ideas",
      "Include both raw and cooked elements in meals",
      "Experiment with temperature contrasts (hot/cold combinations)",
      "Use herbs and spices in unexpected ways",
      "Create meals with interactive elements (build-your-own style)"
    ];
    
    const flavorProfiles = [
      "Sweet & savory combinations", "Spicy with cooling elements", "Umami-rich with bright acids",
      "Smoky with fresh herbs", "Creamy with crunchy textures", "Tangy with rich proteins",
      "Aromatic spices with mild bases", "Complex layered seasonings"
    ];
    
    // Use timestamp to create variety
    const themeIndex = timestamp % themes.length;
    const inspirationIndex = (timestamp * 3) % inspirations.length;
    const techniqueIndex = (timestamp * 7) % techniques.length;
    const flavorIndex = (timestamp * 11) % flavorProfiles.length;
    
    return {
      theme: themes[themeIndex],
      inspiration: `🎨 INSPIRATION: ${inspirations[inspirationIndex]}`,
      techniques: `🔧 TECHNIQUE FOCUS: ${techniques[techniqueIndex]}`,
      flavors: `👅 FLAVOR PROFILE: ${flavorProfiles[flavorIndex]}`
    };
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
      console.log('Attempting to parse JSON with enhanced error handling...');
      
      // Enhanced response cleaning for GPT-4.1
      let cleanedContent = content.trim();
      
      // Remove any markdown formatting more aggressively
      cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/\s*```$/g, '');
      cleanedContent = cleanedContent.replace(/```\s*/gi, '').replace(/\s*```$/g, '');
      
      // Remove any leading/trailing non-JSON content
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(cleanedContent);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid meal plan structure - missing meals array');
      }
      
      // Validate meal plan structure
      const expectedMealCount = duration * 3;
      if (parsed.meals.length !== expectedMealCount) {
        console.warn(`Expected ${expectedMealCount} meals, got ${parsed.meals.length}`);
      }
      
      console.log(`Successfully parsed meal plan with ${parsed.meals.length} meals using GPT-4.1`);
      return parsed;
      
    } catch (error) {
      console.error('Failed to parse GPT-4.1 response:', error);
      console.log('Response preview:', content.substring(0, 300) + '...');
      
      // Enhanced fallback with better error reporting
      console.log('Using enhanced fallback meal plan generation...');
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
    
    console.log(`Generated enhanced fallback meal plan with ${meals.length} unique meals`);
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
