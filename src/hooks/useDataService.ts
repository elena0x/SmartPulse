import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Signals ──────────────────────────────────────────────────
export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        hcpId: s.hcp_id,
        hcpName: s.hcp_name,
        hospital: s.hospital,
        signalType: s.signal_type,
        summary: s.summary,
        priority: s.priority as "high" | "medium" | "low",
        time: getRelativeTime(s.created_at),
        createdAt: s.created_at,
        tags: s.tags ?? [],
        publications: s.publications_count ?? 0,
        trials: s.trials_count ?? 0,
        affinity: s.affinity ?? 0,
      }));
    },
  });
}

// ─── NBA Actions ──────────────────────────────────────────────
export function useNBAActions() {
  return useQuery({
    queryKey: ["nba_actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nba_actions")
        .select("*")
        .order("score", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        id: a.id,
        hcpId: a.hcp_id,
        hcpName: a.hcp_name,
        action: a.action,
        priority: a.priority as "high" | "medium" | "low",
        score: a.score,
        channel: a.channel,
        deadline: a.deadline,
        createdAt: a.created_at,
        status: a.status,
      }));
    },
  });
}

// ─── Cockpit Analyses ─────────────────────────────────────────
export function useCockpitAnalyses() {
  return useQuery({
    queryKey: ["cockpit_analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cockpit_analyses")
        .select("*")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        query: a.query,
        category: a.category as "academic" | "clinical" | "resource",
        categoryLabel: a.category_label,
        savedAt: a.saved_at,
        lastRefreshed: a.last_refreshed,
        hasAnomaly: a.has_anomaly,
        anomalyMessage: a.anomaly_message,
        chartType: a.chart_type as "bar" | "line" | "scatter",
        chartData: a.chart_data ?? [],
        summary: a.summary,
        targetCount: a.target_count,
      }));
    },
  });
}

// ─── HCP Detail Sub-data ──────────────────────────────────────
export function useHCPPublications(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_publications", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_publications")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("published_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        journal: p.journal,
        date: p.published_date,
        impactFactor: p.impact_factor ?? 0,
        citations: p.citations ?? 0,
        authors: p.authors ?? [],
        doi: p.doi ?? "",
      }));
    },
  });
}

export function useHCPTrials(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_trials", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_trials")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        id: t.id,
        registrationId: t.registration_id ?? "",
        title: t.title,
        phase: t.phase ?? "",
        status: t.status as "招募中" | "进行中" | "已完成" | "终止",
        startDate: t.start_date ?? "",
        endDate: t.end_date ?? "",
        role: t.role ?? "",
      }));
    },
  });
}

export function useHCPGrants(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_grants", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_grants")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("period", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g: any) => ({
        id: g.id,
        title: g.title,
        fundingBody: g.funding_body ?? "",
        amount: g.amount ?? "",
        period: g.period ?? "",
        status: g.status as "在研" | "结题",
        role: g.role ?? "",
      }));
    },
  });
}

export function useHCPConferences(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_conferences", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_conferences")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("conference_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        date: c.conference_date,
        location: c.location ?? "",
        role: c.role as "主席" | "演讲嘉宾" | "壁报展示" | "参会者",
        topic: c.topic ?? "",
      }));
    },
  });
}

export function useHCPGuidelines(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_guidelines", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_guidelines")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("year", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((g: any) => ({
        id: g.id,
        title: g.title,
        organization: g.organization ?? "",
        year: g.year ?? "",
        role: g.role ?? "",
        status: g.status as "已发布" | "修订中",
      }));
    },
  });
}

export function useHCPNews(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_news", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_news")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("published_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        id: n.id,
        title: n.title,
        source: n.source ?? "",
        date: n.published_date,
        summary: n.summary ?? "",
        url: n.url ?? "#",
      }));
    },
  });
}

export function useHCPRelations(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_relations", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_relations")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("strength", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        hcpId: r.related_hcp_id,
        name: r.related_name,
        institution: r.related_institution ?? "",
        department: r.related_department ?? "",
        relation: r.relation_type as "合作发表" | "共同PI" | "师生关系" | "同机构" | "学会同事",
        strength: r.strength ?? 1,
      }));
    },
  });
}

export function useHCPResearchAreas(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_research_areas", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_research_areas")
        .select("*")
        .eq("hcp_id", hcpId!);
      if (error) throw error;
      const diseases = (data ?? [])
        .filter((r: any) => r.area_type === "disease")
        .map((r: any) => ({ name: r.name, level: r.level as "核心" | "扩展" }));
      const drugs = (data ?? [])
        .filter((r: any) => r.area_type === "drug")
        .map((r: any) => ({ name: r.name, type: r.level as "在研" | "已上市", company: r.company }));
      return { diseases, drugs };
    },
  });
}

export function useHCPActivities(hcpId: string | undefined) {
  return useQuery({
    queryKey: ["hcp_activities", hcpId],
    enabled: !!hcpId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_activities")
        .select("*")
        .eq("hcp_id", hcpId!)
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        id: a.id,
        date: a.activity_date,
        type: a.activity_type as "论文" | "会议" | "试验" | "媒体",
        title: a.title,
      }));
    },
  });
}

// ─── All HCP Activities (for IntelFeed) ───────────────────────
export function useAllHCPActivities() {
  return useQuery({
    queryKey: ["all_hcp_activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hcp_activities")
        .select("*")
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────
function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "刚刚";
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return `${Math.floor(diffDays / 30)}月前`;
}
