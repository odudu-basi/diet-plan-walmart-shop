
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShoppingListContent from "@/components/ShoppingListContent";

const ShoppingListDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch shopping list details
  const { data: shoppingList, isLoading, refetch } = useQuery({
    queryKey: ['shopping-list-details', id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items (*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id
  });

  const handleItemToggle = async (itemId: string, isPurchased: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_purchased: isPurchased })
        .eq('id', itemId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item status.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 safe-area-inset">
        <Card className="w-full max-w-md glass-card border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Please log in</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view shopping lists.</p>
            <Button onClick={() => navigate('/')} className="w-full gradient-fresh hover:shadow-lg transition-all">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 safe-area-inset">
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/shopping-list')}
                className="rounded-full hover:bg-white/50 transition-colors w-8 h-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading shopping list...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 safe-area-inset">
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/shopping-list')}
                className="rounded-full hover:bg-white/50 transition-colors w-8 h-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Shopping List Not Found</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-4">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Shopping List Not Found</h3>
              <p className="text-gray-600 mb-6">The shopping list you're looking for doesn't exist or you don't have access to it.</p>
              <Button onClick={() => navigate('/shopping-list')} className="gradient-fresh">
                Back to Shopping Lists
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalItems = shoppingList.shopping_list_items?.length || 0;
  const purchasedItems = shoppingList.shopping_list_items?.filter(item => item.is_purchased).length || 0;
  const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;
  const totalCost = shoppingList.shopping_list_items?.reduce((sum, item) => sum + item.estimated_cost, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 safe-area-inset">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/shopping-list')}
              className="rounded-full hover:bg-white/50 transition-colors w-8 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {shoppingList.name}
              </h1>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                  {purchasedItems}/{totalItems} items
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  ${totalCost.toFixed(2)}
                </span>
                <span className="text-green-600 font-medium">
                  {progressPercentage}% complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="p-6">
            <ShoppingListContent
              items={shoppingList.shopping_list_items || []}
              onItemToggle={handleItemToggle}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShoppingListDetails;
