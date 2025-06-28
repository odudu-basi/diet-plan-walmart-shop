
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ShoppingListHeader from './ShoppingListHeader';
import ShoppingListContent from './ShoppingListContent';

interface ShoppingListItem {
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

interface ShoppingList {
  id: string;
  name: string;
  created_at: string;
  shopping_list_items: ShoppingListItem[];
}

interface ShoppingListCardProps {
  shoppingList: ShoppingList;
  onUpdate: () => void;
}

const ShoppingListCard = ({ shoppingList, onUpdate }: ShoppingListCardProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const totalItems = shoppingList.shopping_list_items?.length || 0;
  const purchasedItems = shoppingList.shopping_list_items?.filter(item => item.is_purchased).length || 0;
  const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const handleItemToggle = async (itemId: string, isPurchased: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_purchased: isPurchased })
        .eq('id', itemId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Are you sure you want to delete this shopping list?')) return;

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', shoppingList.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shopping list deleted successfully.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to delete shopping list.",
        variant: "destructive",
      });
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Card className="overflow-hidden hover-lift glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm">
      <ShoppingListHeader
        name={shoppingList.name}
        totalItems={totalItems}
        purchasedItems={purchasedItems}
        progressPercentage={progressPercentage}
        createdAt={shoppingList.created_at}
        isOpen={isOpen}
        onToggle={toggleOpen}
        onDelete={handleDeleteList}
      />

      {isOpen && (
        <CardContent className="pt-0 pb-6 px-6">
          <div className="border-t border-gray-200/50 pt-4">
            <ShoppingListContent
              items={shoppingList.shopping_list_items || []}
              onItemToggle={handleItemToggle}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ShoppingListCard;
