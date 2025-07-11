
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeatureFlags = (flagName: string) => {
  return useQuery({
    queryKey: ['feature-flags', flagName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('name', flagName as any)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching feature flag:', error);
        return false;
      }
      
      return (data as any)?.enabled ?? false;
    },
  });
};

export const useAllFeatureFlags = () => {
  return useQuery({
    queryKey: ['all-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
      
      if (error) {
        console.error('Error fetching feature flags:', error);
        return {};
      }
      
      const flags: Record<string, boolean> = {};
      (data as any)?.forEach((flag: any) => {
        if (flag && flag.name && typeof flag.enabled === 'boolean') {
          flags[flag.name] = flag.enabled;
        }
      });
      
      return flags;
    },
  });
};

// Helper hook for easier feature flag checking
export const useFeatureFlagsHelper = () => {
  const { data: allFlags = {}, isLoading } = useAllFeatureFlags();
  
  const isFeatureEnabled = (flagName: string): boolean => {
    return allFlags[flagName] ?? false;
  };

  return {
    isFeatureEnabled,
    isLoading,
    allFlags
  };
};
