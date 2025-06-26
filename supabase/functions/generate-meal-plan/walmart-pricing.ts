
// Walmart-specific ingredient pricing and package information
export interface WalmartIngredient {
  name: string;
  category: string;
  standardPackage: string;
  packageSize: string;
  estimatedPrice: number;
  unit: string;
}

export const walmartIngredients: WalmartIngredient[] = [
  // Proteins
  { name: "chicken breast", category: "Meat", standardPackage: "1 lb package", packageSize: "1 lb", estimatedPrice: 4.99, unit: "lb" },
  { name: "ground beef", category: "Meat", standardPackage: "1 lb package", packageSize: "1 lb", estimatedPrice: 5.49, unit: "lb" },
  { name: "salmon fillet", category: "Meat", standardPackage: "1 lb package", packageSize: "1 lb", estimatedPrice: 8.99, unit: "lb" },
  { name: "eggs", category: "Dairy", standardPackage: "1 dozen", packageSize: "12 count", estimatedPrice: 2.49, unit: "dozen" },
  { name: "Greek yogurt", category: "Dairy", standardPackage: "32 oz container", packageSize: "32 oz", estimatedPrice: 4.99, unit: "container" },
  
  // Vegetables
  { name: "broccoli", category: "Produce", standardPackage: "2 lb bag", packageSize: "2 lb", estimatedPrice: 2.99, unit: "bag" },
  { name: "spinach", category: "Produce", standardPackage: "5 oz bag", packageSize: "5 oz", estimatedPrice: 2.49, unit: "bag" },
  { name: "bell peppers", category: "Produce", standardPackage: "3 count bag", packageSize: "3 count", estimatedPrice: 3.49, unit: "bag" },
  { name: "onions", category: "Produce", standardPackage: "3 lb bag", packageSize: "3 lb", estimatedPrice: 2.99, unit: "bag" },
  { name: "carrots", category: "Produce", standardPackage: "2 lb bag", packageSize: "2 lb", estimatedPrice: 1.99, unit: "bag" },
  
  // Grains & Starches
  { name: "brown rice", category: "Pantry", standardPackage: "2 lb bag", packageSize: "2 lb", estimatedPrice: 2.99, unit: "bag" },
  { name: "quinoa", category: "Pantry", standardPackage: "1 lb bag", packageSize: "1 lb", estimatedPrice: 4.99, unit: "bag" },
  { name: "whole wheat bread", category: "Bakery", standardPackage: "1 loaf", packageSize: "20 oz", estimatedPrice: 2.49, unit: "loaf" },
  { name: "sweet potatoes", category: "Produce", standardPackage: "3 lb bag", packageSize: "3 lb", estimatedPrice: 3.49, unit: "bag" },
  
  // Dairy
  { name: "milk", category: "Dairy", standardPackage: "1 gallon", packageSize: "1 gallon", estimatedPrice: 3.99, unit: "gallon" },
  { name: "cheese", category: "Dairy", standardPackage: "8 oz block", packageSize: "8 oz", estimatedPrice: 3.99, unit: "block" },
  
  // Pantry staples
  { name: "olive oil", category: "Pantry", standardPackage: "500ml bottle", packageSize: "500ml", estimatedPrice: 4.99, unit: "bottle" },
  { name: "garlic", category: "Produce", standardPackage: "3 count pack", packageSize: "3 bulbs", estimatedPrice: 1.99, unit: "pack" },
  { name: "tomatoes", category: "Produce", standardPackage: "2 lb container", packageSize: "2 lb", estimatedPrice: 3.99, unit: "container" },
  { name: "black beans", category: "Pantry", standardPackage: "15 oz can", packageSize: "15 oz", estimatedPrice: 1.29, unit: "can" },
];

export const getWalmartIngredient = (ingredientName: string): WalmartIngredient | null => {
  const normalized = ingredientName.toLowerCase().trim();
  return walmartIngredients.find(item => 
    item.name.toLowerCase().includes(normalized) || 
    normalized.includes(item.name.toLowerCase())
  ) || null;
};

export const convertToWalmartPackaging = (ingredientName: string, recipeQuantity: number, recipeUnit: string) => {
  const walmartItem = getWalmartIngredient(ingredientName);
  
  if (!walmartItem) {
    return {
      packageDescription: `${recipeQuantity} ${recipeUnit}`,
      estimatedCost: 2.99,
      quantity: 1
    };
  }
  
  // Convert recipe quantity to packages needed
  let packagesNeeded = 1;
  
  // Simple conversion logic - can be enhanced later
  if (recipeUnit === 'lb' && walmartItem.unit === 'lb') {
    packagesNeeded = Math.ceil(recipeQuantity / parseFloat(walmartItem.packageSize));
  } else if (recipeUnit === 'oz' && walmartItem.packageSize.includes('oz')) {
    const packageOz = parseFloat(walmartItem.packageSize);
    packagesNeeded = Math.ceil(recipeQuantity / packageOz);
  } else if (recipeUnit === 'cup' || recipeUnit === 'cups') {
    packagesNeeded = 1; // Default to 1 package for volume measurements
  }
  
  return {
    packageDescription: `${packagesNeeded} × ${walmartItem.standardPackage}`,
    estimatedCost: walmartItem.estimatedPrice * packagesNeeded,
    quantity: packagesNeeded,
    walmartItem
  };
};
