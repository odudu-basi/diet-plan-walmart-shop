
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAppConfig = (key: string) => {
  return useQuery({
    queryKey: ['app-config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', key as any)
        .single();
      
      if (error) {
        console.error('Error fetching app config:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }

      // Parse the value based on type
      if ((data as any).type === 'boolean') {
        return (data as any).value === 'true';
      } else if ((data as any).type === 'number') {
        return parseFloat((data as any).value);
      } else if ((data as any).type === 'json') {
        try {
          return JSON.parse((data as any).value);
        } catch {
          return (data as any).value;
        }
      } else {
        return (data as any).value;
      }
    },
  });
};
