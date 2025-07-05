
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Note: In a real implementation, you'd import from @revenuecat/purchases-capacitor
// For now, we'll create a mock interface that matches RevenueCat's API

interface PurchasePackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: string;
    priceString: string;
  };
}

interface CustomerInfo {
  entitlements: {
    active: { [key: string]: any };
  };
  activeSubscriptions: { [key: string]: any };
}

interface RevenueCatContextType {
  isLoading: boolean;
  isPremium: boolean;
  packages: PurchasePackage[];
  customerInfo: CustomerInfo | null;
  purchasePackage: (packageToPurchase: PurchasePackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export const RevenueCatProvider = ({ children }: { children: React.ReactNode }) => {
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock packages - in real implementation, these would come from RevenueCat
  const mockPackages: PurchasePackage[] = [
    {
      identifier: 'monthly_premium',
      packageType: 'MONTHLY',
      product: {
        identifier: 'premium_monthly',
        title: 'Premium Monthly',
        description: 'Unlimited meal plans and shopping lists',
        price: '9.99',
        priceString: '$9.99'
      }
    },
    {
      identifier: 'yearly_premium',
      packageType: 'ANNUAL',
      product: {
        identifier: 'premium_yearly',
        title: 'Premium Yearly',
        description: 'Unlimited meal plans and shopping lists - Save 20%!',
        price: '79.99',
        priceString: '$79.99'
      }
    }
  ];

  // Query to check subscription status from Supabase
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', user.id)
        .single();

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      return { profile, subscription };
    },
    enabled: !!user?.id,
  });

  // Check if user is premium based on database data
  const isPremium = (() => {
    if (!subscriptionData?.profile) return false;
    
    const { is_premium, premium_expires_at } = subscriptionData.profile;
    
    if (!is_premium) return false;
    
    // If there's an expiration date, check if it's still valid
    if (premium_expires_at) {
      return new Date(premium_expires_at) > new Date();
    }
    
    return true;
  })();

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasePackage) => {
      if (!user) {
        throw new Error('User must be logged in to make purchases');
      }

      // In a real implementation, you would:
      // const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      // For demo purposes, we'll simulate a successful purchase by updating the database

      const expiresAt = packageToPurchase.packageType === 'ANNUAL' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now

      // Insert/update subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          product_id: packageToPurchase.product.identifier,
          period_type: packageToPurchase.packageType.toLowerCase(),
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          environment: 'sandbox', // In production, this would come from RevenueCat
          entitlements: ['premium'],
          status: 'active'
        });

      if (subscriptionError) throw subscriptionError;

      // Update profile premium status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      toast({
        title: "Purchase Successful!",
        description: "Welcome to Premium! Enjoy unlimited meal plans.",
      });
    },
    onError: (error) => {
      console.error('Error purchasing package:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User must be logged in');

      // In a real implementation, you would:
      // const customerInfo = await Purchases.restorePurchases();
      // For now, we'll just check the current subscription status from our database
      
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subscription) {
        throw new Error('No active subscriptions found');
      }

      // Update profile if subscription exists but profile isn't marked premium
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: subscription.expires_at
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      toast({
        title: "Purchases Restored",
        description: "Your previous purchases have been restored.",
      });
    },
    onError: (error) => {
      console.error('Error restoring purchases:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore purchases. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (user) {
      setPackages(mockPackages);
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    // This will be handled by the React Query
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };

  return (
    <RevenueCatContext.Provider value={{
      isLoading: isLoading || purchaseMutation.isPending || restoreMutation.isPending,
      isPremium,
      packages,
      customerInfo,
      purchasePackage: purchaseMutation.mutateAsync,
      restorePurchases: restoreMutation.mutateAsync,
      checkSubscriptionStatus
    }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};
