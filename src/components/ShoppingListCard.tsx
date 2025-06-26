
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShoppingListCardProps {
  shoppingList: any;
  onUpdate: () => void;
}

const ShoppingListCard = ({ shoppingList, onUpdate }: ShoppingListCardProps) => {
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleItemToggle = async (itemId: string, currentStatus: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_purchased: !currentStatus })
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
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const groupedItems = shoppingList.shopping_list_items?.reduce((acc: any, item: any) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {}) || {};

  const totalItems = shoppingList.shopping_list_items?.length || 0;
  const completedItems = shoppingList.shopping_list_items?.filter((item: any) => item.is_purchased).length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span>{shoppingList.name}</span>
          </CardTitle>
          <Badge variant={shoppingList.status === 'completed' ? 'default' : 'secondary'}>
            {shoppingList.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(shoppingList.created_at).toLocaleDateString()}</span>
          </div>
          {shoppingList.total_estimated_cost && (
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>${shoppingList.total_estimated_cost.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span>{completedItems}/{totalItems} items</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-700 mb-2 border-b pb-1">{category}</h4>
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-lg transition-all duration-300",
                      item.is_purchased ? "bg-green-50 opacity-75" : "bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={item.is_purchased}
                      onCheckedChange={() => handleItemToggle(item.id, item.is_purchased)}
                      disabled={updatingItems.has(item.id)}
                      className={cn(
                        "transition-colors",
                        item.is_purchased && "data-[state=checked]:bg-green-600"
                      )}
                    />
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium transition-all duration-300",
                        item.is_purchased && "line-through text-green-700"
                      )}>
                        {item.ingredient_name}
                      </div>
                      <div className={cn(
                        "text-sm text-gray-600 transition-all duration-300",
                        item.is_purchased && "text-green-600"
                      )}>
                        {item.quantity} {item.unit}
                        {item.estimated_cost && ` • $${item.estimated_cost.toFixed(2)}`}
                      </div>
                      {item.notes && (
                        <div className={cn(
                          "text-xs text-gray-500 mt-1 transition-all duration-300",
                          item.is_purchased && "text-green-500"
                        )}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShoppingListCard;
