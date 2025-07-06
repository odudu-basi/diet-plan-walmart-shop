
import { UserProfile } from '@/types/mealPlan';

export const calculatePersonalizedCalories = (userProfile: UserProfile): number => {
  // Enhanced calorie calculation based on profile
  const heightInCm = userProfile.height * 2.54;
  const weightInKg = userProfile.weight * 0.453592;
  
  // Mifflin-St Jeor Equation (assuming average gender for demo)
  let bmr = (10 * weightInKg) + (6.25 * heightInCm) - (5 * userProfile.age) + 5;
  
  // Activity multipliers
  const activityMultipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'very': 1.725,
    'extra': 1.9
  };
  
  const tdee = bmr * (activityMultipliers[userProfile.activityLevel] || 1.55);
  
  // Goal adjustments
  switch (userProfile.goal) {
    case 'lose-weight':
      return Math.round(tdee * 0.8); // 20% deficit
    case 'gain-weight':
      return Math.round(tdee * 1.2); // 20% surplus
    case 'build-muscle':
      return Math.round(tdee * 1.15); // 15% surplus
    default:
      return Math.round(tdee);
  }
};
