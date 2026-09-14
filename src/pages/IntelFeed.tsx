import AppLayout from "@/components/layout/AppLayout";
import { useSignals, useNBAActions } from "@/hooks/useDataService";
import { useHCPProfiles } from "@/hooks/useHCPProfiles";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import UnifiedFeedCard, { UnifiedItem, RegularSignal, DbTag } from "@/components/feed/UnifiedFeedCard";
import { useHCPBusinessActivities } from "@/hooks/useHCPBusinessActivities";
import { useHCPTagsAll } from "@/hooks/useHCPTags";
import { supabase } from "@/integrations/supabase/client";



const getActivityCandidates = (name: string) => {
  const normalized = name
    .replace(/主任医师|副主任医师|主治医师/g, "")
    .replace(/副教授|教授|副主任|主任|医生|医师/g, "")
    .trim();

  return Array.from(new Set([
    name,
    normalized,
    name.replace(/\s+/g, "").trim(),
    normalized.replace(/\s+/g, "").trim(),
  ].filter(Boolean)));
};

const isNewTag = (createdAt?: string) => {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  const now = new Date();
  return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
};

function buildUnifiedItems(
  regularSignals: any[],
  nbaActions: any[],
  activityMap: Record<string, { type: string; date: string; title: string }[]>,
  tagsByHcpId: Record<string, DbTag[]>,
  hcpIdByName: Record<string, string>,
  nameByHcpId: Map<string, string>,
): UnifiedItem[] {
  const map = new Map<string, UnifiedItem>();
  const resolveActivities = (name: string) => {
    const merged = getActivityCandidates(name)
      .flatMap((candidate) => activityMap[candidate] ?? []);

    return merged.filter((activity, index, self) => {
      const key = `${activity.type}|${activity.date}|${activity.title}`;
      return self.findIndex((item) => `${item.type}|${item.date}|${item.title}` === key) === index;
    });
  };

  const resolveDbTags = (hcpId: string): DbTag[] => {
    return tagsByHcpId[hcpId] ?? [];
  };

  for (const sig of regularSignals) {
    const hcpId = sig.hcpId ?? sig.hcp_id ?? hcpIdByName[sig.hcpName] ?? sig.hcpName;
    const canonicalName = nameByHcpId.get(hcpId) ?? sig.hcpName;
    const nba = nbaActions.find((a) => a.hcpName === sig.hcpName || a.hcpName === canonicalName);
    const existing = map.get(hcpId);
    const score = nba?.score ?? 70;
    const derivedPriority = score >= 90 ? "high" : score >= 70 ? "medium" : "low";

    if (existing) {
      if (!existing.regularSignal) existing.regularSignal = sig as RegularSignal;
      const allTags = new Set([...existing.tags, ...(sig.tags ?? [])]);
      existing.tags = [...allTags];
      existing.activities = resolveActivities(existing.hcpName);
      existing.hasActivities = existing.activities.length > 0;
      const regularScore = nba?.score ?? 0;
      if (regularScore > existing.unifiedScore) {
        existing.unifiedScore = regularScore;
        existing.priority = regularScore >= 90 ? "high" : regularScore >= 70 ? "medium" : "low";
      }
    } else {
      const dbTags = resolveDbTags(hcpId);
      const activities = resolveActivities(canonicalName);
      const hasTagChange = dbTags.some((t) => isNewTag(t.created_at));

      map.set(hcpId, {
        hcpId,
        hcpName: canonicalName,
        hospital: sig.hospital,
        priority: derivedPriority,
        tags: [...(sig.tags ?? [])],
        dbTags,
        triggeredAlert: null,
        regularSignal: sig as RegularSignal,
        regularStrategySource: null,
        regularNba: nba ?? null,
        activities,
        unifiedScore: score,
        unifiedNbaAction: "",
        unifiedChannel: nba?.channel ?? "微信",
        hasTagChange,
        hasActivities: activities.length > 0,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.unifiedScore - a.unifiedScore);
}

const IntelFeed = () => {
  const location = useLocation();
  const scrollDoneRef = useRef(false);
  const { data: signals = [] } = useSignals();
  const { data: nbaActions = [] } = useNBAActions();
  const { data: hcpProfiles = [] } = useHCPProfiles();
  const { data: allDbTags = [] } = useHCPTagsAll();

  const nameMap = useMemo(
    () => new Map(hcpProfiles.map((p) => [p.hcp_id, p.name])),
    [hcpProfiles],
  );

  const hcpIdByName = useMemo(
    () => Object.fromEntries(hcpProfiles.map((p) => [p.name, p.hcp_id])),
    [hcpProfiles],
  );

  // Group DB tags by hcp_id, include created_at
  const tagsByHcpId = useMemo(() => {
    const m: Record<string, DbTag[]> = {};
    for (const t of allDbTags) {
      if (!m[t.hcp_id]) m[t.hcp_id] = [];
      m[t.hcp_id].push({
        id: t.id,
        tag_key: t.tag_key,
        tag_value: t.tag_value,
        tag_category: t.tag_category,
        source: t.source,
        created_at: t.created_at,
      });
    }
    return m;
  }, [allDbTags]);

  const { data: activityMap = {}, isLoading: activitiesLoading } = useHCPBusinessActivities(nameMap);

  const [aiNbaMap, setAiNbaMap] = useState<Record<string, string>>({});
  const [nbaGenerating, setNbaGenerating] = useState(false);
  const [nbaGenDone, setNbaGenDone] = useState(false);

  const unifiedItems = useMemo(
    () => buildUnifiedItems(signals, nbaActions, activityMap, tagsByHcpId, hcpIdByName, nameMap),
    [signals, nbaActions, activityMap, tagsByHcpId, hcpIdByName, nameMap],
  );

  // AI-generate NBA suggestions
  useEffect(() => {
    if (unifiedItems.length === 0) return;
    const itemsWithActivities = unifiedItems.filter((item) => item.activities.length > 0);
    if (itemsWithActivities.length === 0) return;

    const missing = itemsWithActivities.filter((item) => !aiNbaMap[item.hcpName]);
    if (missing.length === 0) return;

    const generateNBA = async () => {
      setNbaGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-nba", {
          body: {
            requests: missing.map((item) => ({
              hcpName: item.hcpName,
              activities: item.activities.slice(0, 6),
              priority: item.priority,
              channel: item.unifiedChannel,
            })),
          },
        });

        if (!error && data?.suggestions) {
          const newMap: Record<string, string> = {};
          for (const s of data.suggestions) {
            const item = missing[s.index];
            if (item) newMap[item.hcpName] = s.nba;
          }
          setAiNbaMap((prev) => ({ ...prev, ...newMap }));
        }
      } catch (e) {
        console.warn("AI NBA generation failed", e);
      } finally {
        setNbaGenerating(false);
        setNbaGenDone(true);
      }
    };

    generateNBA();
  }, [unifiedItems, aiNbaMap]);

  // Apply AI NBA + loading states
  const finalItems = useMemo(
    () =>
      unifiedItems.map((item) => {
        const hasAiNba = !!aiNbaMap[item.hcpName];
        const shouldShowLoading = !hasAiNba && !nbaGenDone && item.activities.length > 0;

        return {
          ...item,
          unifiedNbaAction: aiNbaMap[item.hcpName] || item.unifiedNbaAction,
          nbaLoading: shouldShowLoading,
          activitiesLoading: activitiesLoading,
        };
      }),
    [unifiedItems, aiNbaMap, nbaGenDone, activitiesLoading],
  );

  // Scroll to HCP card when navigating from SignalCenter with hash
  useEffect(() => {
    if (scrollDoneRef.current || !location.hash || finalItems.length === 0) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    const el = document.getElementById(targetId);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
      scrollDoneRef.current = true;
    }
  }, [location.hash, finalItems]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">智能线索</h1>
          <p className="text-sm text-muted-foreground mt-1">近3个月标签异动与原始信号 · AI 行动推荐</p>
        </div>

        <div className="space-y-4">
          {finalItems.map((item, i) => (
            <UnifiedFeedCard
              key={item.hcpName}
              item={item}
              index={i}
              onOpenStrategy={() => {}}
              onDismiss={() => {}}
            />
          ))}

          {finalItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">暂无近期线索</p>
              <p className="text-xs text-muted-foreground mt-1">系统将自动根据标签异动和近期动态生成智能线索</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default IntelFeed;
