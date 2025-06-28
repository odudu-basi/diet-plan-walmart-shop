
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useFeatureFlags = () => {
  const { data: featureFlags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('enabled', true);
      
      if (error) {
        console.error('Error fetching feature flags:', error);
        return [];
      }
      
      return data as FeatureFlag[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const isFeatureEnabled = (featureName: string): boolean => {
    if (!featureFlags) return false;
    return featureFlags.some(flag => flag.name === featureName && flag.enabled);
  };

  return {
    featureFlags: featureFlags || [],
    isFeatureEnabled,
    isLoading,
  };
};
