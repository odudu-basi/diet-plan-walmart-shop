
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Use a simple interface instead of the complex Supabase type
interface MealPlan {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  [key: string]: any;
}

interface ShoppingListFormProps {
  listName: string;
  setListName: (name: string) => void;
  selectedMealPlan: string;
  setSelectedMealPlan: (planId: string) => void;
  mealPlans?: MealPlan[];
}

const ShoppingListForm = ({
  listName,
  setListName,
  selectedMealPlan,
  setSelectedMealPlan,
  mealPlans
}: ShoppingListFormProps) => {
  return (
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
    </div>
  );
};

export default ShoppingListForm;
