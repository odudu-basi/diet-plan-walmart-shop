
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, Users, Flame, ChefHat, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MealDetailDialogProps {
  meal: any;
  isOpen: boolean;
  onClose: () => void;
}

const MealDetailDialog = ({ meal, isOpen, onClose }: MealDetailDialogProps) => {
  const { toast } = useToast();
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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

  const generateMealImage = async () => {
    if (!meal) return;

    setImageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meal-image', {
        body: {
          mealName: meal.name,
          mealType: meal.meal_type
        }
      });

      if (error) throw error;

      setMealImage(data.imageUrl);
    } catch (error) {
      console.error('Error generating meal image:', error);
      toast({
        title: "Image Generation Failed",
        description: "Could not generate image for this meal.",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && meal && !mealImage) {
      generateMealImage();
    }
  }, [isOpen, meal]);

  if (!meal) return null;

  const totalTime = (meal.prep_time_minutes || 0) + (meal.cook_time_minutes || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className={`${getMealTypeColor(meal.meal_type)} border`}>
              {getMealTypeIcon(meal.meal_type)} {meal.meal_type}
            </Badge>
            {meal.calories_per_serving && (
              <div className="flex items-center text-sm text-gray-600">
                <Flame className="h-4 w-4 mr-1 text-orange-500" />
                {meal.calories_per_serving} cal
              </div>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {meal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-4">
            {/* Meal Image */}
            <Card>
              <CardContent className="p-4">
                <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                  {imageLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-600">Generating image...</span>
                    </div>
                  ) : mealImage ? (
                    <img 
                      src={mealImage} 
                      alt={meal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Button
                        onClick={generateMealImage}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>Generate Image</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ChefHat className="h-5 w-5 mr-2 text-green-600" />
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {meal.prep_time_minutes && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Prep: {meal.prep_time_minutes}min</span>
                    </div>
                  )}
                  {meal.cook_time_minutes && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-red-500" />
                      <span>Cook: {meal.cook_time_minutes}min</span>
                    </div>
                  )}
                  {meal.servings && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-purple-500" />
                      <span>{meal.servings} servings</span>
                    </div>
                  )}
                  {totalTime > 0 && (
                    <div className="flex items-center text-sm font-medium">
                      <Clock className="h-4 w-4 mr-2 text-green-500" />
                      <span>Total: {totalTime}min</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recipe and Ingredients */}
          <div className="space-y-4">
            {/* Recipe Instructions */}
            {meal.recipe_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ChefHat className="h-5 w-5 mr-2 text-green-600" />
                    Recipe Instructions
                  </CardTitle>
                  <CardDescription>
                    Step-by-step guide to prepare this delicious meal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {meal.recipe_instructions.split('\n').map((step: string, index: number) => {
                      const trimmedStep = step.trim();
                      if (!trimmedStep) return null;
                      
                      return (
                        <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{trimmedStep}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ingredients */}
            {meal.meal_ingredients && meal.meal_ingredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                    Ingredients ({meal.meal_ingredients.length})
                  </CardTitle>
                  <CardDescription>
                    Everything you need to make this meal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {meal.meal_ingredients.map((ingredient: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-800">
                            {ingredient.ingredient_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{ingredient.quantity} {ingredient.unit}</span>
                          {ingredient.estimated_cost && (
                            <Badge variant="secondary" className="text-xs">
                              ${ingredient.estimated_cost.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total estimated cost */}
                  {meal.meal_ingredients.some((ing: any) => ing.estimated_cost) && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center font-semibold text-gray-800">
                        <span>Estimated Total Cost:</span>
                        <span className="text-green-600">
                          ${meal.meal_ingredients.reduce((total: number, ing: any) => 
                            total + (ing.estimated_cost || 0), 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MealDetailDialog;
