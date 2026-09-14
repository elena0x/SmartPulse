import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface RawItem {
  hcp_id: string;
  type: string;
  title: string;
  date: string;
  details: string;
}

export type ActivityEntry = { type: string; date: string; title: string };

const getNameAliases = (name: string) => {
  const normalized = name
    .replace(/主任医师|副主任医师|主治医师/g, "")
    .replace(/副教授|教授|副主任|主任|医生|医师/g, "")
    .trim();

  return Array.from(new Set([name, normalized].filter(Boolean)));
};

/**
 * Fetches real business data from all HCP tables (publications, trials,
 * conferences, news, grants, guidelines) for the last 3 months,
 * then calls AI to summarize each into a one-sentence activity.
 *
 * @param nameMap  Map<hcp_id, hcpName> so results are keyed by name
 */
export function useHCPBusinessActivities(
  nameMap: Map<string, string>
) {
  return useQuery({
    queryKey: ["hcp-business-activities-ai", nameMap.size],
    queryFn: async (): Promise<Record<string, ActivityEntry[]>> => {
      if (nameMap.size === 0) return {};

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const since = threeMonthsAgo.toISOString().split("T")[0];

      // Fetch from all business tables in parallel
      const [pubs, trials, confs, news, grants, guides] = await Promise.all([
        supabase
          .from("hcp_publications")
          .select("hcp_id, title, journal, published_date, impact_factor")
          .gte("published_date", since),
        supabase
          .from("hcp_trials")
          .select("hcp_id, title, phase, status, start_date")
          .gte("start_date", since),
        supabase
          .from("hcp_conferences")
          .select("hcp_id, name, topic, role, conference_date")
          .gte("conference_date", since),
        supabase
          .from("hcp_news")
          .select("hcp_id, title, source, published_date")
          .gte("published_date", since),
        supabase
          .from("hcp_grants")
          .select("hcp_id, title, funding_body, amount, created_at")
          .gte("created_at", since),
        supabase
          .from("hcp_guidelines")
          .select("hcp_id, title, organization, role, created_at")
          .gte("created_at", since),
      ]);

      const rawItems: RawItem[] = [];

      for (const p of pubs.data ?? []) {
        rawItems.push({
          hcp_id: p.hcp_id,
          type: "论文",
          title: p.title,
          date: p.published_date ?? "",
          details: `${p.journal}${p.impact_factor ? `, IF=${p.impact_factor}` : ""}`,
        });
      }
      for (const t of trials.data ?? []) {
        rawItems.push({
          hcp_id: t.hcp_id,
          type: "临床试验",
          title: t.title,
          date: t.start_date ?? "",
          details: [t.phase, t.status].filter(Boolean).join(", "),
        });
      }
      for (const c of confs.data ?? []) {
        rawItems.push({
          hcp_id: c.hcp_id,
          type: "会议",
          title: c.name,
          date: c.conference_date ?? "",
          details: [c.role, c.topic].filter(Boolean).join(", "),
        });
      }
      for (const n of news.data ?? []) {
        rawItems.push({
          hcp_id: n.hcp_id,
          type: "媒体",
          title: n.title,
          date: n.published_date ?? "",
          details: n.source ?? "",
        });
      }
      for (const g of grants.data ?? []) {
        rawItems.push({
          hcp_id: g.hcp_id,
          type: "基金",
          title: g.title,
          date: g.created_at?.split("T")[0] ?? "",
          details: [g.funding_body, g.amount].filter(Boolean).join(", "),
        });
      }
      for (const g of guides.data ?? []) {
        rawItems.push({
          hcp_id: g.hcp_id,
          type: "临床指南",
          title: g.title,
          date: g.created_at?.split("T")[0] ?? "",
          details: [g.organization, g.role].filter(Boolean).join(", "),
        });
      }

      if (rawItems.length === 0) return {};

      // Call AI edge function for summaries
      let summaries: { index: number; summary: string }[] = [];
      try {
        const { data, error } = await supabase.functions.invoke(
          "summarize-activities",
          {
            body: {
              items: rawItems.map((it, idx) => ({
                index: idx,
                type: it.type,
                title: it.title,
                details: it.details,
              })),
            },
          }
        );
        if (!error && data?.summaries) {
          summaries = data.summaries;
        }
      } catch (e) {
        console.warn("AI summarization failed, falling back to raw titles", e);
      }

      // Build summary lookup
      const summaryMap = new Map(summaries.map((s) => [s.index, s.summary]));

      // Group by hcpName and common title variants so card names can match DB names
      const activityMap: Record<string, ActivityEntry[]> = {};
      for (let idx = 0; idx < rawItems.length; idx++) {
        const raw = rawItems[idx];
        const hcpName = nameMap.get(raw.hcp_id) ?? raw.hcp_id;
        const summary = summaryMap.get(idx) ?? raw.title;
        const entry = {
          type: raw.type,
          date: raw.date,
          title: summary,
        };

        for (const alias of getNameAliases(hcpName)) {
          if (!activityMap[alias]) activityMap[alias] = [];
          activityMap[alias].push(entry);
        }
      }

      return activityMap;
    },
    staleTime: 5 * 60 * 1000, // cache 5 minutes
    enabled: nameMap.size > 0,
  });
}
