
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SubscriptionPlans from "@/components/SubscriptionPlans";

const Subscription = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen fresh-gradient">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-emerald-100/30 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        <SubscriptionPlans />
      </div>
    </div>
  );
};

export default Subscription;
