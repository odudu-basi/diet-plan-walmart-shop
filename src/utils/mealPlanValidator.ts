
import { MealPlan } from '@/types/mealPlan';

export const validateMealPlan = (mealPlan: MealPlan) => {
  const mealNames = mealPlan.meals.map(m => m.name.toLowerCase());
  const uniqueMeals = new Set(mealNames);
  const breakfastMeals = mealPlan.meals.filter(m => m.type === 'breakfast');
  const longBreakfasts = breakfastMeals.filter(m => (m.prepTime + m.cookTime) > 20);
  
  console.log(`Meal diversity check: ${uniqueMeals.size} unique meals out of ${mealNames.length} total meals`);
  console.log(`Breakfast compliance: ${breakfastMeals.length - longBreakfasts.length}/${breakfastMeals.length} breakfasts are 20 minutes or less`);

  return {
    totalMeals: mealPlan.meals.length,
    uniqueMeals: uniqueMeals.size,
    breakfastCompliance: breakfastMeals.length - longBreakfasts.length
  };
};
