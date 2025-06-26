
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import ShoppingListProgress from './ShoppingListProgress';

interface ShoppingListHeaderProps {
  name: string;
  totalItems: number;
  purchasedItems: number;
  progressPercentage: number;
  createdAt: string;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const ShoppingListHeader = ({ 
  name, 
  totalItems, 
  purchasedItems, 
  progressPercentage, 
  createdAt, 
  isOpen, 
  onToggle,
  onDelete 
}: ShoppingListHeaderProps) => {
  return (
    <CardHeader 
      className="cursor-pointer hover:bg-gray-50 transition-colors pb-4"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="text-lg truncate">{name}</CardTitle>
            <ShoppingListProgress
              totalItems={totalItems}
              purchasedItems={purchasedItems}
              progressPercentage={progressPercentage}
              createdAt={createdAt}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="p-2 pointer-events-none">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default ShoppingListHeader;
