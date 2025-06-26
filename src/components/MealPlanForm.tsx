
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Utensils, Loader2, Clock, ShoppingCart } from "lucide-react";

export interface MealPlanFormData {
  planName: string;
  duration: string;
  targetCalories: string;
  additionalNotes: string;
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
    additionalNotes: ''
  });

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
        <form onSubmit={handleSubmit} className="space-y-6">
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
  );
};

export default MealPlanForm;
