
import { supabase } from "@/integrations/supabase/client";
import { convertToWalmartPackaging } from './walmartPricing';

export interface MealPlanIngredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_cost: number;
}

export interface ConsolidatedIngredient {
  name: string;
  totalQuantity: number;
  unit: string;
  category: string;
  estimatedCost: number;
  walmartPackaging?: {
    packageDescription: string;
    estimatedCost: number;
    quantity: number;
  };
}

export const generateShoppingListFromMealPlan = async (
  mealPlanId: string,
  userId: string,
  listName?: string
): Promise<string> => {
  console.log('Generating Walmart-optimized shopping list for meal plan:', mealPlanId);

  // Fetch all meals and their ingredients for the meal plan
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select(`
      *,
      meal_ingredients (
        ingredient_name,
        quantity,
        unit,
        category,
        estimated_cost
      )
    `)
    .eq('meal_plan_id', mealPlanId);

  if (mealsError) {
    console.error('Error fetching meals:', mealsError);
    throw new Error('Failed to fetch meals for shopping list generation');
  }

  if (!meals || meals.length === 0) {
    throw new Error('No meals found for this meal plan');
  }

  console.log(`Found ${meals.length} meals with ingredients`);

  // Collect all ingredients from all meals
  const allIngredients: MealPlanIngredient[] = [];
  meals.forEach(meal => {
    if (meal.meal_ingredients && meal.meal_ingredients.length > 0) {
      console.log(`Processing ${meal.meal_ingredients.length} ingredients from meal: ${meal.name}`);
      meal.meal_ingredients.forEach(ingredient => {
        allIngredients.push({
          ingredient_name: ingredient.ingredient_name,
          quantity: ingredient.quantity || 1,
          unit: ingredient.unit || 'item',
          category: ingredient.category || 'Other',
          estimated_cost: ingredient.estimated_cost || 0
        });
      });
    }
  });

  console.log(`Total ingredients collected: ${allIngredients.length}`);

  if (allIngredients.length === 0) {
    throw new Error('No ingredients found in the meal plan');
  }

  // Consolidate ingredients and convert to Walmart packaging
  const consolidatedIngredients = consolidateIngredientsWithWalmart(allIngredients);
  console.log(`Consolidated to ${consolidatedIngredients.length} unique Walmart items`);

  // Get meal plan name for the shopping list
  const { data: mealPlan } = await supabase
    .from('meal_plans')
    .select('name')
    .eq('id', mealPlanId)
    .single();

  const shoppingListName = listName || `${mealPlan?.name || 'Meal Plan'} - Walmart Shopping List`;

  // Create the shopping list
  const { data: shoppingList, error: listError } = await supabase
    .from('shopping_lists')
    .insert({
      name: shoppingListName,
      user_id: userId,
      meal_plan_id: mealPlanId
    })
    .select()
    .single();

  if (listError) {
    console.error('Error creating shopping list:', listError);
    throw new Error('Failed to create shopping list');
  }

  console.log('Created Walmart shopping list:', shoppingList.id);

  // Add all consolidated ingredients to the shopping list with Walmart packaging
  const shoppingListItems = consolidatedIngredients.map(ingredient => ({
    shopping_list_id: shoppingList.id,
    ingredient_name: ingredient.name,
    quantity: ingredient.walmartPackaging?.quantity || ingredient.totalQuantity,
    unit: ingredient.walmartPackaging ? 'package' : ingredient.unit,
    category: ingredient.category,
    estimated_cost: ingredient.walmartPackaging?.estimatedCost || ingredient.estimatedCost,
    is_purchased: false,
    notes: ingredient.walmartPackaging?.packageDescription || ''
  }));

  const { error: itemsError } = await supabase
    .from('shopping_list_items')
    .insert(shoppingListItems);

  if (itemsError) {
    console.error('Error adding items to shopping list:', itemsError);
    throw new Error('Failed to add items to shopping list');
  }

  console.log(`Added ${shoppingListItems.length} Walmart items to shopping list`);

  return shoppingList.id;
};

const consolidateIngredientsWithWalmart = (ingredients: MealPlanIngredient[]): ConsolidatedIngredient[] => {
  const consolidated = new Map<string, ConsolidatedIngredient>();

  ingredients.forEach(ingredient => {
    const key = `${ingredient.ingredient_name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.totalQuantity += ingredient.quantity;
      existing.estimatedCost += ingredient.estimated_cost;
    } else {
      // Convert to Walmart packaging
      const walmartPackaging = convertToWalmartPackaging(
        ingredient.ingredient_name,
        ingredient.quantity,
        ingredient.unit
      );
      
      consolidated.set(key, {
        name: ingredient.ingredient_name,
        totalQuantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        estimatedCost: ingredient.estimated_cost,
        walmartPackaging
      });
    }
  });

  return Array.from(consolidated.values());
};
