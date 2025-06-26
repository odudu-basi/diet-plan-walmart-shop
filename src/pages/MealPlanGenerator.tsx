
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleGenerateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please complete your profile setup first.",
        variant: "destructive",
      });
      navigate('/profile-setup');
      return;
    }

    setIsGenerating(true);

    try {
      // Call the OpenAI edge function to generate meal plan
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            goal: profile.goal,
            activityLevel: profile.activity_level,
            dietaryRestrictions: profile.dietary_restrictions || [],
            allergies: profile.allergies,
            budgetRange: profile.budget_range
          },
          planDetails: {
            name: formData.planName,
            duration: parseInt(formData.duration),
            targetCalories: formData.targetCalories ? parseInt(formData.targetCalories) : null,
            additionalNotes: formData.additionalNotes
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const result = await response.json();

      // Save the meal plan to the database
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

      if (mealPlanError) throw mealPlanError;

      // Save individual meals
      for (const meal of result.meals) {
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

        if (mealError) throw mealError;

        // Save ingredients for each meal
        for (const ingredient of meal.ingredients) {
          await supabase
            .from('meal_ingredients')
            .insert({
              meal_id: savedMeal.id,
              ingredient_name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: ingredient.category,
              estimated_cost: ingredient.estimatedCost
            });
        }
      }

      toast({
        title: "Meal Plan Generated!",
        description: "Your personalized meal plan has been created successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate meal plan. Please try again.",
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
                <p className="capitalize">{profile.goal?.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Activity Level</p>
                <p className="capitalize">{profile.activity_level}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Age</p>
                <p>{profile.age} years</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Weight</p>
                <p>{profile.weight} lbs</p>
              </div>
            </div>
            {profile.dietary_restrictions && profile.dietary_restrictions.length > 0 && (
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
                <Label htmlFor="planName">Meal Plan Name</Label>
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
