import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, ShoppingCart, User, Plus, Calendar, List, Sparkles, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch user's profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user
  });

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view the dashboard.</p>
          <Button onClick={() => navigate('/')} className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Get display name - prefer first name from profile, fallback to email prefix
  const displayName = profile?.first_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen fresh-gradient">
      {/* Modern Header with Logo */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-emerald-100/30 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="gradient-fresh p-2 rounded-xl shadow-md produce-shadow">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-yellow-400 p-1 rounded-full">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                FreshCart
              </h1>
              <p className="text-xs text-emerald-600">Welcome back, {displayName}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/profile-setup')}
            className="rounded-full hover:bg-emerald-50"
          >
            <User className="h-5 w-5 text-emerald-600" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Modern Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/meal-plan-generator')}
            className="h-24 flex-col gap-3 gradient-fresh hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-lg border-0 relative overflow-hidden group produce-shadow"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Create Plan</span>
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate('/shopping-list')}
            className="h-24 flex-col gap-3 bg-gradient-to-br from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-2xl shadow-lg border-0 relative overflow-hidden group produce-shadow"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="bg-white/20 p-2 rounded-full">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Shopping</span>
            </div>
          </Button>
        </div>

        {/* Recent Meal Plans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-emerald-600" />
              Recent Meal Plans
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/meal-plan-generator')}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
            >
              View All
            </Button>
          </div>
          
          {mealPlansLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-emerald-50/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : mealPlans && mealPlans.length > 0 ? (
            <div className="space-y-3">
              {mealPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="shadow-md border-0 glass-card border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg hover:bg-emerald-50/90 transition-all duration-200 rounded-xl produce-shadow"
                  onClick={() => navigate(`/meal-plan/${plan.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-emerald-900 truncate">{plan.name}</h3>
                        <p className="text-sm text-emerald-600 flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <ChefHat className="h-4 w-4 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-emerald-200 glass-card rounded-xl">
              <CardContent className="p-6 text-center">
                <div className="bg-emerald-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <ChefHat className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-emerald-800 mb-2">No meal plans yet</h3>
                <p className="text-xs text-emerald-600 mb-4">Create your first meal plan to get started with FreshCart</p>
                <Button 
                  onClick={() => navigate('/meal-plan-generator')}
                  size="sm"
                  className="w-full gradient-fresh hover:from-emerald-600 hover:to-green-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Create Meal Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Shopping Lists */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-teal-800 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-teal-600" />
              Shopping Lists
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/shopping-list')}
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            >
              View All
            </Button>
          </div>
          
          {shoppingListsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-teal-50/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : shoppingLists && shoppingLists.length > 0 ? (
            <div className="space-y-3">
              {shoppingLists.map((list) => (
                <Card 
                  key={list.id} 
                  className="shadow-md border-0 bg-teal-50/80 backdrop-blur-sm border border-teal-100/30 border-l-4 border-l-teal-500 cursor-pointer hover:shadow-lg hover:bg-teal-50/90 transition-all duration-200 rounded-xl produce-shadow"
                  onClick={() => navigate('/shopping-list')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-teal-900 truncate">{list.name}</h3>
                        <p className="text-sm text-teal-600 flex items-center mt-1">
                          <List className="h-4 w-4 mr-1" />
                          {list.shopping_list_items?.length || 0} items
                        </p>
                      </div>
                      <div className="bg-teal-100 p-2 rounded-full">
                        <ShoppingCart className="h-4 w-4 text-teal-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-teal-200 bg-teal-50/80 backdrop-blur-sm border border-teal-100/30 rounded-xl">
              <CardContent className="p-6 text-center">
                <div className="bg-teal-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <ShoppingCart className="h-8 w-8 text-teal-500" />
                </div>
                <h3 className="text-sm font-semibold text-teal-800 mb-2">No shopping lists yet</h3>
                <p className="text-xs text-teal-600 mb-4">Create your first shopping list with FreshCart</p>
                <Button 
                  onClick={() => navigate('/shopping-list')}
                  size="sm"
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                  variant="outline"
                >
                  Create Shopping List
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modern Logout Button */}
        <div className="pt-4">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl glass-card"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
