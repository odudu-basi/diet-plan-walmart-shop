
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
        <ProfileSummaryCard profile={profile} />

        {/* Meal Plan Form */}
        <MealPlanForm isGenerating={isGenerating} onSubmit={generateMealPlan} />
      </div>
    </div>
  );
};

export default MealPlanGenerator;
