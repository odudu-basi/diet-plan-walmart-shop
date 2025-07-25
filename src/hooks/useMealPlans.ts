
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useMealPlans = (enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meal-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id as any)
        .eq('is_active', true as any)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!user && enabled
  });
};
