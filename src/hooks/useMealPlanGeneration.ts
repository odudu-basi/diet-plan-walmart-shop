
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface MealPlanFormData {
  planName: string;
  duration: string;
  targetCalories: string;
  additionalNotes: string;
}

interface Profile {
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  activity_level?: string;
  dietary_restrictions?: string[];
  allergies?: string;
  budget_range?: string;
}

export const useMealPlanGeneration = (profile: Profile | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMealPlan = async (formData: MealPlanFormData) => {
    console.log('Form submitted with data:', formData);
    
    if (!user || !profile) {
      console.log('Missing user or profile:', { user: !!user, profile: !!profile });
      toast({
        title: "Error",
        description: "Please complete your profile setup first.",
        variant: "destructive",
      });
      navigate('/profile-setup');
      return;
    }

    // Validate required fields
    if (!formData.planName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a meal plan name.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log('Starting meal plan generation...');

    try {
      // Prepare profile data for the edge function
      const profileData = {
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        activityLevel: profile.activity_level,
        dietaryRestrictions: profile.dietary_restrictions || [],
        allergies: profile.allergies,
        budgetRange: profile.budget_range
      };

      console.log('Profile data being sent:', profileData);

      // Validate profile has required data
      if (!profileData.age || !profileData.weight || !profileData.height || !profileData.goal) {
        toast({
          title: "Incomplete Profile",
          description: "Please complete your profile with age, weight, height, and goal before generating a meal plan.",
          variant: "destructive",
        });
        navigate('/profile-setup');
        return;
      }

      // Show progress toast
      toast({
        title: "Generating Meal Plan",
        description: "This may take up to 2 minutes. Please wait...",
      });

      // Call the Supabase edge function to generate meal plan with extended timeout
      console.log('Calling generate-meal-plan edge function...');
      const { data: result, error: functionError } = await supabase.functions.invoke('generate-meal-plan', {
        body: {
          profile: profileData,
          planDetails: {
            planName: formData.planName,
            duration: parseInt(formData.duration),
            targetCalories: formData.targetCalories ? parseInt(formData.targetCalories) : null,
            additionalNotes: formData.additionalNotes
          }
        }
      });

      console.log('Edge function response:', { result, error: functionError });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Edge function failed: ${functionError.message || 'Unknown error'}`);
      }

      if (!result || !result.meals) {
        console.error('Invalid result from edge function:', result);
        throw new Error('Invalid response from meal plan generator');
      }

      console.log('Generated meal plan:', result);

      // Save the meal plan to the database
      console.log('Saving meal plan to database...');
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          name: formData.planName,
          description: `AI-generated meal plan for ${profile.goal}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + parseInt(formData.duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (mealPlanError) {
        console.error('Meal plan save error:', mealPlanError);
        throw new Error(`Failed to save meal plan: ${mealPlanError.message}`);
      }

      console.log('Saved meal plan:', mealPlan);

      // Create shopping list for the meal plan
      console.log('Creating shopping list for meal plan...');
      const { data: shoppingList, error: shoppingListError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: `${formData.planName} Shopping List`,
          meal_plan_id: mealPlan.id,
          status: 'active'
        })
        .select()
        .single();

      if (shoppingListError) {
        console.error('Shopping list creation error:', shoppingListError);
        throw new Error(`Failed to create shopping list: ${shoppingListError.message}`);
      }

      console.log('Created shopping list:', shoppingList);

      // Save individual meals and collect ingredients
      console.log('Saving meals to database...');
      const allIngredients: Array<{
        ingredient_name: string;
        quantity: number;
        unit: string;
        category: string;
        estimated_cost: number;
      }> = [];

      for (const meal of result.meals) {
        console.log('Saving meal:', meal.name);
        const { data: savedMeal, error: mealError } = await supabase
          .from('meals')
          .insert({
            meal_plan_id: mealPlan.id,
            name: meal.name,
            meal_type: meal.type,
            day_of_week: meal.dayOfWeek,
            recipe_instructions: meal.instructions,
            prep_time_minutes: meal.prepTime,
            cook_time_minutes: meal.cookTime,
            servings: meal.servings,
            calories_per_serving: meal.calories
          })
          .select()
          .single();

        if (mealError) {
          console.error('Meal save error:', mealError);
          throw new Error(`Failed to save meal ${meal.name}: ${mealError.message}`);
        }

        // Save ingredients for each meal and collect for shopping list
        if (meal.ingredients && meal.ingredients.length > 0) {
          console.log(`Saving ${meal.ingredients.length} ingredients for meal:`, meal.name);
          for (const ingredient of meal.ingredients) {
            const { error: ingredientError } = await supabase
              .from('meal_ingredients')
              .insert({
                meal_id: savedMeal.id,
                ingredient_name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
                estimated_cost: ingredient.estimatedCost
              });

            if (ingredientError) {
              console.error('Ingredient save error:', ingredientError);
            }

            // Add to shopping list ingredients (combine duplicates)
            const existingIngredient = allIngredients.find(
              item => item.ingredient_name.toLowerCase() === ingredient.name.toLowerCase() && 
                     item.unit === ingredient.unit
            );

            if (existingIngredient) {
              existingIngredient.quantity += ingredient.quantity;
            } else {
              allIngredients.push({
                ingredient_name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category || 'Other',
                estimated_cost: ingredient.estimatedCost
              });
            }
          }
        }
      }

      // Add all ingredients to the shopping list
      if (allIngredients.length > 0) {
        console.log(`Adding ${allIngredients.length} unique ingredients to shopping list...`);
        const shoppingListItems = allIngredients.map(ingredient => ({
          shopping_list_id: shoppingList.id,
          ingredient_name: ingredient.ingredient_name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category || 'Other',
          estimated_cost: ingredient.estimated_cost,
          is_purchased: false
        }));

        const { error: itemsError } = await supabase
          .from('shopping_list_items')
          .insert(shoppingListItems);

        if (itemsError) {
          console.error('Shopping list items creation error:', itemsError);
          // Don't throw here, the meal plan is already created
        }
      }

      console.log('Meal plan generation completed successfully');
      toast({
        title: "Meal Plan Generated!",
        description: "Your personalized meal plan and shopping list have been created successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateMealPlan
  };
};
