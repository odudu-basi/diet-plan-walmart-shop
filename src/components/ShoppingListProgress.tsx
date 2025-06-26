
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

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
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        <span>{new Date(createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
          {progressPercentage}% complete
        </Badge>
        <span className="text-sm text-gray-500">{totalItems} items</span>
      </div>
    </>
  );
};

export default ShoppingListProgress;
