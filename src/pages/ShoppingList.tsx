
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view shopping lists.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-800">Shopping Lists</h1>
            </div>
          </div>
          <CreateShoppingListDialog onListCreated={refetch} />
        </div>

        {/* Shopping Lists */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading shopping lists...</p>
          </div>
        ) : shoppingLists && shoppingLists.length > 0 ? (
          <div className="grid gap-6">
            {shoppingLists.map((list) => (
              <ShoppingListCard key={list.id} shoppingList={list} onUpdate={refetch} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Shopping Lists Yet</h3>
              <p className="text-gray-500 mb-4">Create your first shopping list from a meal plan or start from scratch.</p>
              <CreateShoppingListDialog onListCreated={refetch} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
