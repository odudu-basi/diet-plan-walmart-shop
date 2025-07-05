
import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [packages, setPackages] = useState<PurchasePackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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

  useEffect(() => {
    if (user) {
      initializeRevenueCat();
    }
  }, [user]);

  const initializeRevenueCat = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would:
      // await Purchases.configure({ apiKey: 'your-public-api-key' });
      // await Purchases.logIn(user.id);
      
      // Mock initialization
      setPackages(mockPackages);
      await checkSubscriptionStatus();
      
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to load subscription information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (!user) return;

      // In a real implementation:
      // const customerInfo = await Purchases.getCustomerInfo();
      // setCustomerInfo(customerInfo);
      // setIsPremium(Object.keys(customerInfo.entitlements.active).length > 0);

      // Mock check - you could also check your database here
      setIsPremium(false); // Default to free for demo
      
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const purchasePackage = async (packageToPurchase: PurchasePackage) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error('User must be logged in to make purchases');
      }

      // In a real implementation:
      // const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      // setCustomerInfo(customerInfo);
      // setIsPremium(Object.keys(customerInfo.entitlements.active).length > 0);

      // Mock successful purchase
      setIsPremium(true);
      
      toast({
        title: "Purchase Successful!",
        description: "Welcome to Premium! Enjoy unlimited meal plans.",
      });

    } catch (error) {
      console.error('Error purchasing package:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation:
      // const customerInfo = await Purchases.restorePurchases();
      // setCustomerInfo(customerInfo);
      // setIsPremium(Object.keys(customerInfo.entitlements.active).length > 0);

      toast({
        title: "Purchases Restored",
        description: "Your previous purchases have been restored.",
      });

    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore purchases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RevenueCatContext.Provider value={{
      isLoading,
      isPremium,
      packages,
      customerInfo,
      purchasePackage,
      restorePurchases,
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
