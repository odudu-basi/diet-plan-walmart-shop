import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { CalendarDays, Utensils, Loader2, Clock, ShoppingCart, Globe, ChefHat, Shield, Info } from "lucide-react";

export interface MealPlanFormData {
  planName: string;
  duration: string;
  targetCalories: string;
  additionalNotes: string;
  culturalCuisines: string[];
  otherCuisine: string;
  maxCookingTime: string;
  dietaryRestrictions: string[];
  otherDietaryRestriction: string;
}

interface MealPlanFormProps {
  isGenerating: boolean;
  onSubmit: (formData: MealPlanFormData) => void;
}

const MealPlanForm = ({ isGenerating, onSubmit }: MealPlanFormProps) => {
  const [formData, setFormData] = useState<MealPlanFormData>({
    planName: '',
    duration: '7',
    targetCalories: '',
    additionalNotes: '',
    culturalCuisines: [],
    otherCuisine: '',
    maxCookingTime: '20-40',
    dietaryRestrictions: [],
    otherDietaryRestriction: ''
  });

  const cuisineOptions = [
    { id: 'american', label: 'American' },
    { id: 'italian', label: 'Italian' },
    { id: 'mexican', label: 'Mexican' },
    { id: 'japanese', label: 'Japanese' },
    { id: 'indian', label: 'Indian' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'thai', label: 'Thai' }
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'nut-free', label: 'Nut-Free' }
  ];

  const cookingTimeOptions = [
    { id: '10-20', label: '10-20 min', icon: '⚡' },
    { id: '20-40', label: '20-40 min', icon: '🔥' },
    { id: '40-60', label: '40-60 min', icon: '👨‍🍳' },
    { id: '60+', label: '60+ min', icon: '🥘' }
  ];

  const handleCuisineChange = (cuisineId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      culturalCuisines: checked 
        ? [...prev.culturalCuisines, cuisineId]
        : prev.culturalCuisines.filter(id => id !== cuisineId)
    }));
  };

  const handleDietaryRestrictionChange = (restrictionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: checked 
        ? [...prev.dietaryRestrictions, restrictionId]
        : prev.dietaryRestrictions.filter(id => id !== restrictionId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
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
        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Cultural Cuisines Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <Label className="text-base font-semibold">Cultural Cuisines</Label>
            </div>
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Select cuisines you'd like to include, or leave empty for a diverse international variety
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cuisineOptions.map((cuisine) => (
                <div key={cuisine.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-emerald-50 transition-colors">
                  <Checkbox
                    id={cuisine.id}
                    checked={formData.culturalCuisines.includes(cuisine.id)}
                    onCheckedChange={(checked) => handleCuisineChange(cuisine.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={cuisine.id} 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {cuisine.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="other-cuisine"
                checked={formData.culturalCuisines.includes('other')}
                onCheckedChange={(checked) => handleCuisineChange('other', checked as boolean)}
              />
              <Label htmlFor="other-cuisine" className="text-sm font-medium">Other:</Label>
              <Input
                placeholder="Specify cuisine..."
                value={formData.otherCuisine}
                onChange={(e) => setFormData(prev => ({ ...prev, otherCuisine: e.target.value }))}
                className="flex-1"
                disabled={!formData.culturalCuisines.includes('other')}
              />
            </div>
          </div>

          {/* Dietary Restrictions Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <Label className="text-base font-semibold">Dietary Restrictions</Label>
            </div>
            <p className="text-sm text-gray-600">Select any dietary restrictions you need to accommodate</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dietaryOptions.map((dietary) => (
                <div key={dietary.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-purple-50 transition-colors">
                  <Checkbox
                    id={dietary.id}
                    checked={formData.dietaryRestrictions.includes(dietary.id)}
                    onCheckedChange={(checked) => handleDietaryRestrictionChange(dietary.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={dietary.id} 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {dietary.label}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="other-dietary"
                checked={formData.dietaryRestrictions.includes('other')}
                onCheckedChange={(checked) => handleDietaryRestrictionChange('other', checked as boolean)}
              />
              <Label htmlFor="other-dietary" className="text-sm font-medium">Other:</Label>
              <Input
                placeholder="Specify dietary restriction..."
                value={formData.otherDietaryRestriction}
                onChange={(e) => setFormData(prev => ({ ...prev, otherDietaryRestriction: e.target.value }))}
                className="flex-1"
                disabled={!formData.dietaryRestrictions.includes('other')}
              />
            </div>
          </div>

          {/* Max Cooking Time Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-blue-600" />
              <Label className="text-base font-semibold">Max Cooking Time</Label>
            </div>
            <p className="text-sm text-gray-600">Choose your preferred maximum cooking time per meal</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cookingTimeOptions.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={formData.maxCookingTime === option.id ? "default" : "outline"}
                  className={`h-16 flex-col space-y-1 ${
                    formData.maxCookingTime === option.id 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "hover:bg-blue-50 hover:border-blue-300"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, maxCookingTime: option.id }))}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
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
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
            <Checkbox id="createShoppingList" checked={true} disabled />
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <Label htmlFor="createShoppingList" className="text-sm font-medium">
                Automatically create shopping list
              </Label>
            </div>
          </div>

          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Generation in progress...</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                This may take up to 2 minutes. Please be patient while our AI creates your personalized meal plan.
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 h-12"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Your Meal Plan...
              </>
            ) : (
              <>
                <Utensils className="h-5 w-5 mr-2" />
                Generate AI Meal Plan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MealPlanForm;
