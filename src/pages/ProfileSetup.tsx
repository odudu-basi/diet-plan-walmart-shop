import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Target, Heart, Scale, Apple } from "lucide-react";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    weight: '',
    height: '',
    goal: '',
    activityLevel: '',
    dietaryRestrictions: [] as string[],
    allergies: '',
    budgetRange: ''
  });

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Mediterranean'
  ];

  // Load existing profile data if available
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setFormData({
            fullName: data.full_name || '',
            age: data.age?.toString() || '',
            weight: data.weight?.toString() || '',
            height: data.height?.toString() || '',
            goal: data.goal || '',
            activityLevel: data.activity_level || '',
            dietaryRestrictions: data.dietary_restrictions || [],
            allergies: data.allergies || '',
            budgetRange: data.budget_range || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user]);

  const handleCheckboxChange = (restriction: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: checked 
        ? [...prev.dietaryRestrictions, restriction]
        : prev.dietaryRestrictions.filter(r => r !== restriction)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        id: user.id,
        full_name: formData.fullName,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        goal: formData.goal,
        activity_level: formData.activityLevel,
        dietary_restrictions: formData.dietaryRestrictions,
        allergies: formData.allergies,
        budget_range: formData.budgetRange,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile Saved!",
        description: "Your profile has been updated successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to set up your profile.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-4">
            <User className="h-8 w-8 text-green-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Set Up Your Profile</h1>
          </div>
          <p className="text-gray-600">Tell us about yourself to get personalized meal plans</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              This information helps us create personalized meal plans just for you
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              {/* Physical Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (inches)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Goals & Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Health Goal</Label>
                  <Select value={formData.goal} onValueChange={(value) => setFormData(prev => ({ ...prev, goal: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose-weight">Lose Weight</SelectItem>
                      <SelectItem value="gain-weight">Gain Weight</SelectItem>
                      <SelectItem value="maintain-weight">Maintain Weight</SelectItem>
                      <SelectItem value="build-muscle">Build Muscle</SelectItem>
                      <SelectItem value="improve-health">Improve Overall Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <Select value={formData.activityLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, activityLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Lightly Active (1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                      <SelectItem value="very">Very Active (6-7 days/week)</SelectItem>
                      <SelectItem value="extra">Extra Active (2x/day, intense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <Apple className="h-4 w-4" />
                  <span>Dietary Preferences (select all that apply)</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dietaryOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={formData.dietaryRestrictions.includes(option)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(option, checked as boolean)
                        }
                      />
                      <Label htmlFor={option} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Food Allergies or Intolerances</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any food allergies or intolerances..."
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Weekly Grocery Budget</Label>
                <Select value={formData.budgetRange} onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-50">Under $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="100-150">$100 - $150</SelectItem>
                    <SelectItem value="150-200">$150 - $200</SelectItem>
                    <SelectItem value="over-200">Over $200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <Heart className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save My Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
