import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertConfig } from "@/components/cockpit/AlertConfigPanel";
import { mockSavedAnalyses, ANALYSIS_IDS } from "@/data/cockpitMockData";

export interface TriggeredAlert {
  id: string;
  analysisId: string;
  analysisTitle: string;
  /** When merged from multiple strategies, holds all source analysis IDs */
  sourceAnalyses: { analysisId: string; analysisTitle: string; metric: string; metricLabel: string; currentValue: number; threshold: number; operator: string }[];
  hcpName: string;
  hospital: string;
  metric: string;
  metricLabel: string;
  currentValue: number;
  threshold: number;
  operator: string;
  triggeredAt: string;
  nbaAction: string;
  nbaScore: number;
  channel: string;
  tags: string[];
  priority: "high" | "medium" | "low";
}

interface AlertConfigMap {
  [analysisId: string]: AlertConfig;
}

interface AlertConfigContextValue {
  configs: AlertConfigMap;
  setConfig: (analysisId: string, config: AlertConfig) => void;
  triggeredAlerts: TriggeredAlert[];
  dismissAlert: (alertId: string) => void;
}

const AlertConfigContext = createContext<AlertConfigContextValue | null>(null);

// Raw alert before dedup/merge
interface RawAlert extends Omit<TriggeredAlert, 'sourceAnalyses'> {}

const generateRawAlerts = (configs: AlertConfigMap): RawAlert[] => {
  const alerts: RawAlert[] = [];

  const config1 = configs[ANALYSIS_IDS.ACADEMIC_PUBS];
  if (config1?.enabled && config1?.autoGenerateLeads) {
    const analysis = mockSavedAnalyses.find((a) => a.id === ANALYSIS_IDS.ACADEMIC_PUBS);
    if (analysis?.hasAnomaly) {
      alerts.push({
        id: "triggered-1",
        analysisId: ANALYSIS_IDS.ACADEMIC_PUBS,
        analysisTitle: analysis.title,
        hcpName: "张伟教授",
        hospital: "北京协和医院 · 肿瘤科",
        metric: config1.metric,
        metricLabel: "通讯作者论文数",
        currentValue: 3,
        threshold: config1.threshold,
        operator: config1.operator,
        triggeredAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        nbaAction: "张伟教授近1月通讯作者论文激增（+3篇），建议MSL在48小时内安排学术拜访，围绕其最新PD-1联合治疗成果展开深度交流，重点传递我司产品差异化数据。",
        nbaScore: 96,
        channel: "面访",
        tags: ["策略预警", "学术异动", "高产作者"],
        priority: "high",
      });
    }
  }

  const config3 = configs[ANALYSIS_IDS.RESOURCE_MINING];
  if (config3?.enabled && config3?.autoGenerateLeads) {
    const analysis = mockSavedAnalyses.find((a) => a.id === ANALYSIS_IDS.RESOURCE_MINING);
    if (analysis?.hasAnomaly) {
      alerts.push({
        id: "triggered-2",
        analysisId: ANALYSIS_IDS.RESOURCE_MINING,
        analysisTitle: analysis.title,
        hcpName: "陈强教授",
        hospital: "四川华西医院 · 消化科",
        metric: "activityScore",
        metricLabel: "活跃度评分",
        currentValue: 85,
        threshold: 80,
        operator: ">",
        triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nbaAction: "陈强教授新增2个临床项目，活跃度评分升至85。建议立即安排合作洽谈，以我司真实世界数据为切入点，探讨IIT合作机会。",
        nbaScore: 91,
        channel: "面访",
        tags: ["策略预警", "临床活跃", "中坚力量"],
        priority: "high",
      });

      alerts.push({
        id: "triggered-3",
        analysisId: ANALYSIS_IDS.RESOURCE_MINING,
        analysisTitle: analysis.title,
        hcpName: "赵敏副教授",
        hospital: "浙江大学附属第一医院 · 肿瘤科",
        metric: "activityScore",
        metricLabel: "活跃度评分",
        currentValue: 72,
        threshold: 60,
        operator: ">",
        triggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        nbaAction: "赵敏副教授活跃度持续攀升，近期基金与临床双轨发力，建议通过微信发送我司最新循证医学资料，建立初步学术联系。",
        nbaScore: 82,
        channel: "微信",
        tags: ["策略预警", "资源潜力"],
        priority: "medium",
      });
    }
  }

  return alerts;
};

/**
 * Dedup by hcpName: merge multiple alerts for the same professor.
 * Recalculate score = max(scores) + 2 * (sourceCount - 1) bonus, capped at 99.
 * Sort descending by merged score.
 */
const deduplicateAndScore = (rawAlerts: RawAlert[]): TriggeredAlert[] => {
  const grouped = new Map<string, RawAlert[]>();
  for (const alert of rawAlerts) {
    const existing = grouped.get(alert.hcpName) || [];
    existing.push(alert);
    grouped.set(alert.hcpName, existing);
  }

  const merged: TriggeredAlert[] = [];
  for (const [, alerts] of grouped) {
    // Pick the highest-scoring alert as primary
    const sorted = [...alerts].sort((a, b) => b.nbaScore - a.nbaScore);
    const primary = sorted[0];

    // Build sourceAnalyses from all contributing alerts
    const sourceAnalyses = sorted.map((a) => ({
      analysisId: a.analysisId,
      analysisTitle: a.analysisTitle,
      metric: a.metric,
      metricLabel: a.metricLabel,
      currentValue: a.currentValue,
      threshold: a.threshold,
      operator: a.operator,
    }));

    // Recalculate score: base max + multi-strategy bonus
    const baseScore = Math.max(...sorted.map((a) => a.nbaScore));
    const multiStrategyBonus = (sorted.length - 1) * 2;
    const finalScore = Math.min(99, baseScore + multiStrategyBonus);

    // Merge tags (deduplicated)
    const allTags = [...new Set(sorted.flatMap((a) => a.tags))];

    // Use earliest triggeredAt
    const earliestTime = sorted.reduce((earliest, a) =>
      new Date(a.triggeredAt) < new Date(earliest) ? a.triggeredAt : earliest,
      sorted[0].triggeredAt
    );

    // Merge NBA actions if multiple
    const mergedAction = sorted.length > 1
      ? `【多策略预警 ×${sorted.length}】${sorted.map((a) => a.nbaAction).join("；")}`
      : primary.nbaAction;

    // Priority: if any is high, merged is high
    const mergedPriority = sorted.some((a) => a.priority === "high") ? "high"
      : sorted.some((a) => a.priority === "medium") ? "medium" : "low";

    merged.push({
      ...primary,
      id: sorted.map((a) => a.id).join("+"),
      sourceAnalyses,
      nbaScore: finalScore,
      nbaAction: mergedAction,
      tags: allTags,
      triggeredAt: earliestTime,
      priority: mergedPriority,
    });
  }

  // Sort by score descending
  return merged.sort((a, b) => b.nbaScore - a.nbaScore);
};

const generateTriggeredAlerts = (configs: AlertConfigMap): TriggeredAlert[] => {
  const raw = generateRawAlerts(configs);
  return deduplicateAndScore(raw);
};

// Default: enable alert + autoGenerateLeads for analyses with anomalies
const defaultConfigs: AlertConfigMap = {
  [ANALYSIS_IDS.ACADEMIC_PUBS]: { enabled: true, autoGenerateLeads: true, metric: "corrAuthorPubs", operator: ">", threshold: 1, period: "monthly" },
  [ANALYSIS_IDS.CLINICAL_TRIALS]: { enabled: true, autoGenerateLeads: false, metric: "totalTrials", operator: ">", threshold: 2, period: "monthly" },
  [ANALYSIS_IDS.RESOURCE_MINING]: { enabled: true, autoGenerateLeads: true, metric: "activityScore", operator: ">", threshold: 60, period: "monthly" },
};

export const AlertConfigProvider = ({ children }: { children: ReactNode }) => {
  const [configs, setConfigs] = useState<AlertConfigMap>(defaultConfigs);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const setConfig = useCallback((analysisId: string, config: AlertConfig) => {
    setConfigs((prev) => ({ ...prev, [analysisId]: config }));
  }, []);

  const triggeredAlerts = generateTriggeredAlerts(configs).filter(
    (a) => !dismissedIds.has(a.id)
  );

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedIds((prev) => new Set([...prev, alertId]));
  }, []);

  return (
    <AlertConfigContext.Provider value={{ configs, setConfig, triggeredAlerts, dismissAlert }}>
      {children}
    </AlertConfigContext.Provider>
  );
};

export const useAlertConfig = () => {
  const ctx = useContext(AlertConfigContext);
  if (!ctx) throw new Error("useAlertConfig must be used within AlertConfigProvider");
  return ctx;
};
