
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, ChevronDown, ChevronUp, Calendar, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  is_purchased: boolean;
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

  const groupedItems = shoppingList.shopping_list_items?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>) || {};

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg truncate">{shoppingList.name}</CardTitle>
                  <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
                    {progressPercentage}% complete
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <List className="h-4 w-4" />
                    <span>{totalItems} items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(shoppingList.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList();
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="p-2">
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {totalItems === 0 ? (
              <p className="text-gray-500 text-center py-4">No items in this list</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide border-b pb-1">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            item.is_purchased 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            checked={item.is_purchased}
                            onCheckedChange={(checked) => 
                              handleItemToggle(item.id, checked as boolean)
                            }
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span 
                              className={`block truncate ${
                                item.is_purchased 
                                  ? 'line-through text-gray-500' 
                                  : 'text-gray-900'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="text-sm text-gray-500">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ShoppingListCard;
