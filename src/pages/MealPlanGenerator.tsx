
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Utensils, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import MealPlanForm from "@/components/MealPlanForm";
import { useMealPlanGeneration } from "@/hooks/useMealPlanGeneration";

const MealPlanGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { isGenerating, generateMealPlan } = useMealPlanGeneration(profile);

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
        {/* Improved Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/50 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Back to Dashboard</span>
            </Button>
          </div>
          
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start mb-3">
              <div className="p-3 bg-green-100 rounded-xl mr-3">
                <Utensils className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
                  AI Meal Plan Generator
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Create personalized meal plans with AI
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <ProfileSummaryCard profile={profile} />

        {/* Meal Plan Form */}
        <MealPlanForm isGenerating={isGenerating} onSubmit={generateMealPlan} />
      </div>
    </div>
  );
};

export default MealPlanGenerator;
