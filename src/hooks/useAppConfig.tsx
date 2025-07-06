
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAppConfig = (key: string) => {
  return useQuery({
    queryKey: ['app-config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) {
        console.error('Error fetching app config:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }

      // Parse the value based on type
      if (data.type === 'boolean') {
        return data.value === 'true';
      } else if (data.type === 'number') {
        return parseFloat(data.value);
      } else if (data.type === 'json') {
        try {
          return JSON.parse(data.value);
        } catch {
          return data.value;
        }
      } else {
        return data.value;
      }
    },
  });
};
