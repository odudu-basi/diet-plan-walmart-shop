
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShoppingCart, Loader2 } from "lucide-react";

interface CreateShoppingListDialogProps {
  onListCreated: () => void;
}

const CreateShoppingListDialog = ({ onListCreated }: CreateShoppingListDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedMealPlan, setSelectedMealPlan] = useState('');

  // Fetch user's active meal plans
  const { data: mealPlans } = useQuery({
    queryKey: ['meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id' as any, user.id)
        .eq('is_active' as any, true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open
  });

  const handleCreateShoppingList = async () => {
    if (!user || !listName.trim()) return;

    setIsCreating(true);
    
    try {
      if (selectedMealPlan) {
        // Generate shopping list from meal plan
        await generateFromMealPlan();
      } else {
        // Create empty shopping list
        const { error } = await supabase
          .from('shopping_lists')
          .insert({
            user_id: user.id,
            name: listName,
            status: 'active'
          } as any);

        if (error) throw error;
      }

      toast({
        title: "Shopping List Created!",
        description: "Your shopping list has been created successfully.",
      });

      setOpen(false);
      setListName('');
      setSelectedMealPlan('');
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

  const generateFromMealPlan = async () => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Shopping List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span>Create Shopping List</span>
          </DialogTitle>
          <DialogDescription>
            Create a new shopping list from scratch or generate one from an existing meal plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listName">Shopping List Name</Label>
            <Input
              id="listName"
              placeholder="e.g., Weekly Groceries, Meal Prep List"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Generate from Meal Plan (Optional)</Label>
            <Select value={selectedMealPlan} onValueChange={setSelectedMealPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a meal plan or leave empty for blank list" />
              </SelectTrigger>
              <SelectContent>
                {mealPlans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateShoppingList} 
              disabled={!listName.trim() || isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create List
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShoppingListDialog;
