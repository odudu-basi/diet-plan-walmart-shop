
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeatureFlags = (flagName: string) => {
  return useQuery({
    queryKey: ['feature-flags', flagName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('name', flagName)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching feature flag:', error);
        return false;
      }
      
      return data?.enabled ?? false;
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
      data?.forEach(flag => {
        if (flag.name && typeof flag.enabled === 'boolean') {
          flags[flag.name] = flag.enabled;
        }
      });
      
      return flags;
    },
  });
};
