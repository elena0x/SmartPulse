// ─── Scoring Model Types & Mock Data ───

export interface ScoringDimension {
  id: string;
  label: string;
  weight: number; // 0-100, all must sum to 100
  metrics: ScoringMetric[];
}

export interface ScoringMetric {
  id: string;
  label: string;
  enabled: boolean;
  weight: number; // 0-100, within a dimension all metric weights must sum ≤ dimension weight
  rules?: ScoringRule[];
}

export interface ScoringRule {
  type: "segment" | "weighted" | "mapping";
  segments?: { range: string; score: number }[];
  coefficients?: { label: string; value: number }[];
  formula?: string;
}

export interface ScoringModel {
  dimensions: ScoringDimension[];
}

// ─── Default dimension templates ───

export const defaultDimensions: ScoringDimension[] = [
  {
    id: "institution",
    label: "机构影响力",
    weight: 25,
    metrics: [
      {
        id: "hospital_rank",
        label: "医院复旦排名",
        enabled: true,
        weight: 12,
        rules: [
          {
            type: "segment",
            segments: [
              { range: "1-10名", score: 1.0 },
              { range: "11-50名", score: 0.8 },
              { range: "51-100名", score: 0.5 },
              { range: "100名以外", score: 0.2 },
            ],
          },
        ],
      },
      { id: "hospital_level", label: "医院等级", enabled: true, weight: 10, rules: [{ type: "segment", segments: [{ range: "三甲综合", score: 1.0 }, { range: "三甲专科", score: 0.9 }, { range: "三乙", score: 0.6 }, { range: "其他", score: 0.3 }] }] },
      { id: "dept_national_key", label: "国家重点学科", enabled: false, weight: 3 },
    ],
  },
  {
    id: "title",
    label: "专家头衔",
    weight: 25,
    metrics: [
      { id: "professional_title", label: "专业技术职称", enabled: true, weight: 10, rules: [{ type: "segment", segments: [{ range: "正高/教授", score: 1.0 }, { range: "副高/副教授", score: 0.7 }, { range: "中级", score: 0.4 }, { range: "初级", score: 0.1 }] }] },
      { id: "admin_title", label: "行政职务", enabled: true, weight: 10, rules: [{ type: "segment", segments: [{ range: "院长/副院长", score: 1.0 }, { range: "科主任", score: 0.8 }, { range: "副科主任", score: 0.6 }, { range: "无", score: 0.1 }] }] },
      { id: "supervisor", label: "导师资格", enabled: false, weight: 5, rules: [{ type: "segment", segments: [{ range: "博导", score: 1.0 }, { range: "硕导", score: 0.6 }, { range: "无", score: 0.1 }] }] },
    ],
  },
  {
    id: "academic",
    label: "学术能力",
    weight: 30,
    metrics: [
      {
        id: "pubmed",
        label: "PubMed 论文",
        enabled: true,
        weight: 12,
        rules: [
          {
            type: "weighted",
            coefficients: [
              { label: "第一作者系数", value: 0.45 },
              { label: "通讯作者系数", value: 0.45 },
              { label: "合著者系数", value: 0.10 },
            ],
          },
          {
            type: "mapping",
            formula: "单篇得分 = 作者系数 × 影响因子(IF)",
          },
        ],
      },
      { id: "clinical_trials", label: "ClinicalTrials 临床试验", enabled: true, weight: 10, rules: [{ type: "weighted", coefficients: [{ label: "PI系数", value: 0.6 }, { label: "Sub-I系数", value: 0.3 }, { label: "参与者系数", value: 0.1 }] }] },
      { id: "grants", label: "科研基金", enabled: false, weight: 4 },
      { id: "guidelines", label: "指南参编", enabled: false, weight: 4 },
    ],
  },
  {
    id: "social",
    label: "社会活跃度",
    weight: 20,
    metrics: [
      { id: "conferences", label: "学术会议发言", enabled: true, weight: 10, rules: [{ type: "segment", segments: [{ range: "国际大会主旨报告", score: 1.0 }, { range: "全国会议发言", score: 0.7 }, { range: "地区会议", score: 0.4 }] }] },
      { id: "society_roles", label: "学会任职", enabled: false, weight: 5 },
      { id: "media_presence", label: "媒体曝光度", enabled: false, weight: 5 },
    ],
  },
];

// ─── Per-HCP raw metric data for dynamic scoring ───
// Each metric stores a raw score 0-1 that represents the HCP's performance on that metric

export interface HCPMetricRawData {
  [metricId: string]: number; // raw score 0-1
}

export const hcpRawMetricData: Record<string, HCPMetricRawData> = {
  "HCP-001": {
    hospital_rank: 1.0,    // 协和医院, 复旦排名 Top 1
    hospital_level: 1.0,   // 三甲综合
    dept_national_key: 0.9, // 国家重点学科
    professional_title: 1.0, // 教授
    admin_title: 0.8,      // 科主任
    supervisor: 1.0,       // 博导
    pubmed: 0.92,          // 87篇论文, 高IF
    clinical_trials: 0.85, // 12项试验, 多为PI
    grants: 0.88,          // 多项国自然
    guidelines: 0.95,      // 参与3部指南
    conferences: 0.94,     // 国际大会主旨报告
    society_roles: 0.90,   // 中华医学会副主委
    media_presence: 0.75,  // 中等媒体曝光
  },
  "HCP-002": {
    hospital_rank: 0.8,    // 中山医院, 排名11-50
    hospital_level: 1.0,   // 三甲综合
    dept_national_key: 0.7,
    professional_title: 0.7, // 副教授
    admin_title: 0.6,      // 副科主任
    supervisor: 0.6,       // 硕导
    pubmed: 0.72,          // 34篇
    clinical_trials: 0.78, // 5项
    grants: 0.65,
    guidelines: 0.40,
    conferences: 0.70,     // 全国会议发言
    society_roles: 0.55,
    media_presence: 0.50,
  },
  "HCP-003": {
    hospital_rank: 0.8,    // 南方医院
    hospital_level: 1.0,
    dept_national_key: 0.6,
    professional_title: 0.8, // 主任医师
    admin_title: 0.8,      // 科主任
    supervisor: 1.0,       // 博导
    pubmed: 0.88,          // 56篇
    clinical_trials: 0.82,
    grants: 0.78,
    guidelines: 0.90,      // NCCN指南参编
    conferences: 0.85,
    society_roles: 0.80,
    media_presence: 0.65,
  },
  "HCP-004": {
    hospital_rank: 0.8,    // 华西医院
    hospital_level: 1.0,
    dept_national_key: 0.85,
    professional_title: 1.0, // 教授
    admin_title: 0.8,      // 科主任
    supervisor: 1.0,       // 博导
    pubmed: 0.80,          // 62篇
    clinical_trials: 0.75,
    grants: 0.72,
    guidelines: 0.60,
    conferences: 0.88,     // ASCO GI口头报告
    society_roles: 0.70,
    media_presence: 0.80,
  },
  "HCP-005": {
    hospital_rank: 0.5,    // 排名51-100
    hospital_level: 0.9,   // 三甲专科
    dept_national_key: 0.3,
    professional_title: 0.4, // 中级
    admin_title: 0.1,      // 无行政职务
    supervisor: 0.1,       // 无
    pubmed: 0.45,          // 12篇
    clinical_trials: 0.50,
    grants: 0.35,
    guidelines: 0.10,
    conferences: 0.40,     // 地区会议
    society_roles: 0.20,
    media_presence: 0.30,
  },
  "HCP-006": {
    hospital_rank: 0.8,    // 排名11-50
    hospital_level: 1.0,
    dept_national_key: 0.75,
    professional_title: 0.7, // 副教授
    admin_title: 0.6,      // 副科主任
    supervisor: 0.6,       // 硕导
    pubmed: 0.78,
    clinical_trials: 0.82,
    grants: 0.70,
    guidelines: 0.55,
    conferences: 0.80,
    society_roles: 0.65,
    media_presence: 0.70,
  },
  "HCP-007": {
    hospital_rank: 0.5,
    hospital_level: 0.6,   // 三乙
    dept_national_key: 0.1,
    professional_title: 0.4, // 中级
    admin_title: 0.1,
    supervisor: 0.1,
    pubmed: 0.35,
    clinical_trials: 0.40,
    grants: 0.25,
    guidelines: 0.05,
    conferences: 0.35,
    society_roles: 0.15,
    media_presence: 0.20,
  },
  "HCP-008": {
    hospital_rank: 0.5,
    hospital_level: 0.9,
    dept_national_key: 0.5,
    professional_title: 0.7, // 副教授
    admin_title: 0.6,
    supervisor: 0.6,
    pubmed: 0.62,
    clinical_trials: 0.58,
    grants: 0.55,
    guidelines: 0.40,
    conferences: 0.65,
    society_roles: 0.50,
    media_presence: 0.45,
  },
};

// ─── Dynamic scoring computation ───

export interface HCPScore {
  hcpId: string;
  totalScore: number;
  previousRank: number;
  currentRank: number;
  breakdown: {
    dimensionId: string;
    dimensionLabel: string;
    weight: number;
    rawScore: number; // 0-1
    weightedScore: number;
    metricDetails?: {
      metricId: string;
      metricLabel: string;
      metricWeight: number;
      rawScore: number;
      weightedScore: number;
    }[];
  }[];
}

/**
 * Compute HCP scores dynamically based on the configured dimensions + raw data.
 */
export function computeScores(
  dimensions: ScoringDimension[],
  previousScores?: HCPScore[],
): HCPScore[] {
  const previousRankMap = new Map<string, number>();
  if (previousScores) {
    for (const s of previousScores) {
      previousRankMap.set(s.hcpId, s.currentRank);
    }
  }

  const hcpIds = Object.keys(hcpRawMetricData);
  const scores: HCPScore[] = [];

  for (const hcpId of hcpIds) {
    const rawData = hcpRawMetricData[hcpId];
    let totalScore = 0;
    const breakdown: HCPScore["breakdown"] = [];

    for (const dim of dimensions) {
      if (dim.weight === 0) {
        breakdown.push({
          dimensionId: dim.id,
          dimensionLabel: dim.label,
          weight: dim.weight,
          rawScore: 0,
          weightedScore: 0,
          metricDetails: [],
        });
        continue;
      }

      const enabledMetrics = dim.metrics.filter((m) => m.enabled);
      const totalMetricWeight = enabledMetrics.reduce((s, m) => s + m.weight, 0);

      let dimRawScore = 0;
      const metricDetails: NonNullable<HCPScore["breakdown"][0]["metricDetails"]> = [];

      for (const metric of enabledMetrics) {
        const raw = rawData[metric.id] ?? 0.5; // default to mid if no data
        const metricWeightedScore = totalMetricWeight > 0
          ? (metric.weight / totalMetricWeight) * raw
          : 0;
        dimRawScore += metricWeightedScore;

        metricDetails.push({
          metricId: metric.id,
          metricLabel: metric.label,
          metricWeight: metric.weight,
          rawScore: raw,
          weightedScore: parseFloat((raw * metric.weight).toFixed(1)),
        });
      }

      // dimRawScore is now 0-1
      const weightedScore = parseFloat((dimRawScore * dim.weight).toFixed(1));
      totalScore += weightedScore;

      breakdown.push({
        dimensionId: dim.id,
        dimensionLabel: dim.label,
        weight: dim.weight,
        rawScore: parseFloat(dimRawScore.toFixed(3)),
        weightedScore,
        metricDetails,
      });
    }

    scores.push({
      hcpId,
      totalScore: Math.round(totalScore),
      previousRank: previousRankMap.get(hcpId) ?? 0,
      currentRank: 0, // computed after sorting
      breakdown,
    });
  }

  // Sort by totalScore descending and assign ranks
  scores.sort((a, b) => b.totalScore - a.totalScore);
  scores.forEach((s, i) => {
    s.currentRank = i + 1;
    if (s.previousRank === 0) s.previousRank = s.currentRank; // first time
  });

  return scores;
}

// Pre-computed default scores for initial display
export const mockHCPScores: HCPScore[] = computeScores(defaultDimensions);
