
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppConfig = Database['public']['Tables']['app_config']['Row'];

export const useAppConfig = () => {
  const { data: config, isLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*');
      
      if (error) {
        console.error('Error fetching app config:', error);
        return [];
      }
      
      return (data || []) as AppConfig[];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  const getConfigValue = (key: string, defaultValue: any = null) => {
    if (!config) return defaultValue;
    
    const configItem = config.find(item => item.key === key);
    if (!configItem) return defaultValue;
    
    // Parse value based on type
    switch (configItem.type) {
      case 'boolean':
        return configItem.value === 'true';
      case 'number':
        return parseFloat(configItem.value);
      case 'json':
        try {
          return JSON.parse(configItem.value);
        } catch {
          return defaultValue;
        }
      default:
        return configItem.value;
    }
  };

  return {
    config: config || [],
    getConfigValue,
    isLoading,
  };
};
