
import { UserProfile } from './types.ts';

export function calculateBMR(age: number, weight: number, height: number, gender: string): number {
  // Harris-Benedict equation (simplified - using male formula)
  return 88.362 + (13.397 * weight * 0.453592) + (4.799 * height * 2.54) - (5.677 * age);
}

export function calculateDailyCalories(bmr: number, activityLevel: string, goal: string): number {
  let activityMultiplier = 1.2; // sedentary
  
  switch (activityLevel) {
    case 'light':
      activityMultiplier = 1.375;
      break;
    case 'moderate':
      activityMultiplier = 1.55;
      break;
    case 'very':
      activityMultiplier = 1.725;
      break;
    case 'extra':
      activityMultiplier = 1.9;
      break;
  }
  
  let calories = bmr * activityMultiplier;
  
  // Adjust based on goal
  switch (goal) {
    case 'lose-weight':
      calories -= 500; // 1lb per week deficit
      break;
    case 'gain-weight':
    case 'build-muscle':
      calories += 300; // Moderate surplus
      break;
    default:
      // maintain weight - no change
      break;
  }
  
  return Math.round(calories);
}
