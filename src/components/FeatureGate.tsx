
import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGate = ({ feature, children, fallback = null }: FeatureGateProps) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default FeatureGate;
