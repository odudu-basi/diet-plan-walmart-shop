
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Calendar, List } from "lucide-react";

interface ShoppingListProgressProps {
  totalItems: number;
  purchasedItems: number;
  progressPercentage: number;
  createdAt: string;
}

const ShoppingListProgress = ({ 
  totalItems, 
  purchasedItems, 
  progressPercentage, 
  createdAt 
}: ShoppingListProgressProps) => {
  return (
    <>
      <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
        {progressPercentage}% complete
      </Badge>
      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
        <div className="flex items-center gap-1">
          <List className="h-4 w-4" />
          <span>{totalItems} items</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </>
  );
};

export default ShoppingListProgress;
