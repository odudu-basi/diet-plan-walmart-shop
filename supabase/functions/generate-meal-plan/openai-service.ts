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

    const prompt = this.buildEnhancedCreativeMealPlanPrompt(profile, planDetails, dailyCalories, macroStrategy);
    
    try {
      console.log('Calling OpenAI API with GPT-4.1 for creative meal generation...');
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
              content: 'You are a creative culinary AI that creates unique, practical meal plans. You specialize in simple, wholesome breakfasts and creative lunch/dinner combinations. You ALWAYS respond with perfect, valid JSON format. Every meal plan balances creativity with practicality.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8, // High creativity but controlled
          max_tokens: 4000,
          presence_penalty: 0.6, // Encourage new topics
          frequency_penalty: 0.8, // Avoid repetition
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT-4.1 API response received for creative meal plan');

      const content = data.choices[0].message.content;
      console.log('Parsing AI response...');
      
      return this.parseAIResponseWithEnhancedHandling(content, planDetails.duration);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  private buildEnhancedCreativeMealPlanPrompt(profile: UserProfile, planDetails: PlanDetails, dailyCalories: number, macroStrategy: any): string {
    // Generate unique creativity elements based on current timestamp and user profile
    const creativityId = Date.now() + profile.age + profile.weight;
    const uniqueThemes = this.generateUniqueCreativityThemes(creativityId);
    
    return `
    🎨 CREATIVE MEAL PLAN CHALLENGE 🎨
    Create a UNIQUE ${planDetails.duration}-day meal plan with perfect variety and creativity balance!
    
    CREATIVITY MANDATE: This meal plan must be completely different from any previous plans. Focus on practical creativity - meals that are exciting but achievable.
    
    PROFILE & GOALS:
    - Person: ${profile.age}yo, ${profile.weight}lbs, ${profile.height}", Goal: ${profile.goal}
    - Daily Target: ${dailyCalories} calories (${macroStrategy.description})
    - Activity: ${profile.activityLevel} | Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'} | Budget: $${profile.budgetRange || '50-100'}/week
    - Special Notes: ${planDetails.additionalNotes || 'Balance creativity with practicality!'}
    
    🌟 UNIQUE CREATIVE THEMES FOR THIS PLAN:
    ${uniqueThemes.primaryTheme}
    ${uniqueThemes.flavorProfile}
    ${uniqueThemes.cookingStyle}
    ${uniqueThemes.presentationStyle}
    
    🥞 BREAKFAST REQUIREMENTS (KEEP SIMPLE & PRACTICAL):
    - Simple, wholesome, and quick to prepare (10-20 minutes max)
    - Focus on classic breakfast foods with small creative twists
    - Examples: "Cinnamon Apple Overnight Oats", "Greek Yogurt Berry Parfait", "Avocado Toast with Everything Seasoning"
    - NO elaborate fusion breakfasts or restaurant-style complexity
    - Emphasize nutrition, energy, and ease of preparation
    
    🍽️ LUNCH & DINNER REQUIREMENTS (MORE CREATIVE):
    - Lunch and dinner can be more creative and fusion-inspired
    - Use interesting flavor combinations and cooking techniques
    - Include fusion cuisines and creative presentations
    - Focus on satisfying, complete meals with good variety
    
    🔄 MEAL ORDERING REQUIREMENT:
    - For each day (0-${planDetails.duration - 1}), provide meals in this EXACT order:
      1. Breakfast (dayOfWeek: X, type: "breakfast")
      2. Lunch (dayOfWeek: X, type: "lunch") 
      3. Dinner (dayOfWeek: X, type: "dinner")
    - This ensures proper meal sequence in the generated plan
    
    WALMART INGREDIENTS (be creative with combinations):
    PROTEINS: chicken, turkey, salmon, shrimp, eggs, Greek yogurt, beans, lentils, tofu
    PRODUCE: all fresh vegetables, fruits, herbs, and creative combinations
    PANTRY: spices, sauces, oils, vinegars, nuts, seeds for unlimited creativity
    
    NUTRITION TARGETS PER DAY:
    - Breakfast: ${Math.round(dailyCalories * 0.25)} cal (SIMPLE & WHOLESOME)
    - Lunch: ${Math.round(dailyCalories * 0.35)} cal (CREATIVE & SATISFYING)
    - Dinner: ${Math.round(dailyCalories * 0.40)} cal (CREATIVE & COMPLETE)
    - Protein: ${Math.round(dailyCalories * macroStrategy.protein / 100 / 4)}g
    - Carbs: ${Math.round(dailyCalories * macroStrategy.carbs / 100 / 4)}g
    - Fat: ${Math.round(dailyCalories * macroStrategy.fat / 100 / 9)}g
    
    🎯 CRITICAL: Return ONLY perfect, valid JSON. No markdown, no extra text, just clean JSON.
    
    Order meals by day, then by meal type (breakfast first, lunch second, dinner third for each day):
    
    {
      "meals": [
        {
          "name": "Simple breakfast name (practical and wholesome)",
          "type": "breakfast",
          "dayOfWeek": 0,
          "instructions": "Simple, clear breakfast preparation steps",
          "prepTime": 5-15,
          "cookTime": 0-10,
          "servings": 1,
          "calories": breakfast_target_calories,
          "ingredients": [...]
        },
        {
          "name": "Creative lunch name that sounds delicious",
          "type": "lunch", 
          "dayOfWeek": 0,
          "instructions": "Detailed, creative lunch preparation",
          "prepTime": 15-25,
          "cookTime": 15-30,
          "servings": 1,
          "calories": lunch_target_calories,
          "ingredients": [...]
        },
        {
          "name": "Creative dinner name that sounds amazing",
          "type": "dinner",
          "dayOfWeek": 0,
          "instructions": "Detailed, creative dinner preparation",
          "prepTime": 20-30,
          "cookTime": 25-40,
          "servings": 1,
          "calories": dinner_target_calories,
          "ingredients": [...]
        }
      ]
    }
    
    Make this meal plan completely unique with perfect meal ordering and balanced creativity!
    `;
  }

  private generateUniqueCreativityThemes(seed: number) {
    const primaryThemes = [
      "🌍 GLOBAL STREET FOOD FUSION: Transform street foods from different countries into healthy gourmet meals",
      "🏛️ ANCIENT MEETS MODERN: Combine ancient cooking techniques with contemporary ingredients",
      "🎨 EDIBLE ART: Every meal should look like a masterpiece on the plate",
      "🌊 OCEAN TO MOUNTAIN: Contrast coastal flavors with mountain-inspired hearty elements",
      "🌸 SEASONAL POETRY: Each meal tells the story of a different season",
      "🔥 ELEMENT MASTERY: Focus on the five elements - fire, water, earth, air, metal in cooking",
      "🌈 COLOR THERAPY: Each day features a different color palette with matching flavors",
      "🎭 CULTURAL CELEBRATION: Each meal celebrates a different world culture"
    ];
    
    const flavorProfiles = [
      "🌶️ SPICE JOURNEY: From mild warming spices to bold heat adventures",
      "🍋 ACID & BRIGHTNESS: Citrus, vinegars, and fermented flavors dancing together",
      "🍯 SWEET & SAVORY SYMPHONY: Unexpected combinations of sweet and umami",
      "🌿 HERB GARDEN MAGIC: Fresh herbs as the star of every dish",
      "🧄 AROMATHERAPY COOKING: Focus on incredibly fragrant and aromatic dishes",
      "🥥 TROPICAL PARADISE: Coconut, tropical fruits, and island-inspired flavors",
      "🍄 UMAMI BOMB: Rich, savory, deeply satisfying flavor profiles",
      "❄️ COOL & REFRESHING: Light, cooling, and energizing flavor combinations"
    ];
    
    const cookingStyles = [
      "🔥 FIRE & SMOKE: Grilling, charring, and smoky techniques for depth",
      "💨 STEAM & GENTLE: Steaming, poaching, and gentle cooking methods",
      "⚡ QUICK & FRESH: Fast cooking to preserve nutrients and brightness",
      "🏺 SLOW & DEEP: Slow cooking for complex, developed flavors",
      "🌀 LAYERED TEXTURES: Multiple textures in every single dish",
      "❄️ RAW & COOKED: Combining raw elements with perfectly cooked components",
      "🍳 ONE-PAN WONDERS: Complete meals cooked together for harmony",
      "🥢 INTERACTIVE EATING: Build-your-own style meals for engagement"
    ];
    
    const presentations = [
      "📸 INSTAGRAM READY: Every meal looks like it belongs on social media",
      "🎨 RESTAURANT PLATING: Professional presentation techniques",
      "🌿 NATURAL BEAUTY: Rustic, natural, farm-to-table presentation",
      "🎭 DRAMATIC FLAIR: Bold, striking, conversation-starting presentations",
      "🌸 MINIMALIST ELEGANCE: Clean, simple, but stunning presentations",
      "🎪 PLAYFUL & FUN: Whimsical, creative, smile-inducing presentations",
      "🏛️ CLASSICAL BEAUTY: Timeless, elegant, sophisticated plating",
      "🌈 COLORFUL EXPLOSION: Vibrant, energetic, joy-inspiring presentations"
    ];
    
    return {
      primaryTheme: primaryThemes[seed % primaryThemes.length],
      flavorProfile: flavorProfiles[(seed * 3) % flavorProfiles.length],
      cookingStyle: cookingStyles[(seed * 7) % cookingStyles.length],
      presentationStyle: presentations[(seed * 11) % presentations.length]
    };
  }

  private parseAIResponseWithEnhancedHandling(content: string, duration: number): MealPlan {
    try {
      console.log('Enhanced JSON parsing with creative content handling...');
      
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
        name: meal.name || `Creative Meal ${index + 1}`,
        type: meal.type || (index % 3 === 0 ? 'breakfast' : index % 3 === 1 ? 'lunch' : 'dinner'),
        dayOfWeek: meal.dayOfWeek !== undefined ? meal.dayOfWeek : Math.floor(index / 3),
        instructions: meal.instructions || 'Prepare with care and creativity',
        prepTime: meal.prepTime || 15,
        cookTime: meal.cookTime || 20,
        servings: meal.servings || 1,
        calories: meal.calories || 400,
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : this.getDefaultIngredients(meal.type || 'lunch')
      }));
      
      console.log(`Successfully parsed creative meal plan with ${validatedMeals.length} meals in proper order`);
      return { meals: validatedMeals };
      
    } catch (error) {
      console.error('Failed to parse GPT-4.1 response:', error);
      console.log('Raw response length:', content.length);
      console.log('Response preview:', content.substring(0, 500) + '...');
      
      // Enhanced fallback with proper ordering
      console.log('Generating creative fallback meal plan with proper ordering...');
      return this.generateCreativeFallbackMealPlan(duration);
    }
  }

  private generateCreativeFallbackMealPlan(duration: number): MealPlan {
    const meals: Meal[] = [];
    const timestamp = Date.now();
    
    // Simple, practical breakfast options
    const simpleBreakfasts = [
      { name: "Greek Yogurt Berry Parfait with Granola", style: "simple" },
      { name: "Avocado Toast with Everything Seasoning", style: "simple" },
      { name: "Cinnamon Apple Overnight Oats", style: "simple" },
      { name: "Spinach and Cheese Scrambled Eggs", style: "simple" },
      { name: "Peanut Butter Banana Smoothie Bowl", style: "simple" },
      { name: "Whole Grain Toast with Almond Butter", style: "simple" },
      { name: "Greek Yogurt with Honey and Walnuts", style: "simple" }
    ];
    
    // Creative lunch options
    const creativeLunches = [
      { name: "Vietnamese Banh Mi Buddha Bowl with Pickled Vegetables", style: "vietnamese-fusion" },
      { name: "Greek-Mexican Fusion Gyro Bowl with Tzatziki-Lime Dressing", style: "mediterranean-mexican" },
      { name: "Thai-Italian Fusion Pad See Ew Zucchini Noodles", style: "thai-italian" },
      { name: "Peruvian-Japanese Nikkei Salmon Bowl with Aji Amarillo", style: "peruvian-japanese" },
      { name: "Middle Eastern Fattoush Quinoa Salad with Sumac Dressing", style: "levantine" },
      { name: "Korean BBQ Lettuce Wrap Bowls with Gochujang Aioli", style: "korean-american" },
      { name: "Cuban-Asian Mojo Pork Lettuce Cups with Plantain Chips", style: "cuban-asian" }
    ];
    
    // Creative dinner options
    const creativeDinners = [
      { name: "Moroccan-Inspired Harissa Salmon with Pomegranate Couscous", style: "north-african" },
      { name: "Indian-Mexican Tandoori Chicken Tacos with Raita Verde", style: "indian-mexican" },
      { name: "Italian-Asian Miso Carbonara with Shiitake and Edamame", style: "italian-japanese" },
      { name: "Ethiopian-Mediterranean Berbere Chicken with Lentil Pilaf", style: "ethiopian-mediterranean" },
      { name: "Brazilian-Thai Chimichurri Beef Stir-fry with Coconut Rice", style: "brazilian-thai" },
      { name: "French-Vietnamese Lemongrass Coq au Vin with Rice Noodles", style: "french-vietnamese" },
      { name: "Turkish-Mexican Spiced Lamb Bowls with Pomegranate Salsa", style: "turkish-mexican" }
    ];
    
    // Generate meals in proper order: breakfast, lunch, dinner for each day
    for (let day = 0; day < duration; day++) {
      const dayOffset = (timestamp + day) % 100;
      
      // Breakfast (simple and practical)
      const breakfast = simpleBreakfasts[(day + dayOffset) % simpleBreakfasts.length];
      meals.push({
        name: breakfast.name,
        type: "breakfast",
        dayOfWeek: day,
        instructions: `Prepare this simple, nutritious breakfast. Focus on fresh ingredients and balanced nutrition for a great start to your day.`,
        prepTime: 8,
        cookTime: 5,
        servings: 1,
        calories: 320,
        ingredients: this.getSimpleBreakfastIngredients(breakfast.style)
      });
      
      // Lunch (creative but balanced)
      const lunch = creativeLunches[(day + dayOffset * 2) % creativeLunches.length];
      meals.push({
        name: lunch.name,
        type: "lunch",
        dayOfWeek: day,
        instructions: `Prepare this ${lunch.style} fusion lunch with attention to texture contrasts and bold flavor combinations. Build layers of taste for maximum satisfaction.`,
        prepTime: 18,
        cookTime: 22,
        servings: 1,
        calories: 480,
        ingredients: this.getCreativeIngredients("lunch", lunch.style)
      });
      
      // Dinner (creative and complete)
      const dinner = creativeDinners[(day + dayOffset * 3) % creativeDinners.length];
      meals.push({
        name: dinner.name,
        type: "dinner",
        dayOfWeek: day,
        instructions: `Cook this ${dinner.style} fusion dinner with professional techniques. Focus on proper seasoning, temperature control, and elegant presentation.`,
        prepTime: 25,
        cookTime: 30,
        servings: 1,
        calories: 580,
        ingredients: this.getCreativeIngredients("dinner", dinner.style)
      });
    }
    
    console.log(`Generated creative fallback meal plan with ${meals.length} properly ordered meals`);
    return { meals };
  }

  private getSimpleBreakfastIngredients(style: string) {
    return [
      { name: "Greek yogurt", quantity: 1, unit: "cup", category: "Dairy", estimatedCost: 0.80 },
      { name: "mixed berries", quantity: 0.5, unit: "cup", category: "Produce", estimatedCost: 1.20 },
      { name: "granola", quantity: 0.25, unit: "cup", category: "Pantry", estimatedCost: 0.50 },
      { name: "honey", quantity: 1, unit: "tbsp", category: "Pantry", estimatedCost: 0.25 },
      { name: "chopped nuts", quantity: 1, unit: "tbsp", category: "Pantry", estimatedCost: 0.30 }
    ];
  }

  private getCreativeIngredients(mealType: string, style: string) {
    const baseIngredients = [
      { name: "extra virgin olive oil", quantity: 1, unit: "tbsp", category: "Pantry", estimatedCost: 0.30 },
      { name: "fresh garlic", quantity: 2, unit: "cloves", category: "Produce", estimatedCost: 0.20 },
      { name: "sea salt", quantity: 0.5, unit: "tsp", category: "Pantry", estimatedCost: 0.05 }
    ];
    
    if (mealType === "breakfast") {
      return [
        { name: "organic eggs", quantity: 2, unit: "large", category: "Dairy", estimatedCost: 0.60 },
        { name: "baby spinach", quantity: 1.5, unit: "cups", category: "Produce", estimatedCost: 0.80 },
        { name: "cherry tomatoes", quantity: 0.5, unit: "cup", category: "Produce", estimatedCost: 0.75 },
        { name: "fresh herbs", quantity: 2, unit: "tbsp", category: "Produce", estimatedCost: 0.50 },
        ...baseIngredients
      ];
    } else if (mealType === "lunch") {
      return [
        { name: "chicken breast", quantity: 5, unit: "oz", category: "Meat", estimatedCost: 3.50 },
        { name: "mixed greens", quantity: 3, unit: "cups", category: "Produce", estimatedCost: 1.20 },
        { name: "cucumber", quantity: 0.5, unit: "cup", category: "Produce", estimatedCost: 0.40 },
        { name: "quinoa", quantity: 0.25, unit: "cup", category: "Grains", estimatedCost: 0.60 },
        { name: "avocado", quantity: 0.5, unit: "medium", category: "Produce", estimatedCost: 1.00 },
        ...baseIngredients
      ];
    } else {
      return [
        { name: "salmon fillet", quantity: 6, unit: "oz", category: "Meat", estimatedCost: 5.50 },
        { name: "asparagus", quantity: 1, unit: "cup", category: "Produce", estimatedCost: 1.00 },
        { name: "sweet potato", quantity: 1, unit: "medium", category: "Produce", estimatedCost: 0.80 },
        { name: "lemon", quantity: 0.5, unit: "whole", category: "Produce", estimatedCost: 0.25 },
        { name: "fresh ginger", quantity: 1, unit: "tsp", category: "Produce", estimatedCost: 0.15 },
        ...baseIngredients
      ];
    }
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
    return this.getCreativeIngredients(mealType, "fusion");
  }
}
