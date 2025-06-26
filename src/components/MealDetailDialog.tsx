
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, Flame, ShoppingCart, ChefHat } from "lucide-react";

interface MealDetailDialogProps {
  meal: any;
  isOpen: boolean;
  onClose: () => void;
}

const MealDetailDialog = ({ meal, isOpen, onClose }: MealDetailDialogProps) => {
  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lunch': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dinner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'snack': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group ingredients by category
  const ingredientsByCategory = meal.meal_ingredients?.reduce((acc: any, ingredient: any) => {
    const category = ingredient.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(ingredient);
    return acc;
  }, {}) || {};

  const totalEstimatedCost = meal.meal_ingredients?.reduce((total: number, ingredient: any) => {
    return total + (ingredient.estimated_cost || 0);
  }, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className={`${getMealTypeColor(meal.meal_type)} border`}>
              {getMealTypeIcon(meal.meal_type)} {meal.meal_type}
            </Badge>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {meal.prep_time_minutes && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Prep: {meal.prep_time_minutes}min
                </div>
              )}
              {meal.cook_time_minutes && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Cook: {meal.cook_time_minutes}min
                </div>
              )}
              {meal.servings && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {meal.servings} servings
                </div>
              )}
              {meal.calories_per_serving && (
                <div className="flex items-center">
                  <Flame className="h-4 w-4 mr-1 text-orange-500" />
                  {meal.calories_per_serving} cal/serving
                </div>
              )}
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800 mt-4">
            {meal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* Recipe Instructions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-800">Recipe Instructions</h3>
            </div>
            
            {meal.recipe_instructions ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {meal.recipe_instructions}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                No recipe instructions available
              </div>
            )}
          </div>

          {/* Shopping List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-800">Shopping List</h3>
              </div>
              {totalEstimatedCost > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Est. ${totalEstimatedCost.toFixed(2)}
                </Badge>
              )}
            </div>

            {meal.meal_ingredients && meal.meal_ingredients.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(ingredientsByCategory).map(([category, ingredients]: [string, any]) => (
                  <div key={category} className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {ingredients.map((ingredient: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              {ingredient.ingredient_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {ingredient.quantity} {ingredient.unit}
                            </div>
                          </div>
                          {ingredient.estimated_cost && (
                            <div className="text-sm font-medium text-green-600">
                              ${ingredient.estimated_cost.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                No ingredients listed for this meal
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealDetailDialog;
