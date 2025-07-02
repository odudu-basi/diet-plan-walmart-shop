
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Package } from "lucide-react";

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
      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
        item.is_purchased 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm' 
          : 'bg-white/80 border-gray-200 hover:bg-gray-50/80 hover:shadow-md hover:border-gray-300'
      }`}
    >
      <Checkbox
        checked={item.is_purchased}
        onCheckedChange={(checked) => 
          onToggle(item.id, checked as boolean)
        }
        className="flex-shrink-0 w-5 h-5 rounded-md"
      />
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          item.is_purchased 
            ? 'bg-green-100 text-green-600' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
        } transition-colors`}>
          <Package className="h-4 w-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span 
            className={`font-medium truncate transition-all ${
              item.is_purchased 
                ? 'line-through text-gray-500' 
                : 'text-gray-900'
            }`}
          >
            {item.ingredient_name}
          </span>
        </div>
        <div className={`text-sm transition-colors ${
          item.is_purchased ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {walmartPackage || displayQuantity}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListItem;
