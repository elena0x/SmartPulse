/**
 * NBA (Next Best Action) auto-generation rules
 * Combines HCP scores + DB tags to produce actionable recommendations
 */
import { supabase } from "@/integrations/supabase/client";
import { HCPScore } from "@/data/scoringModelData";
import { DBTag } from "@/hooks/useHCPTags";
import { HCPProfile } from "@/hooks/useHCPProfiles";

export interface NBARule {
  id: string;
  name: string;
  /** Min score threshold (inclusive) */
  minScore: number;
  /** Max score threshold (exclusive, optional) */
  maxScore?: number;
  /** Required tag keys (any match triggers) */
  requiredTagKeys: string[];
  /** Whether ALL tags must match or ANY */
  tagMatchMode: "any" | "all";
  /** Generated action template */
  actionTemplate: string;
  priority: "high" | "medium" | "low";
  channel: string;
  /** Days until deadline from now */
  deadlineDays: number;
}

/** Default NBA rules that drive auto-generation */
export const defaultNBARules: NBARule[] = [
  {
    id: "rule-top-kol",
    name: "顶级KOL高优跟进",
    minScore: 80,
    requiredTagKeys: [],
    tagMatchMode: "any",
    actionTemplate: "该专家综合评分 {score} 分，属于顶级KOL，建议安排高层拜访并探讨深度合作机会。",
    priority: "high",
    channel: "面访",
    deadlineDays: 7,
  },
  {
    id: "rule-high-score-tagged",
    name: "高分+标签专家重点关注",
    minScore: 70,
    maxScore: 80,
    requiredTagKeys: ["免疫治疗先行者", "CAR-T 研究者", "指南制定者"],
    tagMatchMode: "any",
    actionTemplate: "评分 {score} 且具有关键标签 [{tags}]，建议针对其研究方向定制学术沟通方案。",
    priority: "high",
    channel: "学术会议",
    deadlineDays: 14,
  },
  {
    id: "rule-rising-star",
    name: "潜力新星培育",
    minScore: 50,
    maxScore: 70,
    requiredTagKeys: ["潜力新星"],
    tagMatchMode: "any",
    actionTemplate: "该专家被标记为潜力新星（评分 {score}），建议通过线上学术活动建立早期关系。",
    priority: "medium",
    channel: "线上会议",
    deadlineDays: 21,
  },
  {
    id: "rule-mid-score-engage",
    name: "中等评分专家常规触达",
    minScore: 50,
    maxScore: 70,
    requiredTagKeys: [],
    tagMatchMode: "any",
    actionTemplate: "评分 {score} 的中层专家，建议通过微信定期推送相关学术资讯保持触达。",
    priority: "medium",
    channel: "微信",
    deadlineDays: 30,
  },
  {
    id: "rule-low-score-monitor",
    name: "低分专家持续监测",
    minScore: 0,
    maxScore: 50,
    requiredTagKeys: [],
    tagMatchMode: "any",
    actionTemplate: "评分 {score} 较低，暂不建议主动投入资源，持续监测其学术动态变化。",
    priority: "low",
    channel: "系统监测",
    deadlineDays: 90,
  },
];

export interface GeneratedNBA {
  hcp_id: string;
  hcp_name: string;
  action: string;
  priority: "high" | "medium" | "low";
  score: number;
  channel: string;
  deadline: string;
  ruleName: string;
}

/**
 * Generate NBA actions based on scores + tags
 */
export function generateNBAActions(
  scores: HCPScore[],
  dbTags: DBTag[],
  profiles: HCPProfile[],
  rules: NBARule[] = defaultNBARules,
): GeneratedNBA[] {
  const profileMap = new Map(profiles.map(p => [p.hcp_id, p]));
  const tagsByHcp = new Map<string, DBTag[]>();
  for (const t of dbTags) {
    const arr = tagsByHcp.get(t.hcp_id) ?? [];
    arr.push(t);
    tagsByHcp.set(t.hcp_id, arr);
  }

  const results: GeneratedNBA[] = [];

  for (const hcpScore of scores) {
    const profile = profileMap.get(hcpScore.hcpId);
    if (!profile) continue;

    const hcpTags = tagsByHcp.get(hcpScore.hcpId) ?? [];
    const tagKeys = hcpTags.map(t => t.tag_key);

    // Find the first matching rule (rules are priority-ordered)
    for (const rule of rules) {
      // Check score range
      if (hcpScore.totalScore < rule.minScore) continue;
      if (rule.maxScore !== undefined && hcpScore.totalScore >= rule.maxScore) continue;

      // Check tag requirements
      if (rule.requiredTagKeys.length > 0) {
        const matches = rule.requiredTagKeys.filter(k => tagKeys.includes(k));
        if (rule.tagMatchMode === "all" && matches.length < rule.requiredTagKeys.length) continue;
        if (rule.tagMatchMode === "any" && matches.length === 0) continue;
      }

      // Generate action text
      const matchedTags = rule.requiredTagKeys.filter(k => tagKeys.includes(k));
      const actionText = rule.actionTemplate
        .replace("{score}", String(hcpScore.totalScore))
        .replace("{tags}", matchedTags.length > 0 ? matchedTags.join(", ") : tagKeys.slice(0, 3).join(", "));

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + rule.deadlineDays);

      results.push({
        hcp_id: hcpScore.hcpId,
        hcp_name: profile.name,
        action: actionText,
        priority: rule.priority,
        score: hcpScore.totalScore,
        channel: rule.channel,
        deadline: deadline.toISOString().split("T")[0],
        ruleName: rule.name,
      });

      break; // Only use the first matching rule per HCP
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Write generated NBA actions to the database
 */
export async function writeNBAActions(actions: GeneratedNBA[]): Promise<number> {
  if (actions.length === 0) return 0;

  const rows = actions.map(a => ({
    hcp_id: a.hcp_id,
    hcp_name: a.hcp_name,
    action: a.action,
    priority: a.priority,
    score: a.score,
    channel: a.channel,
    deadline: a.deadline,
    status: "pending",
  }));

  const { error } = await supabase
    .from("nba_actions")
    .insert(rows as any);

  if (error) throw error;
  return rows.length;
}
