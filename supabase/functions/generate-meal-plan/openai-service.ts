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
      console.log('Calling OpenAI API with GPT-4.1 for ultra-creative meal generation...');
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
              content: 'You are an ultra-creative culinary AI genius who creates completely unique, innovative meal plans that no one has ever seen before. You specialize in fusion cuisines, unexpected flavor combinations, and Instagram-worthy presentations. You ALWAYS respond with perfect, valid JSON format. Every meal plan you create is a culinary masterpiece that surprises and delights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9, // Maximum creativity
          max_tokens: 4000,
          presence_penalty: 0.6, // Encourage new topics
          frequency_penalty: 0.8, // Avoid repetition
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI GPT-4.1 API response received for ultra-creative meal plan');

      const content = data.choices[0].message.content;
      console.log('Parsing ultra-creative AI response...');
      
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
    🎨 ULTRA-CREATIVE MEAL PLAN CHALLENGE 🎨
    Create a COMPLETELY REVOLUTIONARY ${planDetails.duration}-day meal plan that has NEVER existed before!
    
    CREATIVITY MANDATE: This meal plan must be so unique and creative that it could be featured in a top culinary magazine. Every single meal should be an innovative fusion of flavors, techniques, and presentations that surprise and delight.
    
    PROFILE & GOALS:
    - Person: ${profile.age}yo, ${profile.weight}lbs, ${profile.height}", Goal: ${profile.goal}
    - Daily Target: ${dailyCalories} calories (${macroStrategy.description})
    - Activity: ${profile.activityLevel} | Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
    - Allergies: ${profile.allergies || 'None'} | Budget: $${profile.budgetRange || '50-100'}/week
    - Special Notes: ${planDetails.additionalNotes || 'Surprise me with creativity!'}
    
    🌟 UNIQUE CREATIVE THEMES FOR THIS PLAN:
    ${uniqueThemes.primaryTheme}
    ${uniqueThemes.flavorProfile}
    ${uniqueThemes.cookingStyle}
    ${uniqueThemes.presentationStyle}
    
    🎭 INNOVATION REQUIREMENTS:
    - Every meal name must be creative and Instagram-worthy
    - Combine unexpected ingredients that surprisingly work together
    - Use fusion techniques (Korean-Italian, Mexican-Japanese, Indian-French, etc.)
    - Include interesting textures and temperature contrasts
    - Create meals that tell a story or evoke emotions
    - Use creative plating and presentation techniques
    - Include both familiar comfort elements with exotic twists
    
    🍳 MEAL CREATIVITY MANDATES:
    - NO basic meals (no "Grilled Chicken with Rice")
    - Every breakfast should be a creative morning adventure
    - Every lunch should be a midday flavor explosion
    - Every dinner should be an evening culinary masterpiece
    - Use unexpected cooking methods and combinations
    - Create meals that sound like they belong in a trendy restaurant
    
    WALMART INGREDIENTS (be wildly creative with combinations):
    PROTEINS: chicken, turkey, salmon, shrimp, eggs, Greek yogurt, beans, lentils, tofu
    PRODUCE: all fresh vegetables, fruits, herbs, and creative combinations
    PANTRY: spices, sauces, oils, vinegars, nuts, seeds for unlimited creativity
    
    NUTRITION TARGETS PER DAY:
    - Breakfast: ${Math.round(dailyCalories * 0.25)} cal
    - Lunch: ${Math.round(dailyCalories * 0.35)} cal  
    - Dinner: ${Math.round(dailyCalories * 0.40)} cal
    - Protein: ${Math.round(dailyCalories * macroStrategy.protein / 100 / 4)}g
    - Carbs: ${Math.round(dailyCalories * macroStrategy.carbs / 100 / 4)}g
    - Fat: ${Math.round(dailyCalories * macroStrategy.fat / 100 / 9)}g
    
    🎯 CRITICAL: Return ONLY perfect, valid JSON. No markdown, no extra text, just clean JSON:
    
    {
      "meals": [
        {
          "name": "Ultra-creative meal name that sounds amazing",
          "type": "breakfast|lunch|dinner",
          "dayOfWeek": 0-6,
          "instructions": "Detailed, step-by-step creative cooking instructions",
          "prepTime": 10-30,
          "cookTime": 15-45,
          "servings": 1,
          "calories": target_calories_for_meal_type,
          "ingredients": [
            {
              "name": "specific ingredient",
              "quantity": number,
              "unit": "cup|oz|tbsp|piece|etc",
              "category": "Produce|Meat|Dairy|Pantry|Grains",
              "estimatedCost": realistic_price
            }
          ]
        }
      ]
    }
    
    Make this the most creative, unique, and exciting meal plan ever created!
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
      
      // Validate and clean up parsed meals
      const validatedMeals = parsed.meals.map((meal: any, index: number) => ({
        name: meal.name || `Creative Meal ${index + 1}`,
        type: meal.type || (index % 3 === 0 ? 'breakfast' : index % 3 === 1 ? 'lunch' : 'dinner'),
        dayOfWeek: meal.dayOfWeek || Math.floor(index / 3),
        instructions: meal.instructions || 'Prepare with creativity and love',
        prepTime: meal.prepTime || 15,
        cookTime: meal.cookTime || 20,
        servings: meal.servings || 1,
        calories: meal.calories || 400,
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : this.getDefaultIngredients(meal.type || 'lunch')
      }));
      
      console.log(`Successfully parsed ultra-creative meal plan with ${validatedMeals.length} unique meals`);
      return { meals: validatedMeals };
      
    } catch (error) {
      console.error('Failed to parse creative GPT-4.1 response:', error);
      console.log('Raw response length:', content.length);
      console.log('Response preview:', content.substring(0, 500) + '...');
      
      // Enhanced fallback with more variety
      console.log('Generating ultra-creative fallback meal plan...');
      return this.generateUltraCreativeFallbackMealPlan(duration);
    }
  }

  private generateUltraCreativeFallbackMealPlan(duration: number): MealPlan {
    const meals: Meal[] = [];
    const timestamp = Date.now();
    
    // Ultra-creative meal names and combinations
    const creativeBreakfasts = [
      { name: "Dragon Fruit Sunrise Bowl with Coconut-Lime Granola", style: "tropical-fusion" },
      { name: "Mediterranean Shakshuka Flatbread with Herbed Yogurt", style: "middle-eastern" },
      { name: "Korean-Inspired Kimchi Scramble with Sesame Avocado", style: "asian-fusion" },
      { name: "Moroccan Spiced Quinoa Porridge with Date-Walnut Crumble", style: "north-african" },
      { name: "Mexican Street Corn Breakfast Bowl with Cotija Cream", style: "mexican-fusion" },
      { name: "Japanese Tamago-Style Omelette with Miso-Glazed Vegetables", style: "japanese" },
      { name: "Indian-Spiced Chickpea Pancakes with Mint-Cilantro Chutney", style: "indian-fusion" }
    ];
    
    const creativeLunches = [
      { name: "Vietnamese Banh Mi Buddha Bowl with Pickled Vegetables", style: "vietnamese-fusion" },
      { name: "Greek-Mexican Fusion Gyro Bowl with Tzatziki-Lime Dressing", style: "mediterranean-mexican" },
      { name: "Thai-Italian Fusion Pad See Ew Zucchini Noodles", style: "thai-italian" },
      { name: "Peruvian-Japanese Nikkei Salmon Bowl with Aji Amarillo", style: "peruvian-japanese" },
      { name: "Middle Eastern Fattoush Quinoa Salad with Sumac Dressing", style: "levantine" },
      { name: "Korean BBQ Lettuce Wrap Bowls with Gochujang Aioli", style: "korean-american" },
      { name: "Cuban-Asian Mojo Pork Lettuce Cups with Plantain Chips", style: "cuban-asian" }
    ];
    
    const creativeDinners = [
      { name: "Moroccan-Inspired Harissa Salmon with Pomegranate Couscous", style: "north-african" },
      { name: "Indian-Mexican Tandoori Chicken Tacos with Raita Verde", style: "indian-mexican" },
      { name: "Italian-Asian Miso Carbonara with Shiitake and Edamame", style: "italian-japanese" },
      { name: "Ethiopian-Mediterranean Berbere Chicken with Lentil Pilaf", style: "ethiopian-mediterranean" },
      { name: "Brazilian-Thai Chimichurri Beef Stir-fry with Coconut Rice", style: "brazilian-thai" },
      { name: "French-Vietnamese Lemongrass Coq au Vin with Rice Noodles", style: "french-vietnamese" },
      { name: "Turkish-Mexican Spiced Lamb Bowls with Pomegranate Salsa", style: "turkish-mexican" }
    ];
    
    for (let day = 0; day < duration; day++) {
      const dayOffset = (timestamp + day) % 100; // Create variety based on timestamp
      
      // Breakfast
      const breakfast = creativeBreakfasts[(day + dayOffset) % creativeBreakfasts.length];
      meals.push({
        name: breakfast.name,
        type: "breakfast",
        dayOfWeek: day,
        instructions: `Create this ${breakfast.style} fusion breakfast by combining traditional techniques with modern presentation. Layer flavors carefully and garnish beautifully.`,
        prepTime: 12,
        cookTime: 18,
        servings: 1,
        calories: 380,
        ingredients: this.getCreativeIngredients("breakfast", breakfast.style)
      });
      
      // Lunch  
      const lunch = creativeLunches[(day + dayOffset * 2) % creativeLunches.length];
      meals.push({
        name: lunch.name,
        type: "lunch",
        dayOfWeek: day,
        instructions: `Prepare this ${lunch.style} fusion lunch with attention to texture contrasts and bold flavor combinations. Build layers of taste for maximum impact.`,
        prepTime: 18,
        cookTime: 22,
        servings: 1,
        calories: 480,
        ingredients: this.getCreativeIngredients("lunch", lunch.style)
      });
      
      // Dinner
      const dinner = creativeDinners[(day + dayOffset * 3) % creativeDinners.length];
      meals.push({
        name: dinner.name,
        type: "dinner",
        dayOfWeek: day,
        instructions: `Cook this ${dinner.style} fusion dinner with professional techniques. Focus on proper seasoning, temperature control, and elegant plating.`,
        prepTime: 25,
        cookTime: 30,
        servings: 1,
        calories: 580,
        ingredients: this.getCreativeIngredients("dinner", dinner.style)
      });
    }
    
    console.log(`Generated ultra-creative fallback meal plan with ${meals.length} unique fusion meals`);
    return { meals };
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
