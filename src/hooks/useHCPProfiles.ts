import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HCPProfile {
  id: string;
  hcp_id: string;
  name: string;
  gender: string;
  province: string;
  city: string;
  institution: string;
  hospital_category: string;
  raw_department: string;
  standard_department: string;
  professional_title: string;
  admin_title: string;
  education: string;
  supervisor_title: string;
  resume: string;
  expertise: string;
  official_website: string;
  other_institutions: string;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export type HCPInsert = Omit<HCPProfile, "id" | "created_at" | "updated_at">;

const QUERY_KEY = ["hcp_profiles"];

async function fetchHCPProfiles(): Promise<HCPProfile[]> {
  const { data, error } = await supabase
    .from("hcp_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as HCPProfile[];
}

async function insertHCPProfiles(records: HCPInsert[]): Promise<HCPProfile[]> {
  // Use upsert to skip duplicates by hcp_id
  const { data, error } = await supabase
    .from("hcp_profiles")
    .upsert(records as any, { onConflict: "hcp_id", ignoreDuplicates: true })
    .select();
  if (error) throw error;
  return (data ?? []) as unknown as HCPProfile[];
}

async function deleteHCPProfiles(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("hcp_profiles")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

async function updateSubscription(hcpIds: string[], subscribed: boolean): Promise<void> {
  const { error } = await supabase
    .from("hcp_profiles")
    .update({ is_subscribed: subscribed } as any)
    .in("hcp_id", hcpIds);
  if (error) throw error;
}

export function useHCPProfiles() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHCPProfiles,
  });
}

export function useInsertHCPs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: insertHCPProfiles,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteHCPs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHCPProfiles,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useSubscribeHCPs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hcpIds: string[]) => updateSubscription(hcpIds, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUnsubscribeHCPs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hcpIds: string[]) => updateSubscription(hcpIds, false),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
