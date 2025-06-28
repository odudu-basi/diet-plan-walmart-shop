
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Flame, ChefHat, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MealDetailDialog from "@/components/MealDetailDialog";

const WeeklyMealPlan = () => {
  const navigate = useNavigate();
  const { mealPlanId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Fetch meal plan details
  const { data: mealPlan, isLoading: mealPlanLoading } = useQuery({
    queryKey: ['meal-plan', mealPlanId],
    queryFn: async () => {
      if (!mealPlanId) return null;
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', mealPlanId)
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!mealPlanId && !!user
  });

  // Fetch meals for the meal plan
  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ['meals', mealPlanId],
    queryFn: async () => {
      if (!mealPlanId) return [];
      const { data, error } = await supabase
        .from('meals')
        .select(`
          *,
          meal_ingredients (*)
        `)
        .eq('meal_plan_id', mealPlanId)
        .order('day_of_week', { ascending: true })
        .order('meal_type', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!mealPlanId
  });

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || `Day ${dayNumber}`;
  };

  const getMealTypeIcon = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const getMealTypeColor = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lunch': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dinner': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'snack': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group meals by day
  const mealsByDay = meals?.reduce((acc, meal) => {
    const day = meal.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(meal);
    return acc;
  }, {}) || {};

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view meal plans.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (mealPlanLoading || mealsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Meal Plan Not Found</h2>
          <p className="text-gray-600 mb-4">The meal plan you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-green-600 hover:bg-green-700">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-800 hover:bg-green-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full shadow-lg">
                <ChefHat className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                {mealPlan.name}
              </h1>
              {mealPlan.description && (
                <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
                  {mealPlan.description}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-gray-700 font-medium">
                  {new Date(mealPlan.start_date).toLocaleDateString()} - {new Date(mealPlan.end_date).toLocaleDateString()}
                </span>
              </div>
              
              <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200 px-4 py-2 text-sm font-medium">
                <ChefHat className="h-4 w-4 mr-2" />
                {meals?.length || 0} meals planned
              </Badge>
              
              <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700 font-medium">
                  Nutritionally Balanced
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 pt-8">
        {/* Meal Plan Grid */}
        <div className="space-y-8">
          {Object.keys(mealsByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((dayNumber) => (
              <div key={dayNumber} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 border-b-2 border-green-200 pb-2">
                  {getDayName(parseInt(dayNumber))}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mealsByDay[dayNumber].map((meal) => (
                    <Card 
                      key={meal.id} 
                      className="shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-l-4 border-l-green-500"
                      onClick={() => setSelectedMeal(meal)}
                    >
                      <CardHeader className="pb-3">
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
                        <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                          {meal.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          {meal.prep_time_minutes && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Prep: {meal.prep_time_minutes}min
                            </div>
                          )}
                          {meal.servings && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {meal.servings} servings
                            </div>
                          )}
                        </div>
                        {meal.meal_ingredients && meal.meal_ingredients.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700">Ingredients:</p>
                            <div className="flex flex-wrap gap-1">
                              {meal.meal_ingredients.slice(0, 3).map((ingredient, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {ingredient.ingredient_name}
                                </Badge>
                              ))}
                              {meal.meal_ingredients.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{meal.meal_ingredients.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs text-green-600 font-medium">Click to view recipe & shopping list</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {meals && meals.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Meals Found</h3>
              <p className="text-gray-500 mb-4">This meal plan doesn't have any meals yet.</p>
              <Button onClick={() => navigate('/meal-plan-generator')} className="bg-green-600 hover:bg-green-700">
                Generate New Meal Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meal Detail Dialog */}
      {selectedMeal && (
        <MealDetailDialog 
          meal={selectedMeal} 
          isOpen={!!selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  );
};

export default WeeklyMealPlan;
