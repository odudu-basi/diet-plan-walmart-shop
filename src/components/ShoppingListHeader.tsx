
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
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate mb-1">{name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{totalItems} items</span>
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
              {progressPercentage}%
            </div>
          </div>
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
