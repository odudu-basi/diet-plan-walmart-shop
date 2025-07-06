
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, PlanDetails, Meal, MealPlan } from '@/types/mealPlan';

export const generateMealPlanFromAI = async (
  userProfile: UserProfile,
  planDetails: PlanDetails,
  planName: string,
  additionalNotes: string
): Promise<MealPlan> => {
  console.log('Calling enhanced meal plan generation with cultural preferences and dietary restrictions...');
  
  const { data: generatedMealPlan, error: functionError } = await supabase.functions.invoke('generate-meal-plan', {
    body: { 
      profile: userProfile, 
      planDetails: {
        ...planDetails,
        planName,
        additionalNotes
      }
    }
  });

  if (functionError) {
    console.error('Edge function error:', functionError);
    throw new Error(functionError.message || 'Failed to generate personalized meal plan');
  }

  if (!generatedMealPlan || !generatedMealPlan.meals) {
    throw new Error('Invalid meal plan data received from AI');
  }

  return generatedMealPlan as MealPlan;
};

export const saveMealPlanToDatabase = async (
  mealPlan: MealPlan,
  userProfile: UserProfile,
  planDetails: PlanDetails,
  planName: string,
  targetCalories: number,
  profileId: string
) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + planDetails.duration - 1);

  const mealPlanData = {
    user_id: profileId,
    name: planName || `${planDetails.duration}-Day Personalized Plan`,
    description: `AI-generated meal plan tailored for ${userProfile.goal} (${targetCalories} cal/day)`,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  };

  const { data: savedMealPlan, error: mealPlanError } = await supabase
    .from('meal_plans')
    .insert(mealPlanData)
    .select()
    .single();

  if (mealPlanError || !savedMealPlan) {
    console.error('Error creating meal plan:', mealPlanError);
    throw new Error('Failed to save personalized meal plan');
  }

  console.log('Created personalized meal plan:', savedMealPlan.id);
  return savedMealPlan;
};

export const saveMealsToDatabase = async (meals: Meal[], mealPlanId: string) => {
  for (const [index, meal] of meals.entries()) {
    console.log(`Saving meal ${index + 1}/${meals.length}:`, meal.name);
    
    const mealData = {
      meal_plan_id: mealPlanId,
      name: meal.name,
      meal_type: meal.type,
      day_of_week: meal.dayOfWeek,
      recipe_instructions: meal.instructions,
      prep_time_minutes: meal.prepTime,
      cook_time_minutes: meal.cookTime,
      servings: meal.servings,
      calories_per_serving: meal.calories,
    };

    const { data: savedMeal, error: mealError } = await supabase
      .from('meals')
      .insert(mealData)
      .select()
      .single();

    if (mealError || !savedMeal) {
      console.error('Error saving meal:', mealError);
      throw new Error(`Failed to save meal: ${meal.name}`);
    }

    // Save ingredients for this meal
    if (meal.ingredients && meal.ingredients.length > 0) {
      console.log(`Saving ${meal.ingredients.length} ingredients for:`, meal.name);
      
      const ingredientsToSave = meal.ingredients.map(ingredient => ({
        meal_id: savedMeal.id,
        ingredient_name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        estimated_cost: ingredient.estimatedCost,
      }));

      const { error: ingredientError } = await supabase
        .from('meal_ingredients')
        .insert(ingredientsToSave);

      if (ingredientError) {
        console.error('Error saving ingredients:', ingredientError);
        throw new Error(`Failed to save ingredients for meal: ${meal.name}`);
      }
    }
  }
};
