import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MealPlanFormData {
  planName: string;
  description: string;
  startDate: string;
  endDate: string;
  targetCalories: number;
  numberOfMeals: number;
  dietaryRestrictions: string[];
  allergies: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface NutritionRequirements {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanServiceParams {
  userId: string;
  mealPlanData: MealPlanFormData;
  nutritionRequirements: NutritionRequirements;
}

interface MealPlanServiceResult {
  success: boolean;
  mealPlan?: any;
  error?: string;
}

const validateMealPlanData = (formData: MealPlanFormData): ValidationResult => {
  const errors: string[] = [];

  if (!formData.planName) {
    errors.push('Plan name is required');
  }

  if (!formData.startDate) {
    errors.push('Start date is required');
  }

  if (!formData.endDate) {
    errors.push('End date is required');
  }

  if (!formData.targetCalories) {
    errors.push('Target calories are required');
  }

  if (!formData.numberOfMeals) {
    errors.push('Number of meals is required');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

const calculateNutritionRequirements = (formData: MealPlanFormData): NutritionRequirements => {
  // Basic calculation - can be adjusted based on specific needs
  const calories = formData.targetCalories;
  const protein = calories * 0.3 / 4; // 30% of calories from protein
  const carbs = calories * 0.4 / 4;    // 40% of calories from carbs
  const fat = calories * 0.3 / 9;      // 30% of calories from fat

  return {
    calories: calories,
    protein: protein,
    carbs: carbs,
    fat: fat
  };
};

const generateMealPlanService = async (params: MealPlanServiceParams): Promise<MealPlanServiceResult> => {
  // Mock implementation - replace with actual API call to meal plan generation service
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockMealPlan = {
    meals: Array.from({ length: params.mealPlanData.numberOfMeals }, (_, i) => ({
      name: `Meal ${i + 1}`,
      type: 'Breakfast',
      dayOfWeek: (i % 7) + 1,
      instructions: 'Mix ingredients and cook.',
      nutrition: {
        calories: params.nutritionRequirements.calories / params.mealPlanData.numberOfMeals,
      },
      servings: 1,
      prepTime: 10,
      cookTime: 20,
      ingredients: [
        { name: 'Ingredient 1', quantity: 1, unit: 'cup', category: 'Grains', estimatedCost: 1.5 },
        { name: 'Ingredient 2', quantity: 2, unit: 'oz', category: 'Protein', estimatedCost: 3.0 },
      ]
    }))
  };

  return {
    success: true,
    mealPlan: mockMealPlan
  };
};

export const useMealPlanGeneration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMealPlan = async (formData: MealPlanFormData) => {
    if (!user) {
      throw new Error('User must be authenticated to generate meal plans');
    }

    setIsGenerating(true);
    console.log('Starting meal plan generation with data:', formData);

    try {
      // Validate form data
      const validationResult = validateMealPlanData(formData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Prepare generation parameters
      const generationParams = {
        userId: user.id,
        mealPlanData: formData,
        nutritionRequirements: calculateNutritionRequirements(formData)
      };

      console.log('Generation parameters:', generationParams);

      // Call the meal plan service
      const result = await generateMealPlanService(generationParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate meal plan');
      }

      console.log('Meal plan generated successfully:', result.mealPlan);

      // Save the meal plan to database
      const { data: savedMealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          name: formData.planName,
          description: formData.description || null,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_active: true
        })
        .select()
        .single();

      if (mealPlanError) {
        console.error('Error saving meal plan:', mealPlanError);
        throw mealPlanError;
      }

      if (!savedMealPlan) {
        throw new Error('Failed to save meal plan');
      }

      console.log('Meal plan saved with ID:', savedMealPlan.id);
      
      // Save meals and ingredients
      if (result.mealPlan?.meals && result.mealPlan.meals.length > 0) {
        const mealsToInsert = result.mealPlan.meals.map((meal: any) => ({
          meal_plan_id: savedMealPlan.id,
          name: meal.name,
          meal_type: meal.type,
          day_of_week: meal.dayOfWeek,
          recipe_instructions: meal.instructions || null,
          calories_per_serving: meal.nutrition?.calories || null,
          servings: meal.servings || null,
          prep_time_minutes: meal.prepTime || null,
          cook_time_minutes: meal.cookTime || null
        }));

        const { data: savedMeals, error: mealsError } = await supabase
          .from('meals')
          .insert(mealsToInsert)
          .select();

        if (mealsError) {
          console.error('Error saving meals:', mealsError);
          throw mealsError;
        }

        if (!savedMeals) {
          throw new Error('Failed to save meals');
        }

        // Save ingredients for each meal
        const allIngredients: any[] = [];
        result.mealPlan.meals.forEach((meal: any, mealIndex: number) => {
          if (meal.ingredients && savedMeals[mealIndex]) {
            meal.ingredients.forEach((ingredient: any) => {
              allIngredients.push({
                meal_id: savedMeals[mealIndex].id,
                ingredient_name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category || null,
                estimated_cost: ingredient.estimatedCost || 0
              });
            });
          }
        });

        if (allIngredients.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('meal_ingredients')
            .insert(allIngredients);

          if (ingredientsError) {
            console.error('Error saving ingredients:', ingredientsError);
            throw ingredientsError;
          }
        }
      }

      toast({
        title: "Meal Plan Generated!",
        description: `Your meal plan "${formData.planName}" has been created successfully.`,
      });

      return {
        success: true,
        mealPlan: savedMealPlan,
        generatedData: result.mealPlan
      };

    } catch (error) {
      console.error('Error in meal plan generation:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while generating your meal plan';

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateMealPlan,
    isGenerating
  };
};
