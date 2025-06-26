
import React from 'react';
import ShoppingListItem from './ShoppingListItem';

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
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide border-b pb-1">
            {category}
          </h4>
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
      ))}
    </div>
  );
};

export default ShoppingListContent;
