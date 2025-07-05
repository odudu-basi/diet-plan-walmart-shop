
import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import PremiumGate from '@/components/PremiumGate';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresPremium?: boolean;
  premiumDescription?: string;
}

const FeatureGate = ({ 
  feature, 
  children, 
  fallback = null, 
  requiresPremium = false,
  premiumDescription 
}: FeatureGateProps) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const { isPremium } = useRevenueCat();

  if (isLoading) {
    return <>{fallback}</>;
  }

  // Check if feature is enabled via feature flags
  const featureEnabled = isFeatureEnabled(feature);
  
  if (!featureEnabled) {
    return <>{fallback}</>;
  }

  // If feature requires premium and user doesn't have it, show premium gate
  if (requiresPremium && !isPremium) {
    return (
      <PremiumGate 
        feature={feature} 
        description={premiumDescription}
      >
        {children}
      </PremiumGate>
    );
  }

  return <>{children}</>;
};

export default FeatureGate;
