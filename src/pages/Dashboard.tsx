
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, ShoppingCart, User, Plus, Calendar, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch user's meal plans
  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ['meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user's shopping lists
  const { data: shoppingLists, isLoading: shoppingListsLoading } = useQuery({
    queryKey: ['shopping-lists-summary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view the dashboard.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {user.email?.split('@')[0]}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/profile-setup')}
            className="rounded-full"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Quick Actions - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => navigate('/meal-plan-generator')}
            className="h-20 flex-col gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg"
            size="lg"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">New Plan</span>
          </Button>
          <Button 
            onClick={() => navigate('/shopping-list')}
            variant="outline"
            className="h-20 flex-col gap-2 border-2 border-blue-200 hover:bg-blue-50 rounded-xl shadow-lg"
            size="lg"
          >
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Shopping</span>
          </Button>
        </div>

        {/* Recent Meal Plans */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Meal Plans</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/meal-plan-generator')}
              className="text-green-600 hover:text-green-700"
            >
              View All
            </Button>
          </div>
          
          {mealPlansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : mealPlans && mealPlans.length > 0 ? (
            <div className="space-y-3">
              {mealPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/meal-plan/${plan.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{plan.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChefHat className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-2">No meal plans yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create your first meal plan to get started</p>
                <Button 
                  onClick={() => navigate('/meal-plan-generator')}
                  size="sm"
                  className="w-full"
                >
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Shopping Lists */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Shopping Lists</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/shopping-list')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>
          
          {shoppingListsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : shoppingLists && shoppingLists.length > 0 ? (
            <div className="space-y-3">
              {shoppingLists.map((list) => (
                <Card 
                  key={list.id} 
                  className="shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate('/shopping-list')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{list.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <List className="h-4 w-4 mr-1" />
                          {list.shopping_list_items?.length || 0} items
                        </p>
                      </div>
                      <ShoppingCart className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-2">No shopping lists yet</h3>
                <p className="text-xs text-gray-500 mb-4">Create your first shopping list</p>
                <Button 
                  onClick={() => navigate('/shopping-list')}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  Create Shopping List
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
