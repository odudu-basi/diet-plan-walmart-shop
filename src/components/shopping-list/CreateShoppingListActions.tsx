
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";

interface CreateShoppingListActionsProps {
  onCancel: () => void;
  onCreate: () => void;
  isCreating: boolean;
  isValid: boolean;
}

const CreateShoppingListActions = ({
  onCancel,
  onCreate,
  isCreating,
  isValid
}: CreateShoppingListActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={onCancel} disabled={isCreating}>
        Cancel
      </Button>
      <Button 
        onClick={onCreate} 
        disabled={!isValid || isCreating}
        className="bg-green-600 hover:bg-green-700"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create List
          </>
        )}
      </Button>
    </div>
  );
};

export default CreateShoppingListActions;
