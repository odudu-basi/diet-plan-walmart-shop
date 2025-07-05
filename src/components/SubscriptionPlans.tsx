
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { Check, Crown, Zap } from 'lucide-react';

const SubscriptionPlans = () => {
  const { packages, purchasePackage, restorePurchases, isLoading, isPremium } = useRevenueCat();

  if (isPremium) {
    return (
      <Card className="glass-card border-emerald-200">
        <CardHeader className="text-center">
          <div className="mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full w-fit mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-emerald-800">Premium Active</CardTitle>
          <p className="text-emerald-600">You have access to all premium features!</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4" />
              <span className="text-sm">Unlimited meal plans</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4" />
              <span className="text-sm">Advanced shopping lists</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4" />
              <span className="text-sm">Priority customer support</span>
            </div>
          </div>
          <Button 
            onClick={restorePurchases}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            Restore Purchases
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-emerald-800">Choose Your Plan</h2>
        <p className="text-emerald-600">Unlock unlimited meal planning and shopping features</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {packages.map((pkg) => (
          <Card 
            key={pkg.identifier}
            className={`glass-card border-2 transition-all duration-200 hover:shadow-lg ${
              pkg.packageType === 'ANNUAL' 
                ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50' 
                : 'border-emerald-200'
            }`}
          >
            <CardHeader className="text-center">
              {pkg.packageType === 'ANNUAL' && (
                <Badge className="mx-auto mb-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                  Most Popular
                </Badge>
              )}
              <div className="mx-auto bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-full w-fit mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl text-emerald-800">
                {pkg.product.title}
              </CardTitle>
              <div className="text-3xl font-bold text-emerald-800">
                {pkg.product.priceString}
                <span className="text-sm font-normal text-emerald-600">
                  /{pkg.packageType === 'ANNUAL' ? 'year' : 'month'}
                </span>
              </div>
              {pkg.packageType === 'ANNUAL' && (
                <p className="text-sm text-emerald-600">Save 33% compared to monthly!</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-emerald-700 text-center">
                {pkg.product.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Unlimited meal plans</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Advanced shopping lists</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Priority customer support</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">Export meal plans to PDF</span>
                </div>
              </div>

              <Button 
                onClick={() => purchasePackage(pkg)}
                className={`w-full ${
                  pkg.packageType === 'ANNUAL'
                    ? 'gradient-fresh hover:from-emerald-600 hover:to-green-700'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Get Premium'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          onClick={restorePurchases}
          variant="ghost"
          className="text-emerald-600 hover:text-emerald-700"
          disabled={isLoading}
        >
          Already purchased? Restore purchases
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
