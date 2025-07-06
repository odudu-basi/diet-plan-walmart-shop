
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ShoppingListHeader from './ShoppingListHeader';

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
  const navigate = useNavigate();

  const totalItems = shoppingList.shopping_list_items?.length || 0;
  const purchasedItems = shoppingList.shopping_list_items?.filter(item => item.is_purchased).length || 0;
  const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const handleDeleteList = async () => {
    if (!confirm('Are you sure you want to delete this shopping list?')) return;

    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id' as any, shoppingList.id);

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

  const handleCardClick = () => {
    navigate(`/shopping-list/${shoppingList.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover-lift glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm cursor-pointer"
      onClick={handleCardClick}
    >
      <ShoppingListHeader
        name={shoppingList.name}
        totalItems={totalItems}
        purchasedItems={purchasedItems}
        progressPercentage={progressPercentage}
        createdAt={shoppingList.created_at}
        onDelete={handleDeleteList}
      />
    </Card>
  );
};

export default ShoppingListCard;
