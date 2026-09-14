// Mock data for smart data mining feature

export interface MiningIntent {
  id: string;
  category: "academic" | "clinical" | "resource";
  categoryLabel: string;
  title: string;
  description: string;
  icon: string;
}

export const recommendedIntents: MiningIntent[] = [
  {
    id: "intent-1",
    category: "academic",
    categoryLabel: "学术地位",
    title: "论文产出趋势分析",
    description: "分析这批专家近 5 年的第一作者/通讯作者论文产出趋势。",
    icon: "📊",
  },
  {
    id: "intent-2",
    category: "academic",
    categoryLabel: "学术地位",
    title: "影响因子分布",
    description: "统计专家发表论文的 SCI 影响因子分布及 H-index 变化。",
    icon: "📈",
  },
  {
    id: "intent-3",
    category: "clinical",
    categoryLabel: "临床贡献",
    title: "临床试验参与度",
    description: "统计当前列表专家在不同药物分类（如 PD-1）下的临床试验参与度。",
    icon: "🧪",
  },
  {
    id: "intent-4",
    category: "clinical",
    categoryLabel: "临床贡献",
    title: "PI 身份占比",
    description: "分析专家在 ClinicalTrials 中担任 PI 与 Sub-I 的比例变化。",
    icon: "🔬",
  },
  {
    id: "intent-5",
    category: "resource",
    categoryLabel: "资源潜力",
    title: "中坚力量挖掘",
    description: "挖掘过去 3 年获得过国家自然科学基金且有新药临床经验的'中坚力量'。",
    icon: "💎",
  },
  {
    id: "intent-6",
    category: "resource",
    categoryLabel: "资源潜力",
    title: "基金与活跃度关联",
    description: "统计专家的基金总额与临床活跃度的相关性分布。",
    icon: "🎯",
  },
];

// Mock analysis results
export interface AnalysisResult {
  id: string;
  title: string;
  summary: string;
  chartType: "bar" | "line" | "pie" | "scatter";
  chartData: any[];
  insights: string[];
  generatedCode: string;
  dataPoints: DataPoint[];
}

export interface DataPoint {
  label: string;
  value: number;
  link?: string;
  hcpId?: string;
}

export const mockAnalysisResults: Record<string, AnalysisResult> = {
  "intent-1": {
    id: "result-1",
    title: "近 5 年第一作者/通讯作者论文产出趋势",
    summary:
      "洞察：列表中 60% 的专家学术重心已从基础论文转向临床转化，其近一年的 ClinicalTrials 注册率环比增长 25%。张伟教授第一作者论文产出呈下降趋势，但通讯作者论文显著上升，表明其已从'执行者'转变为'学术决策者'。",
    chartType: "line",
    chartData: [
      { year: "2021", firstAuthor: 12, correspondingAuthor: 8, other: 15 },
      { year: "2022", firstAuthor: 10, correspondingAuthor: 14, other: 18 },
      { year: "2023", firstAuthor: 8, correspondingAuthor: 19, other: 16 },
      { year: "2024", firstAuthor: 6, correspondingAuthor: 24, other: 14 },
      { year: "2025", firstAuthor: 4, correspondingAuthor: 28, other: 12 },
    ],
    insights: [
      "通讯作者论文 5 年内增长 250%，表明学术领导力显著提升",
      "第一作者论文逐年减少，符合资深专家角色转变规律",
      "张伟教授在 PD-1 领域的通讯作者论文占比最高（35%）",
    ],
    generatedCode: `SELECT author_role, publication_year, COUNT(*) as paper_count
FROM publications p
JOIN hcp_authors ha ON p.id = ha.publication_id
WHERE ha.hcp_id IN (${`'HCP-001','HCP-002','HCP-003'`})
  AND p.publication_year >= 2021
GROUP BY author_role, publication_year
ORDER BY publication_year;`,
    dataPoints: [
      { label: "张伟 - 通讯作者论文 (2025)", value: 12, hcpId: "HCP-001" },
      { label: "王芳 - 通讯作者论文 (2025)", value: 9, hcpId: "HCP-003" },
      { label: "赵敏 - 通讯作者论文 (2025)", value: 7, hcpId: "HCP-006" },
    ],
  },
  "intent-3": {
    id: "result-3",
    title: "PD-1 药物分类下的临床试验参与度",
    summary:
      "洞察：当前列表 8 位专家中，75% 参与过 PD-1/PD-L1 相关临床试验。张伟教授和王芳教授为最活跃的 PI，分别主持 5 项和 3 项 III 期临床试验。整体参与度同比增长 18%。",
    chartType: "bar",
    chartData: [
      { name: "张伟", phaseI: 2, phaseII: 3, phaseIII: 5 },
      { name: "王芳", phaseI: 1, phaseII: 4, phaseIII: 3 },
      { name: "陈强", phaseI: 3, phaseII: 2, phaseIII: 1 },
      { name: "赵敏", phaseI: 0, phaseII: 3, phaseIII: 2 },
      { name: "刘洋", phaseI: 2, phaseII: 1, phaseIII: 0 },
      { name: "李明", phaseI: 1, phaseII: 2, phaseIII: 1 },
    ],
    insights: [
      "张伟教授 III 期试验参与数量最多，是核心 KOL",
      "王芳教授 II 期试验参与度最高，正处于关键转化阶段",
      "刘洋和李明在 I 期试验较活跃，具备早期合作潜力",
    ],
    generatedCode: `SELECT h.name, ct.phase, COUNT(*) as trial_count
FROM clinical_trials ct
JOIN hcp_trials ht ON ct.id = ht.trial_id
JOIN hcp h ON h.id = ht.hcp_id
WHERE ht.hcp_id IN ('HCP-001','HCP-002','HCP-003','HCP-004','HCP-005','HCP-006')
  AND ct.drug_category = 'PD-1/PD-L1'
GROUP BY h.name, ct.phase;`
    ,
    dataPoints: [
      { label: "张伟 - Phase III", value: 5, hcpId: "HCP-001" },
      { label: "王芳 - Phase II", value: 4, hcpId: "HCP-003" },
      { label: "陈强 - Phase I", value: 3, hcpId: "HCP-004" },
    ],
  },
  "intent-5": {
    id: "result-5",
    title: "中坚力量专家挖掘",
    summary:
      "洞察：在当前列表中识别出 3 位'中坚力量'专家——他们在过去 3 年获得国家自然科学基金资助，同时具备新药临床试验经验。这些专家兼具科研深度与临床转化能力，是高价值合作目标。",
    chartType: "scatter",
    chartData: [
      { name: "张伟", funding: 450, activity: 92, size: 28 },
      { name: "王芳", funding: 380, activity: 85, size: 24 },
      { name: "陈强", funding: 320, activity: 78, size: 20 },
      { name: "赵敏", funding: 280, activity: 72, size: 18 },
      { name: "李明", funding: 200, activity: 65, size: 14 },
      { name: "周婷", funding: 150, activity: 58, size: 12 },
      { name: "刘洋", funding: 120, activity: 45, size: 10 },
      { name: "孙立", funding: 80, activity: 35, size: 8 },
    ],
    insights: [
      "张伟、王芳、陈强 3 位专家同时满足基金+临床经验条件",
      "赵敏教授基金额虽略低但临床活跃度较高，可重点关注",
      "散点图右上象限为高潜力区域，建议优先触达",
    ],
    generatedCode: `SELECT h.name,
  SUM(f.amount) as total_funding,
  COUNT(DISTINCT ct.id) as clinical_activity
FROM hcp h
LEFT JOIN funding f ON h.id = f.hcp_id AND f.year >= 2022
LEFT JOIN hcp_trials ht ON h.id = ht.hcp_id
LEFT JOIN clinical_trials ct ON ht.trial_id = ct.id
WHERE h.id IN ('HCP-001',...'HCP-008')
GROUP BY h.name
HAVING total_funding > 0 AND clinical_activity > 0;`,
    dataPoints: [
      { label: "张伟 - 基金 450 万 / 活跃度 92", value: 450, hcpId: "HCP-001" },
      { label: "王芳 - 基金 380 万 / 活跃度 85", value: 380, hcpId: "HCP-003" },
      { label: "陈强 - 基金 320 万 / 活跃度 78", value: 320, hcpId: "HCP-004" },
    ],
  },
};

// Default result for custom queries
export const defaultMockResult: AnalysisResult = {
  id: "result-custom",
  title: "自定义分析结果",
  summary:
    "洞察：基于您的查询，系统已完成数据挖掘分析。当前列表专家在所查询维度上呈现明显的分层特征，建议结合详细数据进一步深入分析。",
  chartType: "bar",
  chartData: [
    { name: "张伟", value: 85 },
    { name: "李明", value: 72 },
    { name: "王芳", value: 90 },
    { name: "陈强", value: 68 },
    { name: "刘洋", value: 55 },
    { name: "赵敏", value: 78 },
    { name: "孙立", value: 42 },
    { name: "周婷", value: 61 },
  ],
  insights: [
    "王芳教授在该维度表现最为突出，综合评分 90",
    "张伟教授紧随其后，综合评分 85",
    "建议对评分 70+ 的专家进行重点跟进",
  ],
  generatedCode: `-- AI 生成的查询代码
SELECT h.name, computed_metric as value
FROM hcp h
JOIN analytics a ON h.id = a.hcp_id
WHERE h.id IN (selected_hcp_ids)
ORDER BY value DESC;`,
  dataPoints: [
    { label: "王芳 - 综合评分", value: 90, hcpId: "HCP-003" },
    { label: "张伟 - 综合评分", value: 85, hcpId: "HCP-001" },
  ],
};
