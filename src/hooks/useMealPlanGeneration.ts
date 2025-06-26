
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateShoppingListFromMealPlan } from '@/utils/shoppingListGenerator';

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  allergies: string;
  budgetRange: string;
}

export interface PlanDetails {
  duration: number;
  targetCalories?: number;
  createShoppingList: boolean;
}

export interface Meal {
  name: string;
  type: string;
  dayOfWeek: number;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    estimatedCost: number;
  }>;
}

export interface MealPlan {
  meals: Meal[];
}

export interface MealPlanFormData {
  planName: string;
  duration: string;
  targetCalories: string;
  additionalNotes: string;
}

export const useMealPlanGeneration = (profile: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();

  const generateMealPlan = async (formData: MealPlanFormData) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Profile data is required to generate meal plans.",
        variant: "destructive",
      });
      return { success: false, error: "Profile data missing" };
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Initializing meal plan generation...');

    try {
      // Convert form data to the expected format
      const userProfile: UserProfile = {
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activityLevel: profile.activity_level,
        dietaryRestrictions: profile.dietary_restrictions || [],
        allergies: profile.allergies || 'None',
        budgetRange: profile.budget_range || '50-100'
      };

      const planDetails: PlanDetails = {
        duration: parseInt(formData.duration),
        targetCalories: formData.targetCalories ? parseInt(formData.targetCalories) : undefined,
        createShoppingList: true
      };

      // Step 1: Generate meal plan via edge function
      setProgress(20);
      setCurrentStep('Generating personalized meals...');
      
      console.log('Calling meal plan generation function...');
      const { data: mealPlanData, error: functionError } = await supabase.functions.invoke('generate-meal-plan', {
        body: { profile: userProfile, planDetails }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to generate meal plan');
      }

      if (!mealPlanData || !mealPlanData.meals) {
        throw new Error('Invalid meal plan data received');
      }

      const mealPlan: MealPlan = mealPlanData;
      console.log('Received meal plan with', mealPlan.meals.length, 'meals');

      // Step 2: Create meal plan record
      setProgress(40);
      setCurrentStep('Saving meal plan...');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + planDetails.duration - 1);

      const { data: savedMealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: profile.id,
          name: formData.planName || `${planDetails.duration}-Day Meal Plan`,
          description: `Generated meal plan for ${profile.goal} goal`,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          target_calories: planDetails.targetCalories || 2000,
        })
        .select()
        .single();

      if (mealPlanError) {
        console.error('Error creating meal plan:', mealPlanError);
        throw new Error('Failed to save meal plan');
      }

      console.log('Created meal plan:', savedMealPlan.id);

      // Step 3: Save meals and ingredients
      setProgress(60);
      setCurrentStep('Saving meals and ingredients...');

      for (const meal of mealPlan.meals) {
        console.log('Saving meal:', meal.name);
        
        const { data: savedMeal, error: mealError } = await supabase
          .from('meals')
          .insert({
            meal_plan_id: savedMealPlan.id,
            name: meal.name,
            meal_type: meal.type,
            day_of_week: meal.dayOfWeek,
            recipe_instructions: meal.instructions,
            prep_time_minutes: meal.prepTime,
            cook_time_minutes: meal.cookTime,
            servings: meal.servings,
            calories_per_serving: meal.calories,
          })
          .select()
          .single();

        if (mealError) {
          console.error('Error saving meal:', mealError);
          throw new Error(`Failed to save meal: ${meal.name}`);
        }

        // Save ingredients for this meal
        if (meal.ingredients && meal.ingredients.length > 0) {
          console.log('Saving', meal.ingredients.length, 'ingredients for meal:', meal.name);
          
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

      // Step 4: Create shopping list if requested
      if (planDetails.createShoppingList) {
        setProgress(80);
        setCurrentStep('Creating shopping list...');

        try {
          const shoppingListId = await generateShoppingListFromMealPlan(
            savedMealPlan.id,
            profile.id,
            `${savedMealPlan.name} - Shopping List`
          );
          console.log('Created shopping list:', shoppingListId);
        } catch (shoppingListError) {
          console.error('Error creating shopping list:', shoppingListError);
          // Don't fail the entire process if shopping list creation fails
          toast({
            title: "Warning",
            description: "Meal plan created successfully, but shopping list creation failed. You can create it manually later.",
            variant: "destructive",
          });
        }
      }

      setProgress(100);
      setCurrentStep('Meal plan generation completed successfully!');

      toast({
        title: "Success!",
        description: `Your ${planDetails.duration}-day meal plan has been generated successfully!`,
      });

      return {
        success: true,
        mealPlanId: savedMealPlan.id,
        message: 'Meal plan generated successfully!'
      };

    } catch (error) {
      console.error('Meal plan generation error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateMealPlan,
    isGenerating,
    progress,
    currentStep,
  };
};
