
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, User, Utensils, ShoppingCart, Target, Clock, Eye } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fetch user profile
  const { data: profile } = useQuery({
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

  // Fetch user's meal plans
  const { data: mealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ['meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meals (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the dashboard.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back!</h1>
            <p className="text-gray-600 mt-1">
              {profile?.first_name && profile?.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : 'Ready to plan your meals?'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile-setup')}
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="text-red-600 hover:text-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/meal-plan-generator')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <Plus className="h-5 w-5" />
                <span>Generate Meal Plan</span>
              </CardTitle>
              <CardDescription>Create a new AI-powered meal plan</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/shopping-list')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-700">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping Lists</span>
              </CardTitle>
              <CardDescription>Manage your shopping lists</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/profile-setup')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <Target className="h-5 w-5" />
                <span>Update Goals</span>
              </CardTitle>
              <CardDescription>Modify your health and diet goals</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Profile Summary */}
        {profile && (
          <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span>Your Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Goal</p>
                  <p className="capitalize">{profile.goal?.replace('-', ' ') || 'Not set'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Activity Level</p>
                  <p className="capitalize">{profile.activity_level || 'Not set'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Age</p>
                  <p>{profile.age ? `${profile.age} years` : 'Not set'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Weight</p>
                  <p>{profile.weight ? `${profile.weight} lbs` : 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Meal Plans */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              <span>Your Meal Plans</span>
            </CardTitle>
            <CardDescription>Your recent meal plans and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {mealPlansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading meal plans...</p>
              </div>
            ) : mealPlans && mealPlans.length > 0 ? (
              <div className="space-y-4">
                {mealPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Utensils className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Created {new Date(plan.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plan.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/meal-plan/${plan.id}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Meal Plans Yet</h3>
                <p className="text-gray-500 mb-4">Create your first AI-powered meal plan to get started!</p>
                <Button 
                  onClick={() => navigate('/meal-plan-generator')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Meal Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
