
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
}

const PremiumGate = ({ children, feature, description }: PremiumGateProps) => {
  const { isPremium } = useRevenueCat();
  const navigate = useNavigate();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <Card className="glass-card border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader className="text-center">
        <div className="mx-auto bg-gradient-to-r from-amber-400 to-orange-500 p-3 rounded-full w-fit mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-amber-800 flex items-center gap-2 justify-center">
          <Lock className="h-5 w-5" />
          Premium Feature
        </CardTitle>
        <p className="text-amber-700">
          {description || `Upgrade to Premium to access ${feature}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/80 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">Premium includes:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Unlimited meal plans</li>
            <li>• Advanced shopping lists</li>
            <li>• Export to PDF</li>
            <li>• Priority support</li>
          </ul>
        </div>
        <Button 
          onClick={() => navigate('/subscription')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
};

export default PremiumGate;
