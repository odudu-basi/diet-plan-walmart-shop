
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
  planName: string;
  targetCalories?: number;
  additionalNotes?: string;
  culturalCuisines?: string[];
  otherCuisine?: string;
  maxCookingTime?: string;
}

export interface MealIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedCost: number;
}

export interface Meal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  dayOfWeek: number;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  ingredients: MealIngredient[];
}

export interface MealPlan {
  meals: Meal[];
}
