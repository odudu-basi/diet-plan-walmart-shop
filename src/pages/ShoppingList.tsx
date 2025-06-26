
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Plus } from "lucide-react";
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view shopping lists.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="mr-2 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Shopping Lists</h1>
              <p className="text-sm text-gray-500">{shoppingLists?.length || 0} lists</p>
            </div>
          </div>
          <CreateShoppingListDialog onListCreated={refetch} />
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Shopping Lists */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading shopping lists...</p>
            </div>
          </div>
        ) : shoppingLists && shoppingLists.length > 0 ? (
          <div className="space-y-4">
            {shoppingLists.map((list) => (
              <ShoppingListCard key={list.id} shoppingList={list} onUpdate={refetch} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-white rounded-full p-6 mb-6 shadow-lg">
              <ShoppingCart className="h-16 w-16 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2 text-center">No Shopping Lists Yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-sm">
              Create your first shopping list from a meal plan or start from scratch.
            </p>
            <CreateShoppingListDialog onListCreated={refetch} />
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <CreateShoppingListDialog onListCreated={refetch} />
      </div>
    </div>
  );
};

export default ShoppingList;
