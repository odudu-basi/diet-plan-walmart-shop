
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
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

interface ShoppingListItemProps {
  item: ShoppingListItemData;
  onToggle: (itemId: string, isPurchased: boolean) => void;
}

const ShoppingListItem = ({ item, onToggle }: ShoppingListItemProps) => {
  const displayQuantity = item.unit === 'package' ? item.quantity : `${item.quantity} ${item.unit}`;
  const walmartPackage = item.notes || '';
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        item.is_purchased 
          ? 'bg-green-50 border-green-200' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <Checkbox
        checked={item.is_purchased}
        onCheckedChange={(checked) => 
          onToggle(item.id, checked as boolean)
        }
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className={`font-medium truncate ${
              item.is_purchased 
                ? 'line-through text-gray-500' 
                : 'text-gray-900'
            }`}
          >
            {item.ingredient_name}
          </span>
          <Badge variant="secondary" className="text-xs">
            ${item.estimated_cost.toFixed(2)}
          </Badge>
        </div>
        <div className="text-sm text-gray-600">
          {walmartPackage || displayQuantity}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListItem;
