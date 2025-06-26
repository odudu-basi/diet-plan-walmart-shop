
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, ChefHat, Plus } from "lucide-react";

const AllMealPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch all user's meal plans
  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ['all-meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen fresh-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view meal plans.</p>
          <Button onClick={() => navigate('/')} className="w-full gradient-fresh">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen fresh-gradient">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-emerald-100/30 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                All Meal Plans
              </h1>
              <p className="text-xs text-emerald-600">Manage your meal planning journey</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/meal-plan-generator')}
            className="gradient-fresh hover:from-emerald-600 hover:to-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {mealPlansLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-emerald-50/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : mealPlans && mealPlans.length > 0 ? (
          <div className="grid gap-4">
            {mealPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className="shadow-md border-0 glass-card border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg hover:bg-emerald-50/90 transition-all duration-200 rounded-xl produce-shadow"
                onClick={() => navigate(`/meal-plan/${plan.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-emerald-900 truncate mb-2">{plan.name}</h3>
                      {plan.description && (
                        <p className="text-sm text-emerald-700 mb-3 line-clamp-2">{plan.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-emerald-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </div>
                        {plan.start_date && plan.end_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-emerald-100 p-3 rounded-full">
                        <ChefHat className="h-6 w-6 text-emerald-600" />
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                        View Plan
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-emerald-200 glass-card rounded-xl">
            <CardContent className="p-12 text-center">
              <div className="bg-emerald-100 p-4 rounded-full w-fit mx-auto mb-4">
                <ChefHat className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-3">No meal plans yet</h3>
              <p className="text-emerald-600 mb-6 max-w-md mx-auto">
                Start your meal planning journey by creating your first personalized meal plan with FreshCart
              </p>
              <Button 
                onClick={() => navigate('/meal-plan-generator')}
                size="lg"
                className="gradient-fresh hover:from-emerald-600 hover:to-green-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Meal Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AllMealPlans;
