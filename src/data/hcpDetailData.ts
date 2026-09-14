// Mock detailed data for HCP profile page tabs

export interface Publication {
  id: string;
  title: string;
  journal: string;
  date: string;
  impactFactor: number;
  citations: number;
  authors: string[];
  doi: string;
}

export interface ClinicalGuideline {
  id: string;
  title: string;
  organization: string;
  year: string;
  role: string;
  status: "已发布" | "修订中";
}

export interface ClinicalTrial {
  id: string;
  registrationId: string;
  title: string;
  phase: string;
  status: "招募中" | "进行中" | "已完成" | "终止";
  startDate: string;
  endDate: string;
  role: string;
}

export interface Grant {
  id: string;
  title: string;
  fundingBody: string;
  amount: string;
  period: string;
  status: "在研" | "结题";
  role: string;
}

export interface Conference {
  id: string;
  name: string;
  date: string;
  location: string;
  role: "主席" | "演讲嘉宾" | "壁报展示" | "参会者";
  topic: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
}

// Keyed by hcpId — fall back to generic data for unknown IDs
const publicationsMap: Record<string, Publication[]> = {
  "HCP-001": [
    { id: "p1", title: "PD-1 联合化疗在晚期 NSCLC 中的 III 期临床研究", journal: "Lancet Oncology", date: "2026-03-08", impactFactor: 51.1, citations: 42, authors: ["张伟", "李明", "王芳"], doi: "10.1016/S1470-2045(26)00123-4" },
    { id: "p2", title: "免疫检查点抑制剂耐药机制的系统综述", journal: "Nature Reviews Cancer", date: "2026-02-14", impactFactor: 78.5, citations: 128, authors: ["张伟", "陈强"], doi: "10.1038/s41568-026-0045-2" },
    { id: "p3", title: "基于 ctDNA 的微小残留病灶监测", journal: "Journal of Clinical Oncology", date: "2026-01-20", impactFactor: 45.3, citations: 67, authors: ["张伟"], doi: "10.1200/JCO.26.00456" },
    { id: "p4", title: "EGFR 突变 NSCLC 的三代 TKI 序贯策略", journal: "Annals of Oncology", date: "2025-11-05", impactFactor: 32.9, citations: 35, authors: ["张伟", "刘洋"], doi: "10.1016/j.annonc.2025.09.012" },
    { id: "p5", title: "肿瘤微环境中 T 细胞耗竭的分子机制", journal: "Cell", date: "2025-08-22", impactFactor: 64.5, citations: 203, authors: ["张伟", "赵敏", "孙立"], doi: "10.1016/j.cell.2025.07.034" },
  ],
};

const guidelinesMap: Record<string, ClinicalGuideline[]> = {
  "HCP-001": [
    { id: "g1", title: "CSCO 非小细胞肺癌诊疗指南 (2026版)", organization: "CSCO", year: "2026", role: "执笔专家", status: "已发布" },
    { id: "g2", title: "NCCN 非小细胞肺癌指南中文版", organization: "NCCN/CSCO", year: "2026", role: "审校专家", status: "已发布" },
    { id: "g3", title: "免疫检查点抑制剂相关不良反应管理共识", organization: "中国抗癌协会", year: "2025", role: "主要起草人", status: "已发布" },
    { id: "g4", title: "晚期驱动基因阳性NSCLC治疗专家共识", organization: "CSCO", year: "2026", role: "核心专家", status: "修订中" },
  ],
};

const trialsMap: Record<string, ClinicalTrial[]> = {
  "HCP-001": [
    { id: "t1", registrationId: "NCT05678901", title: "PD-1 联合 CTLA-4 对比 PD-1 单药一线治疗晚期 NSCLC", phase: "III期", status: "招募中", startDate: "2025-06", endDate: "2028-12", role: "主要研究者(PI)" },
    { id: "t2", registrationId: "NCT05432100", title: "新型 ADC 药物治疗 EGFR-TKI 耐药 NSCLC", phase: "II期", status: "进行中", startDate: "2024-09", endDate: "2027-03", role: "主要研究者(PI)" },
    { id: "t3", registrationId: "NCT04987654", title: "ctDNA 指导下的围手术期免疫治疗", phase: "II期", status: "进行中", startDate: "2024-03", endDate: "2026-09", role: "协作PI" },
    { id: "t4", registrationId: "NCT04321098", title: "PD-L1 单抗联合化疗治疗小细胞肺癌", phase: "III期", status: "已完成", startDate: "2022-01", endDate: "2025-06", role: "主要研究者(PI)" },
  ],
};

const grantsMap: Record<string, Grant[]> = {
  "HCP-001": [
    { id: "f1", title: "PD-1 联合治疗耐药机制及生物标志物研究", fundingBody: "国家自然科学基金（重点项目）", amount: "300万元", period: "2024-2028", status: "在研", role: "项目负责人" },
    { id: "f2", title: "基于 ctDNA 的肺癌精准免疫治疗策略", fundingBody: "科技部重点研发计划", amount: "500万元", period: "2023-2027", status: "在研", role: "课题负责人" },
    { id: "f3", title: "肿瘤免疫微环境动态演变研究", fundingBody: "国家自然科学基金（面上项目）", amount: "58万元", period: "2021-2024", status: "结题", role: "项目负责人" },
  ],
};

const conferencesMap: Record<string, Conference[]> = {
  "HCP-001": [
    { id: "c1", name: "ASCO 2026 年会", date: "2026-06-02", location: "芝加哥, 美国", role: "演讲嘉宾", topic: "PD-1 联合治疗 NSCLC 的最新数据" },
    { id: "c2", name: "CSCO 2026 学术年会", date: "2026-09-20", location: "厦门, 中国", role: "主席", topic: "肺癌免疫治疗专场" },
    { id: "c3", name: "ESMO 2025", date: "2025-10-15", location: "巴塞罗那, 西班牙", role: "壁报展示", topic: "ctDNA 监测在免疫治疗中的应用" },
    { id: "c4", name: "WCLC 2025", date: "2025-09-08", location: "新加坡", role: "演讲嘉宾", topic: "EGFR 突变 NSCLC 的免疫治疗进展" },
  ],
};

const newsMap: Record<string, NewsItem[]> = {
  "HCP-001": [
    { id: "n1", title: "张伟教授团队发现 PD-1 耐药新靶点，成果登上 Nature Reviews Cancer", source: "医学界", date: "2026-02-15", summary: "北京协和医院张伟教授团队在免疫治疗耐药领域取得重大突破，相关论文已被 Nature Reviews Cancer 接收发表。", url: "#" },
    { id: "n2", title: "CSCO 2026 肺癌指南更新要点解读", source: "肿瘤资讯", date: "2026-01-28", summary: "张伟教授作为指南执笔专家，在新闻发布会上详细解读了2026版CSCO非小细胞肺癌诊疗指南的主要更新内容。", url: "#" },
    { id: "n3", title: "北京协和医院牵头全国多中心临床研究启动", source: "健康报", date: "2025-12-10", summary: "由张伟教授担任主要研究者的一项全国多中心III期临床试验正式启动，预计入组800例患者。", url: "#" },
    { id: "n4", title: "张伟教授荣获中国抗癌协会年度杰出科学家奖", source: "人民日报", date: "2025-11-22", summary: "在第28届全国临床肿瘤学大会上，张伟教授因在肺癌免疫治疗领域的卓越贡献获此殊荣。", url: "#" },
  ],
};

// Generic fallback data
const defaultPublications: Publication[] = [
  { id: "dp1", title: "肿瘤免疫治疗的进展与挑战", journal: "中华医学杂志", date: "2025-06-15", impactFactor: 3.2, citations: 8, authors: ["—"], doi: "—" },
];
const defaultGuidelines: ClinicalGuideline[] = [];
const defaultTrials: ClinicalTrial[] = [];
const defaultGrants: Grant[] = [];
const defaultConferences: Conference[] = [];
const defaultNews: NewsItem[] = [];

export function getPublications(hcpId: string): Publication[] {
  return publicationsMap[hcpId] ?? defaultPublications;
}
export function getGuidelines(hcpId: string): ClinicalGuideline[] {
  return guidelinesMap[hcpId] ?? defaultGuidelines;
}
export function getTrials(hcpId: string): ClinicalTrial[] {
  return trialsMap[hcpId] ?? defaultTrials;
}
export function getGrants(hcpId: string): Grant[] {
  return grantsMap[hcpId] ?? defaultGrants;
}
export function getConferences(hcpId: string): Conference[] {
  return conferencesMap[hcpId] ?? defaultConferences;
}
export function getNews(hcpId: string): NewsItem[] {
  return newsMap[hcpId] ?? defaultNews;
}

// ─── Research Areas (研究领域) ──────────────────────────────
export interface ResearchArea {
  diseases: { name: string; level: "核心" | "扩展" }[];
  drugs: { name: string; type: "在研" | "已上市"; company?: string }[];
}

const researchAreasMap: Record<string, ResearchArea> = {
  "HCP-001": {
    diseases: [
      { name: "非小细胞肺癌 (NSCLC)", level: "核心" },
      { name: "小细胞肺癌 (SCLC)", level: "扩展" },
      { name: "肺癌脑转移", level: "扩展" },
    ],
    drugs: [
      { name: "帕博利珠单抗 (Keytruda)", type: "已上市", company: "默沙东" },
      { name: "纳武利尤单抗 (Opdivo)", type: "已上市", company: "百时美施贵宝" },
      { name: "奥希替尼 (Tagrisso)", type: "已上市", company: "阿斯利康" },
      { name: "IBI310 (CTLA-4)", type: "在研", company: "信达生物" },
    ],
  },
};

const defaultResearchArea: ResearchArea = { diseases: [], drugs: [] };

export function getResearchAreas(hcpId: string): ResearchArea {
  return researchAreasMap[hcpId] ?? defaultResearchArea;
}

// ─── Recent Activities (近期动态) ──────────────────────────
export interface RecentActivity {
  id: string;
  date: string;
  type: "论文" | "会议" | "试验" | "媒体";
  title: string;
}

const activitiesMap: Record<string, RecentActivity[]> = {
  "HCP-001": [
    { id: "a1", date: "2026-03-08", type: "论文", title: "在 Lancet Oncology 发表 PD-1 联合化疗 III 期研究" },
    { id: "a2", date: "2026-02-15", type: "媒体", title: "接受《医学界》采访，解读 PD-1 耐药新靶点发现" },
    { id: "a3", date: "2026-01-28", type: "会议", title: "CSCO 指南发布会主题演讲" },
  ],
};

export function getRecentActivities(hcpId: string): RecentActivity[] {
  return activitiesMap[hcpId] ?? [];
}

// ─── Relationship Network (关系网) ──────────────────────────
export interface HCPRelation {
  hcpId: string;
  name: string;
  institution: string;
  department: string;
  relation: "合作发表" | "共同PI" | "师生关系" | "同机构" | "学会同事";
  strength: number; // 1-5
}

const relationsMap: Record<string, HCPRelation[]> = {
  "HCP-001": [
    { hcpId: "HCP-002", name: "李明", institution: "上海中山医院", department: "血液内科", relation: "合作发表", strength: 4 },
    { hcpId: "HCP-003", name: "王芳", institution: "广州南方医院", department: "呼吸与危重症医学科", relation: "共同PI", strength: 5 },
    { hcpId: "HCP-004", name: "陈强", institution: "四川华西医院", department: "消化内科", relation: "学会同事", strength: 3 },
    { hcpId: "HCP-005", name: "刘洋", institution: "武汉同济医院", department: "风湿免疫科", relation: "合作发表", strength: 3 },
    { hcpId: "HCP-006", name: "赵敏", institution: "浙江大学附属第一医院", department: "乳腺外科", relation: "学会同事", strength: 2 },
  ],
};

export function getRelations(hcpId: string): HCPRelation[] {
  return relationsMap[hcpId] ?? [];
}
