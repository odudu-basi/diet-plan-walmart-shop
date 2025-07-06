
export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  allergies: string;
  budgetRange: string;
}

export interface PlanDetails {
  duration: number;
  targetCalories?: number;
  createShoppingList: boolean;
  culturalCuisines?: string[];
  otherCuisine?: string;
  maxCookingTime?: string;
}

export interface Meal {
  name: string;
  type: string;
  dayOfWeek: number;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    estimatedCost: number;
  }>;
}

export interface MealPlan {
  meals: Meal[];
}

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
