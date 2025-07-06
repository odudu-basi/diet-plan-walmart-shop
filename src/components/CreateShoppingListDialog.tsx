
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";
import { useMealPlans } from "@/hooks/useMealPlans";
import { useShoppingListCreation } from "@/hooks/useShoppingListCreation";
import ShoppingListForm from "./shopping-list/ShoppingListForm";
import CreateShoppingListActions from "./shopping-list/CreateShoppingListActions";

interface CreateShoppingListDialogProps {
  onListCreated: () => void;
}

const CreateShoppingListDialog = ({ onListCreated }: CreateShoppingListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [selectedMealPlan, setSelectedMealPlan] = useState('');

  const { data: mealPlans } = useMealPlans(open);
  const { isCreating, handleCreateShoppingList } = useShoppingListCreation(onListCreated);

  const handleCreate = async () => {
    await handleCreateShoppingList(listName, selectedMealPlan);
    setOpen(false);
    setListName('');
    setSelectedMealPlan('');
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Shopping List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <span>Create Shopping List</span>
          </DialogTitle>
          <DialogDescription>
            Create a new shopping list from scratch or generate one from an existing meal plan.
          </DialogDescription>
        </DialogHeader>

        <ShoppingListForm
          listName={listName}
          setListName={setListName}
          selectedMealPlan={selectedMealPlan}
          setSelectedMealPlan={setSelectedMealPlan}
          mealPlans={mealPlans}
        />

        <CreateShoppingListActions
          onCancel={handleCancel}
          onCreate={handleCreate}
          isCreating={isCreating}
          isValid={listName.trim().length > 0}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateShoppingListDialog;
