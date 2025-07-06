
import { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useShoppingListCreation = (onListCreated: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createEmptyShoppingList = async (listName: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id,
        name: listName,
        status: 'active'
      } as any);

    if (error) throw error;
  };

  const generateFromMealPlan = async (selectedMealPlan: string, listName: string) => {
    if (!user || !selectedMealPlan) return;

    // Fetch all ingredients from the meal plan
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select(`
        *,
        meal_ingredients (*)
      `)
      .eq('meal_plan_id' as any, selectedMealPlan);

    if (mealsError) throw mealsError;

    // Aggregate ingredients by name and category
    const ingredientMap = new Map();
    let totalCost = 0;

    meals?.forEach(meal => {
      const mealIngredients = (meal as any).meal_ingredients;
      mealIngredients?.forEach((ingredient: any) => {
        const key = `${ingredient.ingredient_name}-${ingredient.unit}`;
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          existing.quantity += ingredient.quantity;
          existing.estimatedCost += ingredient.estimated_cost || 0;
        } else {
          ingredientMap.set(key, {
            name: ingredient.ingredient_name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            category: ingredient.category,
            estimatedCost: ingredient.estimated_cost || 0
          });
        }
        totalCost += ingredient.estimated_cost || 0;
      });
    });

    // Create shopping list
    const { data: shoppingList, error: listError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id,
        meal_plan_id: selectedMealPlan,
        name: listName,
        status: 'active',
        total_estimated_cost: totalCost
      } as any)
      .select()
      .single();

    if (listError) throw listError;

    if (!shoppingList) {
      throw new Error('Failed to create shopping list');
    }

    // Create shopping list items
    const items = Array.from(ingredientMap.values()).map(ingredient => ({
      shopping_list_id: shoppingList.id,
      ingredient_name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
      estimated_cost: ingredient.estimatedCost,
      is_purchased: false
    }));

    const { error: itemsError } = await supabase
      .from('shopping_list_items')
      .insert(items as any);

    if (itemsError) throw itemsError;
  };

  const handleCreateShoppingList = async (listName: string, selectedMealPlan: string) => {
    if (!user || !listName.trim()) return;

    setIsCreating(true);
    
    try {
      if (selectedMealPlan) {
        await generateFromMealPlan(selectedMealPlan, listName);
      } else {
        await createEmptyShoppingList(listName);
      }

      toast({
        title: "Shopping List Created!",
        description: "Your shopping list has been created successfully.",
      });

      onListCreated();
    } catch (error) {
      console.error('Error creating shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to create shopping list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    handleCreateShoppingList
  };
};
