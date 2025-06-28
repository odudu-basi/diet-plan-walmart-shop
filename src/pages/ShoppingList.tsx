
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Plus, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShoppingListCard from "@/components/ShoppingListCard";
import CreateShoppingListDialog from "@/components/CreateShoppingListDialog";

const ShoppingList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's shopping lists
  const { data: shoppingLists, isLoading, refetch } = useQuery({
    queryKey: ['shopping-lists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          shopping_list_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Calculate total stats
  const totalItems = shoppingLists?.reduce((sum, list) => sum + (list.shopping_list_items?.length || 0), 0) || 0;
  const totalCost = shoppingLists?.reduce((sum, list) => 
    sum + (list.shopping_list_items?.reduce((itemSum, item) => itemSum + item.estimated_cost, 0) || 0), 0) || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="rounded-full hover:bg-white/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Shopping Lists
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {shoppingLists?.length || 0} lists
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    {totalItems} items
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <CreateShoppingListDialog onListCreated={refetch} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-6 mt-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your shopping lists...</p>
            </div>
          </div>
        ) : shoppingLists && shoppingLists.length > 0 ? (
          <div className="space-y-6 mt-8">
            {shoppingLists.map((list, index) => (
              <div 
                key={list.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ShoppingListCard shoppingList={list} onUpdate={refetch} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <ShoppingCart className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Plus className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">No Shopping Lists Yet</h3>
            <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
              Create your first shopping list from a meal plan or start from scratch. 
              Keep track of what you need and never forget an item again!
            </p>
            <CreateShoppingListDialog onListCreated={refetch} />
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <CreateShoppingListDialog onListCreated={refetch} />
      </div>
    </div>
  );
};

export default ShoppingList;
