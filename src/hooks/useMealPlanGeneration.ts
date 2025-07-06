
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { generateShoppingListFromMealPlan } from '@/utils/shoppingListGenerator';
import { useNavigate } from 'react-router-dom';
import { 
  UserProfile, 
  PlanDetails, 
  MealPlanFormData 
} from '@/types/mealPlan';
import { calculatePersonalizedCalories } from '@/utils/nutritionCalculator';
import { validateMealPlan } from '@/utils/mealPlanValidator';
import { 
  generateMealPlanFromAI, 
  saveMealPlanToDatabase, 
  saveMealsToDatabase 
} from '@/services/mealPlanService';

export const useMealPlanGeneration = (profile: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateMealPlan = async (formData: MealPlanFormData) => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Profile data is required to generate meal plans.",
        variant: "destructive",
      });
      return { success: false, error: "Profile data missing" };
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Analyzing your profile for personalized nutrition...');

    try {
      // Enhanced profile processing for better personalization
      const userProfile: UserProfile = {
        age: profile.age || 30,
        weight: profile.weight || 150,
        height: profile.height || 66,
        goal: profile.goal || 'maintain-weight',
        activityLevel: profile.activity_level || 'moderate',
        dietaryRestrictions: [
          ...(profile.dietary_restrictions || []),
          ...formData.dietaryRestrictions,
          ...(formData.dietaryRestrictions.includes('other') && formData.otherDietaryRestriction ? [formData.otherDietaryRestriction] : [])
        ],
        allergies: profile.allergies || 'None',
        budgetRange: profile.budget_range || '50-100'
      };

      // Calculate personalized target calories if not provided
      let targetCalories = formData.targetCalories ? parseInt(formData.targetCalories) : undefined;
      
      if (!targetCalories) {
        targetCalories = calculatePersonalizedCalories(userProfile);
      }

      console.log('Personalized calorie target:', targetCalories);
      console.log('User profile for meal generation:', userProfile);
      console.log('Cultural cuisines selected:', formData.culturalCuisines);
      console.log('Dietary restrictions:', userProfile.dietaryRestrictions);
      console.log('Max cooking time:', formData.maxCookingTime);

      const planDetails: PlanDetails = {
        duration: parseInt(formData.duration),
        targetCalories,
        createShoppingList: true,
        culturalCuisines: formData.culturalCuisines,
        otherCuisine: formData.otherCuisine,
        maxCookingTime: formData.maxCookingTime
      };

      // Determine meal creation step message based on cuisine selection
      const hasCuisineSelection = formData.culturalCuisines.length > 0;
      const cuisineStepMessage = hasCuisineSelection 
        ? `Creating diverse meals featuring ${formData.culturalCuisines.filter(c => c !== 'other').join(', ')}${formData.culturalCuisines.includes('other') && formData.otherCuisine ? `, ${formData.otherCuisine}` : ''} cuisines with dietary restrictions...`
        : 'Creating diverse international meals with dietary restrictions...';

      // Step 1: Generate meal plan via edge function
      setProgress(20);
      setCurrentStep(cuisineStepMessage);
      
      const mealPlan = await generateMealPlanFromAI(
        userProfile, 
        planDetails, 
        formData.planName, 
        formData.additionalNotes
      );

      console.log('Received meal plan with', mealPlan.meals.length, 'meals');

      // Validate meal diversity and cultural alignment
      const validationResults = validateMealPlan(mealPlan);

      // Step 2: Create meal plan record
      setProgress(40);
      setCurrentStep('Saving your personalized meal plan...');

      const savedMealPlan = await saveMealPlanToDatabase(
        mealPlan,
        userProfile,
        planDetails,
        formData.planName,
        targetCalories,
        profile.id
      );

      // Step 3: Save meals and ingredients
      setProgress(60);
      setCurrentStep('Saving meal details and ingredients...');

      await saveMealsToDatabase(mealPlan.meals, savedMealPlan.id);

      // Step 4: Create shopping list if requested
      if (planDetails.createShoppingList) {
        setProgress(80);
        setCurrentStep('Creating optimized shopping list...');

        try {
          const shoppingListId = await generateShoppingListFromMealPlan(
            savedMealPlan.id,
            profile.id,
            `${savedMealPlan.name} - Shopping List`
          );
          console.log('Created shopping list:', shoppingListId);
        } catch (shoppingListError) {
          console.error('Error creating shopping list:', shoppingListError);
          // Don't fail the entire process if shopping list creation fails
          toast({
            title: "Warning",
            description: "Meal plan created successfully, but shopping list creation failed. You can create it manually later.",
            variant: "destructive",
          });
        }
      }

      setProgress(100);
      const finalStepMessage = hasCuisineSelection 
        ? `Your ${formData.culturalCuisines.filter(c => c !== 'other').join(', ')}${formData.culturalCuisines.includes('other') && formData.otherCuisine ? `, ${formData.otherCuisine}` : ''} meal plan is ready!`
        : 'Your international variety meal plan is ready!';
      setCurrentStep(finalStepMessage);

      const successDescription = hasCuisineSelection
        ? `Your personalized ${planDetails.duration}-day meal plan featuring ${formData.culturalCuisines.filter(c => c !== 'other').join(', ')}${formData.culturalCuisines.includes('other') && formData.otherCuisine ? `, ${formData.otherCuisine}` : ''} cuisines with dietary restrictions has been generated!`
        : `Your personalized ${planDetails.duration}-day meal plan with international variety and dietary restrictions has been generated!`;

      toast({
        title: "Success!",
        description: successDescription,
      });

      // Navigate to the meal plan page immediately
      navigate(`/meal-plan/${savedMealPlan.id}`);

      const cuisineStats = hasCuisineSelection 
        ? formData.culturalCuisines.filter(c => c !== 'other').concat(formData.culturalCuisines.includes('other') && formData.otherCuisine ? [formData.otherCuisine] : [])
        : ['International Variety'];

      return {
        success: true,
        mealPlanId: savedMealPlan.id,
        message: hasCuisineSelection 
          ? `Meal plan generated with ${validationResults.uniqueMeals} unique meals featuring your selected cuisines and dietary restrictions!`
          : `Meal plan generated with ${validationResults.uniqueMeals} unique meals featuring international variety and dietary restrictions!`,
        stats: {
          totalMeals: validationResults.totalMeals,
          uniqueMeals: validationResults.uniqueMeals,
          targetCalories,
          goal: userProfile.goal,
          cuisines: cuisineStats,
          dietaryRestrictions: userProfile.dietaryRestrictions,
          maxCookingTime: formData.maxCookingTime
        }
      };

    } catch (error) {
      console.error('Meal plan generation error:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate personalized meal plan. Please try again.",
        variant: "destructive",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateMealPlan,
    isGenerating,
    progress,
    currentStep,
  };
};
