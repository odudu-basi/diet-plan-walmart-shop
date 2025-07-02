
import React from 'react';
import ShoppingListItem from './ShoppingListItem';
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package2 } from "lucide-react";

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
      <div className="text-center py-8">
        <Package2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No items in this list</p>
      </div>
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
    <div className="space-y-6">
      {/* Enhanced Total Cost Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-blue-900">
              Estimated Walmart Total
            </span>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
            ${totalCost.toFixed(2)}
          </Badge>
        </div>
        <p className="text-xs text-blue-700 ml-10">
          Prices may vary by location and availability
        </p>
      </div>

      {/* Grouped Items by Category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => {
        const categoryPurchased = categoryItems.filter(item => item.is_purchased).length;
        const categoryProgress = Math.round((categoryPurchased / categoryItems.length) * 100);
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50/80 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                  {category}
                </h4>
                <Badge variant="outline" className="text-xs bg-white">
                  {categoryPurchased}/{categoryItems.length}
                </Badge>
              </div>
              <Badge 
                variant={categoryProgress === 100 ? "default" : "secondary"} 
                className="text-xs"
              >
                {categoryProgress}%
              </Badge>
            </div>
            
            <div className="space-y-2 ml-2">
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
