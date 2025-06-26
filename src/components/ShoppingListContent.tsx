
import React from 'react';
import ShoppingListItem from './ShoppingListItem';
import { Badge } from "@/components/ui/badge";

interface ShoppingListItemData {
  id: string;
  ingredient_name: string;
  category: string;
  quantity: number;
  unit: string;
  is_purchased: boolean;
  estimated_cost: number;
  notes: string;
  shopping_list_id: string;
}

interface ShoppingListContentProps {
  items: ShoppingListItemData[];
  onItemToggle: (itemId: string, isPurchased: boolean) => void;
}

const ShoppingListContent = ({ items, onItemToggle }: ShoppingListContentProps) => {
  const totalItems = items?.length || 0;
  const totalCost = items?.reduce((sum, item) => sum + item.estimated_cost, 0) || 0;

  if (totalItems === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No items in this list</p>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItemData[]>);

  return (
    <div className="space-y-4">
      {/* Total cost summary */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            Estimated Walmart Total:
          </span>
          <Badge className="bg-blue-600 text-white">
            ${totalCost.toFixed(2)}
          </Badge>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Prices may vary by location and availability
        </p>
      </div>

      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const categoryTotal = categoryItems.reduce((sum, item) => sum + item.estimated_cost, 0);
        
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                {category}
              </h4>
              <Badge variant="outline" className="text-xs">
                ${categoryTotal.toFixed(2)}
              </Badge>
            </div>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <ShoppingListItem 
                  key={item.id} 
                  item={item} 
                  onToggle={onItemToggle}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShoppingListContent;
