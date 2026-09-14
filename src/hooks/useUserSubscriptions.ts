import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSubscription {
  id: string;
  user_id: string;
  hcp_id: string;
  created_at: string;
}

const QUERY_KEY = ["user_hcp_subscriptions"];

export function useUserSubscriptions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_hcp_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserSubscription[];
    },
    enabled: !!user,
  });
}

export function useSubscribedHCPIds() {
  const { data: subs = [] } = useUserSubscriptions();
  return new Set(subs.map((s) => s.hcp_id));
}

export function useAddSubscriptions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (hcpIds: string[]) => {
      if (!user) throw new Error("未登录");
      const rows = hcpIds.map((hcp_id) => ({ user_id: user.id, hcp_id }));
      const { data, error } = await supabase
        .from("user_hcp_subscriptions")
        .upsert(rows as any, { onConflict: "user_id,hcp_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveSubscriptions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (hcpIds: string[]) => {
      if (!user) throw new Error("未登录");
      const { error } = await supabase
        .from("user_hcp_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .in("hcp_id", hcpIds);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
