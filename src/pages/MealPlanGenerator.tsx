import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Utensils, Target, Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const MealPlanGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    planName: '',
    duration: '7',
    targetCalories: '',
    additionalNotes: ''
  });

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      console.log('Profile data:', data);
      return data;
    },
    enabled: !!user
  });

  const handleGenerateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Call the Supabase edge function to generate meal plan
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to generate meal plans.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 mb-4">Please complete your profile setup to generate personalized meal plans.</p>
          <Button onClick={() => navigate('/profile-setup')} className="bg-green-600 hover:bg-green-700">
            Complete Profile Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">AI Meal Plan Generator</h1>
          </div>
        </div>

        {/* Profile Summary */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Your Profile Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Goal</p>
                <p className="capitalize">{profile?.goal?.replace('-', ' ') || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Activity Level</p>
                <p className="capitalize">{profile?.activity_level || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Age</p>
                <p>{profile?.age ? `${profile.age} years` : 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Weight</p>
                <p>{profile?.weight ? `${profile.weight} lbs` : 'Not set'}</p>
              </div>
            </div>
            {profile?.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-gray-600 mb-2">Dietary Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {profile.dietary_restrictions.map((restriction, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              <span>Generate Your Meal Plan</span>
            </CardTitle>
            <CardDescription>
              Our AI will create a personalized meal plan based on your profile and preferences
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleGenerateMealPlan} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="planName">Meal Plan Name *</Label>
                <Input
                  id="planName"
                  placeholder="e.g., My Weight Loss Plan, Muscle Building Week"
                  value={formData.planName}
                  onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Plan Duration</Label>
                <Select 
                  value={formData.duration} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">1 Week (7 days)</SelectItem>
                    <SelectItem value="14">2 Weeks (14 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetCalories">Target Daily Calories (Optional)</Label>
                <Input
                  id="targetCalories"
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.targetCalories}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCalories: e.target.value }))}
                />
                <p className="text-sm text-gray-500">Leave empty for AI to calculate based on your goals</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Preferences</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any specific foods you love/hate, cooking time preferences, etc."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Your Meal Plan...
                  </>
                ) : (
                  <>
                    <Utensils className="h-4 w-4 mr-2" />
                    Generate AI Meal Plan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MealPlanGenerator;
