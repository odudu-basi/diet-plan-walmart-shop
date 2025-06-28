
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, ChevronUp, Calendar, ShoppingCart, CheckCircle2 } from "lucide-react";

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
  const isComplete = progressPercentage === 100;

  return (
    <CardHeader 
      className="cursor-pointer hover:bg-white/50 transition-all duration-200 pb-4 relative"
      onClick={onToggle}
    >
      {/* Progress Bar Background */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 rounded-b-lg">
        <div 
          className={`h-full rounded-b-lg transition-all duration-500 ${
            isComplete 
              ? 'bg-gradient-to-r from-green-400 to-green-600' 
              : 'bg-gradient-to-r from-blue-400 to-blue-600'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <CardTitle className="text-lg font-semibold text-gray-800 truncate">
              {name}
            </CardTitle>
            {isComplete && (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>{purchasedItems}/{totalItems} items</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge 
            variant={isComplete ? "default" : "secondary"} 
            className={`text-xs font-medium ${
              isComplete 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            {progressPercentage}%
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="p-1 text-gray-400 pointer-events-none">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 transition-transform" />
            ) : (
              <ChevronDown className="h-5 w-5 transition-transform" />
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  );
};

export default ShoppingListHeader;
