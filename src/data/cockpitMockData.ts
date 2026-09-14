import { SavedAnalysis } from "@/pages/MyCockpit";

/* Real DB UUIDs for the three seed analyses */
export const ANALYSIS_IDS = {
  ACADEMIC_PUBS: "0d56be60-5b34-49a5-86dd-b2eee27a253b",
  CLINICAL_TRIALS: "c9102e90-14ec-4ea0-8169-b1701c0e82b6",
  RESOURCE_MINING: "573a4bcf-fd21-4b41-8ba2-69aa8774518a",
} as const;

// Simulated saved analyses with mock data (IDs match DB)
export const mockSavedAnalyses: SavedAnalysis[] = [
  {
    id: ANALYSIS_IDS.ACADEMIC_PUBS,
    title: "近 5 年第一作者/通讯作者论文产出趋势",
    query: "分析这批专家近 5 年的第一作者/通讯作者论文产出趋势",
    category: "academic",
    categoryLabel: "学术地位",
    savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastRefreshed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    hasAnomaly: true,
    anomalyMessage: "张伟教授近 1 月新增 3 篇通讯作者论文，环比增长 150%",
    chartType: "line",
    chartData: [
      { year: "2021", firstAuthor: 12, correspondingAuthor: 8, other: 15 },
      { year: "2022", firstAuthor: 10, correspondingAuthor: 14, other: 18 },
      { year: "2023", firstAuthor: 8, correspondingAuthor: 19, other: 16 },
      { year: "2024", firstAuthor: 6, correspondingAuthor: 24, other: 14 },
      { year: "2025", firstAuthor: 4, correspondingAuthor: 28, other: 12 },
    ],
    summary:
      "列表中 60% 的专家学术重心已从基础论文转向临床转化，通讯作者论文 5 年增长 250%。",
    targetCount: 8,
  },
  {
    id: ANALYSIS_IDS.CLINICAL_TRIALS,
    title: "PD-1 临床试验参与度",
    query: "统计当前列表专家在 PD-1 药物分类下的临床试验参与度",
    category: "clinical",
    categoryLabel: "临床贡献",
    savedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastRefreshed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    hasAnomaly: false,
    chartType: "bar",
    chartData: [
      { name: "张伟", phaseI: 2, phaseII: 3, phaseIII: 5 },
      { name: "王芳", phaseI: 1, phaseII: 4, phaseIII: 3 },
      { name: "陈强", phaseI: 3, phaseII: 2, phaseIII: 1 },
      { name: "赵敏", phaseI: 0, phaseII: 3, phaseIII: 2 },
      { name: "刘洋", phaseI: 2, phaseII: 1, phaseIII: 0 },
      { name: "李明", phaseI: 1, phaseII: 2, phaseIII: 1 },
    ],
    summary: "75% 的专家参与过 PD-1/PD-L1 相关临床试验，整体参与度同比增长 18%。",
    targetCount: 8,
  },
  {
    id: ANALYSIS_IDS.RESOURCE_MINING,
    title: "中坚力量专家挖掘",
    query: "挖掘过去 3 年获得过国家自然科学基金且有新药临床经验的中坚力量",
    category: "resource",
    categoryLabel: "资源潜力",
    savedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastRefreshed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    hasAnomaly: true,
    anomalyMessage: "陈强教授新增 2 个临床项目，活跃度评分上升至 85",
    chartType: "scatter",
    chartData: [
      { name: "张伟", funding: 450, activity: 92, size: 28 },
      { name: "王芳", funding: 380, activity: 85, size: 24 },
      { name: "陈强", funding: 320, activity: 85, size: 22 },
      { name: "赵敏", funding: 280, activity: 72, size: 18 },
      { name: "李明", funding: 200, activity: 65, size: 14 },
      { name: "周婷", funding: 150, activity: 58, size: 12 },
      { name: "刘洋", funding: 120, activity: 45, size: 10 },
      { name: "孙立", funding: 80, activity: 35, size: 8 },
    ],
    summary:
      "识别出 3 位中坚力量专家，兼具科研深度与临床转化能力，是高价值合作目标。",
    targetCount: 8,
  },
];
