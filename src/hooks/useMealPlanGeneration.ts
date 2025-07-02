import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateShoppingListFromMealPlan } from '@/utils/shoppingListGenerator';
import { useNavigate } from 'react-router-dom';

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
  culturalCuisines?: string[];
  otherCuisine?: string;
  maxCookingTime?: string;
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
  culturalCuisines: string[];
  otherCuisine: string;
  maxCookingTime: string;
}

export const useMealPlanGeneration = (profile: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

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
    setCurrentStep('Analyzing your profile for personalized nutrition...');

    try {
      // Enhanced profile processing for better personalization
      const userProfile: UserProfile = {
        age: profile.age || 30,
        weight: profile.weight || 150,
        height: profile.height || 66,
        goal: profile.goal || 'maintain-weight',
        activityLevel: profile.activity_level || 'moderate',
        dietaryRestrictions: profile.dietary_restrictions || [],
        allergies: profile.allergies || 'None',
        budgetRange: profile.budget_range || '50-100'
      };

      // Calculate personalized target calories if not provided
      let targetCalories = formData.targetCalories ? parseInt(formData.targetCalories) : undefined;
      
      if (!targetCalories) {
        // Enhanced calorie calculation based on profile
        const heightInCm = userProfile.height * 2.54;
        const weightInKg = userProfile.weight * 0.453592;
        
        // Mifflin-St Jeor Equation (assuming average gender for demo)
        let bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * userProfile.age) + 5;
        
        // Activity multipliers
        const activityMultipliers: { [key: string]: number } = {
          'sedentary': 1.2,
          'light': 1.375,
          'moderate': 1.55,
          'very': 1.725,
          'extra': 1.9
        };
        
        const tdee = bmr * (activityMultipliers[userProfile.activityLevel] || 1.55);
        
        // Goal adjustments
        switch (userProfile.goal) {
          case 'lose-weight':
            targetCalories = Math.round(tdee * 0.8); // 20% deficit
            break;
          case 'gain-weight':
            targetCalories = Math.round(tdee * 1.2); // 20% surplus
            break;
          case 'build-muscle':
            targetCalories = Math.round(tdee * 1.15); // 15% surplus
            break;
          default:
            targetCalories = Math.round(tdee);
        }
      }

      console.log('Personalized calorie target:', targetCalories);
      console.log('User profile for meal generation:', userProfile);
      console.log('Cultural cuisines selected:', formData.culturalCuisines);
      console.log('Max cooking time:', formData.maxCookingTime);

      const planDetails: PlanDetails = {
        duration: parseInt(formData.duration),
        targetCalories,
        createShoppingList: true,
        culturalCuisines: formData.culturalCuisines,
        otherCuisine: formData.otherCuisine,
        maxCookingTime: formData.maxCookingTime
      };

      // Step 1: Generate meal plan via edge function
      setProgress(20);
      setCurrentStep('Creating diverse, culturally-inspired meals...');
      
      console.log('Calling enhanced meal plan generation with cultural preferences...');
      const { data: mealPlanData, error: functionError } = await supabase.functions.invoke('generate-meal-plan', {
        body: { 
          profile: userProfile, 
          planDetails: {
            ...planDetails,
            planName: formData.planName,
            additionalNotes: formData.additionalNotes
          }
        }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to generate personalized meal plan');
      }

      if (!mealPlanData || !mealPlanData.meals) {
        throw new Error('Invalid meal plan data received from AI');
      }

      const mealPlan: MealPlan = mealPlanData;
      console.log('Received culturally-diverse meal plan with', mealPlan.meals.length, 'meals');

      // Validate meal diversity and cultural alignment
      const mealNames = mealPlan.meals.map(m => m.name.toLowerCase());
      const uniqueMeals = new Set(mealNames);
      const breakfastMeals = mealPlan.meals.filter(m => m.type === 'breakfast');
      const longBreakfasts = breakfastMeals.filter(m => (m.prepTime + m.cookTime) > 20);
      
      console.log(`Meal diversity check: ${uniqueMeals.size} unique meals out of ${mealNames.length} total meals`);
      console.log(`Breakfast compliance: ${breakfastMeals.length - longBreakasts.length}/${breakfastMeals.length} breakfasts are 20 minutes or less`);

      // Step 2: Create meal plan record
      setProgress(40);
      setCurrentStep('Saving your personalized meal plan...');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + planDetails.duration - 1);

      const { data: savedMealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: profile.id,
          name: formData.planName || `${planDetails.duration}-Day Personalized Plan`,
          description: `AI-generated meal plan tailored for ${userProfile.goal} (${targetCalories} cal/day)`,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (mealPlanError) {
        console.error('Error creating meal plan:', mealPlanError);
        throw new Error('Failed to save personalized meal plan');
      }

      console.log('Created personalized meal plan:', savedMealPlan.id);

      // Step 3: Save meals and ingredients
      setProgress(60);
      setCurrentStep('Saving meal details and ingredients...');

      for (const [index, meal] of mealPlan.meals.entries()) {
        console.log(`Saving meal ${index + 1}/${mealPlan.meals.length}:`, meal.name);
        
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

      // Step 4: Create shopping list if requested
      if (planDetails.createShoppingList) {
        setProgress(80);
        setCurrentStep('Creating optimized shopping list...');

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
      setCurrentStep('Your culturally-inspired meal plan is ready!');

      toast({
        title: "Success!",
        description: `Your personalized ${planDetails.duration}-day meal plan featuring ${formData.culturalCuisines.join(', ')} cuisines has been generated!`,
      });

      // Navigate to the meal plan page immediately
      navigate(`/meal-plan/${savedMealPlan.id}`);

      return {
        success: true,
        mealPlanId: savedMealPlan.id,
        message: `Culturally-diverse meal plan generated with ${uniqueMeals.size} unique meals!`,
        stats: {
          totalMeals: mealPlan.meals.length,
          uniqueMeals: uniqueMeals.size,
          targetCalories,
          goal: userProfile.goal,
          cuisines: formData.culturalCuisines,
          maxCookingTime: formData.maxCookingTime
        }
      };

    } catch (error) {
      console.error('Meal plan generation error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate personalized meal plan. Please try again.",
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
