/**
 * 标签管理 - 数据模型与 Mock 数据
 */

export interface TagCategory {
  id: string;
  label: string;
  color?: string; // HSL color for this category's tags
  children?: TagCategory[];
}

export type TagProductionMethod = "业务规则" | "AI模型";
export type TagUpdateMethod = "手动更新" | "定时更新";
export type TagUpdateCycle = "每日" | "每周" | "每月" | "每季度";
export type TagStatus = "计算成功" | "待计算" | "计算中" | "计算失败";

export interface ConditionItem {
  table: string;
  field: string;
  operator: string;
  value: string;
}

/** 数据表-字段映射：来自HCP主数据和业务数据的所有表 */
export interface TableFieldDef {
  table: string;
  label: string;
  fields: { name: string; label: string }[];
}

export const tableFieldMapping: TableFieldDef[] = [
  {
    table: "hcp_profiles",
    label: "HCP主数据",
    fields: [
      { name: "name", label: "姓名" },
      { name: "gender", label: "性别" },
      { name: "province", label: "省份" },
      { name: "city", label: "城市" },
      { name: "institution", label: "机构名称" },
      { name: "hospital_category", label: "医院分类" },
      { name: "professional_title", label: "专业头衔" },
      { name: "admin_title", label: "行政头衔" },
      { name: "supervisor_title", label: "导师头衔" },
      { name: "standard_department", label: "标准科室" },
      { name: "raw_department", label: "原始科室" },
      { name: "education", label: "学历" },
      { name: "expertise", label: "擅长领域" },
      { name: "other_institutions", label: "其他机构" },
    ],
  },
  {
    table: "hcp_publications",
    label: "学术论文",
    fields: [
      { name: "title", label: "论文标题" },
      { name: "journal", label: "期刊名称" },
      { name: "impact_factor", label: "影响因子" },
      { name: "citations", label: "引用次数" },
      { name: "published_date", label: "发表日期" },
      { name: "authors", label: "作者列表" },
      { name: "doi", label: "DOI" },
    ],
  },
  {
    table: "hcp_guidelines",
    label: "临床指南",
    fields: [
      { name: "title", label: "指南名称" },
      { name: "organization", label: "发布机构" },
      { name: "role", label: "参与角色" },
      { name: "status", label: "指南状态" },
      { name: "year", label: "发布年份" },
    ],
  },
  {
    table: "hcp_trials",
    label: "临床试验",
    fields: [
      { name: "title", label: "试验名称" },
      { name: "phase", label: "试验阶段" },
      { name: "status", label: "试验状态" },
      { name: "role", label: "参与角色" },
      { name: "start_date", label: "开始日期" },
      { name: "end_date", label: "结束日期" },
      { name: "registration_id", label: "登记号" },
    ],
  },
  {
    table: "hcp_grants",
    label: "基金项目",
    fields: [
      { name: "title", label: "基金名称" },
      { name: "amount", label: "基金金额" },
      { name: "funding_body", label: "资助机构" },
      { name: "role", label: "参与角色" },
      { name: "status", label: "基金状态" },
      { name: "period", label: "资助周期" },
    ],
  },
  {
    table: "hcp_conferences",
    label: "会议",
    fields: [
      { name: "name", label: "会议名称" },
      { name: "role", label: "参会角色" },
      { name: "topic", label: "演讲主题" },
      { name: "location", label: "会议地点" },
      { name: "conference_date", label: "会议日期" },
    ],
  },
  {
    table: "hcp_research_areas",
    label: "学会",
    fields: [
      { name: "name", label: "学会/领域名称" },
      { name: "area_type", label: "类型" },
      { name: "level", label: "级别" },
      { name: "company", label: "关联企业" },
    ],
  },
  {
    table: "hcp_news",
    label: "新闻",
    fields: [
      { name: "title", label: "新闻标题" },
      { name: "source", label: "来源" },
      { name: "published_date", label: "发布日期" },
      { name: "summary", label: "摘要内容" },
    ],
  },
  {
    table: "hcp_activities",
    label: "拜访记录",
    fields: [
      { name: "title", label: "活动标题" },
      { name: "activity_type", label: "活动类型" },
      { name: "activity_date", label: "活动日期" },
    ],
  },
];

export interface ConditionGroup {
  connector: "AND" | "OR";
  conditions: ConditionItem[];
}

export interface TagField {
  name: string;
  description: string;
  conditionGroups: ConditionGroup[];
  /** connector between groups */
  groupConnector: "AND" | "OR";
}

export interface TagDef {
  id: string;
  tagId: string;
  name: string;
  categoryId: string;
  productionMethod: TagProductionMethod;
  updateMethod: TagUpdateMethod;
  updateCycle?: TagUpdateCycle;
  status: TagStatus;
  creator: string;
  createdAt: string;
  updatedAt: string;
  fields: TagField[];
  /** linked dataset id */
  datasetId?: string;
}

/** Tag category color mapping - used across HCPList and TagManagement */
export const tagCategoryColors: Record<string, { bg: string; text: string; border: string }> = {
  // DB tag categories (legacy)
  "学术维度": { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/25" },
  "属性维度": { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/25" },
  "行为维度": { bg: "bg-violet-500/15", text: "text-violet-600", border: "border-violet-500/25" },
  "行为": { bg: "bg-violet-500/15", text: "text-violet-600", border: "border-violet-500/25" },
  // Tag management categories
  "basic": { bg: "bg-sky-500/15", text: "text-sky-600", border: "border-sky-500/25" },
  "basic-demo": { bg: "bg-sky-500/15", text: "text-sky-600", border: "border-sky-500/25" },
  "basic-prof": { bg: "bg-cyan-500/15", text: "text-cyan-600", border: "border-cyan-500/25" },
  "behavior": { bg: "bg-amber-500/15", text: "text-amber-600", border: "border-amber-500/25" },
  "behavior-academic": { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/25" },
  "behavior-visit": { bg: "bg-orange-500/15", text: "text-orange-600", border: "border-orange-500/25" },
  "preference": { bg: "bg-pink-500/15", text: "text-pink-600", border: "border-pink-500/25" },
  "pref-channel": { bg: "bg-pink-500/15", text: "text-pink-600", border: "border-pink-500/25" },
  "pref-content": { bg: "bg-rose-500/15", text: "text-rose-600", border: "border-rose-500/25" },
  "risk": { bg: "bg-red-500/15", text: "text-red-600", border: "border-red-500/25" },
  "risk-compliance": { bg: "bg-red-500/15", text: "text-red-600", border: "border-red-500/25" },
  // DB-synced categories
  "db-academic": { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/25" },
  "db-attribute": { bg: "bg-emerald-500/15", text: "text-emerald-600", border: "border-emerald-500/25" },
  "db-behavior": { bg: "bg-violet-500/15", text: "text-violet-600", border: "border-violet-500/25" },
  // Display-name categories (used in hcp_tags.tag_category)
  "人口属性": { bg: "bg-sky-500/15", text: "text-sky-600", border: "border-sky-500/25" },
  "专业属性": { bg: "bg-cyan-500/15", text: "text-cyan-600", border: "border-cyan-500/25" },
  "学术行为": { bg: "bg-blue-500/15", text: "text-blue-600", border: "border-blue-500/25" },
  "拜访行为": { bg: "bg-orange-500/15", text: "text-orange-600", border: "border-orange-500/25" },
  "渠道偏好": { bg: "bg-pink-500/15", text: "text-pink-600", border: "border-pink-500/25" },
  "内容偏好": { bg: "bg-rose-500/15", text: "text-rose-600", border: "border-rose-500/25" },
  "合规风险": { bg: "bg-red-500/15", text: "text-red-600", border: "border-red-500/25" },
};

export function getTagCategoryColorClass(categoryId: string): string {
  const c = tagCategoryColors[categoryId];
  if (c) return `${c.bg} ${c.text} ${c.border}`;
  return "bg-primary/10 text-primary border-primary/20";
}

export const tagCategories: TagCategory[] = [
  {
    id: "basic",
    label: "基础标签",
    color: "hsl(199, 89%, 48%)",
    children: [
      { id: "basic-demo", label: "人口属性", color: "hsl(199, 89%, 48%)" },
      { id: "basic-prof", label: "专业属性", color: "hsl(187, 72%, 48%)" },
    ],
  },
  {
    id: "behavior",
    label: "行为标签",
    color: "hsl(38, 92%, 50%)",
    children: [
      { id: "behavior-academic", label: "学术行为", color: "hsl(217, 91%, 50%)" },
      { id: "behavior-visit", label: "拜访行为", color: "hsl(25, 95%, 53%)" },
    ],
  },
  {
    id: "preference",
    label: "偏好标签",
    color: "hsl(330, 81%, 60%)",
    children: [
      { id: "pref-channel", label: "渠道偏好", color: "hsl(330, 81%, 60%)" },
      { id: "pref-content", label: "内容偏好", color: "hsl(350, 89%, 60%)" },
    ],
  },
  {
    id: "risk",
    label: "风险标签",
    color: "hsl(0, 72%, 51%)",
    children: [
      { id: "risk-compliance", label: "合规风险", color: "hsl(0, 72%, 51%)" },
    ],
  },
  // DB-synced categories
  {
    id: "db-academic",
    label: "学术维度",
    color: "hsl(217, 91%, 50%)",
    children: [],
  },
  {
    id: "db-attribute",
    label: "属性维度",
    color: "hsl(160, 60%, 45%)",
    children: [],
  },
  {
    id: "db-behavior",
    label: "行为维度",
    color: "hsl(263, 70%, 50%)",
    children: [],
  },
];

/** Map DB tag_category to our category IDs */
export const dbCategoryMapping: Record<string, string> = {
  "学术维度": "db-academic",
  "属性维度": "db-attribute",
  "行为维度": "db-behavior",
  "行为": "db-behavior",
  "人口属性": "basic-demo",
  "专业属性": "basic-prof",
  "学术行为": "behavior-academic",
  "拜访行为": "behavior-visit",
  "渠道偏好": "pref-channel",
  "内容偏好": "pref-content",
  "合规风险": "risk-compliance",
};

/** Map categoryId to display label */
export const categoryIdToLabel: Record<string, string> = {
  "basic-demo": "人口属性",
  "basic-prof": "专业属性",
  "behavior-academic": "学术行为",
  "behavior-visit": "拜访行为",
  "pref-channel": "渠道偏好",
  "pref-content": "内容偏好",
  "risk-compliance": "合规风险",
  "db-academic": "学术维度",
  "db-attribute": "属性维度",
  "db-behavior": "行为维度",
};

/** Flatten categories for count display */
export function flattenCategories(cats: TagCategory[]): TagCategory[] {
  const result: TagCategory[] = [];
  for (const cat of cats) {
    result.push(cat);
    if (cat.children) result.push(...cat.children);
  }
  return result;
}

export function getCategoryLabel(catId: string): string {
  for (const cat of tagCategories) {
    if (cat.id === catId) return cat.label;
    for (const child of cat.children ?? []) {
      if (child.id === catId) return child.label;
    }
  }
  return catId;
}

export const allTags: TagDef[] = [
  // ── 基础标签 · 人口属性 ──
  {
    id: "t1", tagId: "10001", name: "城市等级", categoryId: "basic-demo",
    productionMethod: "业务规则", updateMethod: "手动更新", status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-02-10", updatedAt: "2026-03-18",
    fields: [
      {
        name: "一线城市", description: "北上广深",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "city", operator: "=", value: "北京" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "上海" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "广州" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "深圳" },
        ]}],
      },
      {
        name: "新一线城市", description: "杭州、成都、武汉等",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "city", operator: "=", value: "杭州" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "成都" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "武汉" },
          { table: "hcp_profiles", field: "city", operator: "=", value: "南京" },
        ]}],
      },
    ],
  },
  {
    id: "t2", tagId: "10002", name: "医院等级", categoryId: "basic-demo",
    productionMethod: "业务规则", updateMethod: "手动更新", status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-03-01", updatedAt: "2026-03-10",
    fields: [
      {
        name: "三甲医院", description: "医院分类为三级甲等",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "hospital_category", operator: "=", value: "三级甲等" },
        ]}],
      },
      {
        name: "三乙医院", description: "医院分类为三级乙等",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "hospital_category", operator: "=", value: "三级乙等" },
        ]}],
      },
    ],
  },

  // ── 基础标签 · 专业属性 ──
  {
    id: "t3", tagId: "10003", name: "职称级别", categoryId: "basic-prof",
    productionMethod: "业务规则", updateMethod: "手动更新", status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-02-10", updatedAt: "2026-03-15",
    fields: [
      {
        name: "主任医师", description: "专业头衔为主任医师",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "professional_title", operator: "=", value: "主任医师" },
        ]}],
      },
      {
        name: "副主任医师", description: "专业头衔为副主任医师",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "professional_title", operator: "=", value: "副主任医师" },
        ]}],
      },
    ],
  },
  {
    id: "t4", tagId: "10004", name: "科室分类", categoryId: "basic-prof",
    productionMethod: "业务规则", updateMethod: "手动更新", status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-02-10", updatedAt: "2026-03-12",
    fields: [
      {
        name: "肿瘤科", description: "标准科室为肿瘤内科或肿瘤外科",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "standard_department", operator: "包含", value: "肿瘤" },
        ]}],
      },
      {
        name: "呼吸科", description: "标准科室包含呼吸",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "standard_department", operator: "包含", value: "呼吸" },
        ]}],
      },
    ],
  },
  {
    id: "t5", tagId: "10005", name: "学历层次", categoryId: "basic-prof",
    productionMethod: "业务规则", updateMethod: "手动更新", status: "待计算",
    creator: "SYSTEM", createdAt: "2025-04-01", updatedAt: "2025-04-01",
    fields: [
      {
        name: "博士及以上", description: "学历为博士或博士后",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "education", operator: "=", value: "博士" },
          { table: "hcp_profiles", field: "education", operator: "=", value: "博士后" },
        ]}],
      },
    ],
  },

  // ── 行为标签 · 学术行为 ──
  {
    id: "t6", tagId: "10006", name: "高产发文者", categoryId: "behavior-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-05-01", updatedAt: "2026-03-01",
    fields: [
      {
        name: "高产", description: "近1年发文≥5篇且影响因子均值≥3",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: ">=", value: "2025-03-01" },
          { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "3" },
        ]}],
      },
    ],
  },
  {
    id: "t7", tagId: "10007", name: "学术影响力等级", categoryId: "behavior-academic",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每季度",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-05-01", updatedAt: "2026-03-01",
    fields: [
      {
        name: "顶级KOL", description: "高引用、多指南参与、高亲和度",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_publications", field: "citations", operator: ">=", value: "50" },
            { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "10" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_guidelines", field: "role", operator: "=", value: "主编" },
          ]},
        ],
      },
      {
        name: "潜力KOL", description: "中引用、有试验参与",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "citations", operator: ">=", value: "10" },
          { table: "hcp_trials", field: "role", operator: "=", value: "PI" },
        ]}],
      },
    ],
  },
  {
    id: "t8", tagId: "10008", name: "临床试验活跃度", categoryId: "behavior-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-06-15", updatedAt: "2026-03-15",
    fields: [
      {
        name: "活跃研究者", description: "有进行中的III期临床试验",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "status", operator: "=", value: "进行中" },
          { table: "hcp_trials", field: "phase", operator: "=", value: "III期" },
        ]}],
      },
    ],
  },
  {
    id: "t9", tagId: "10009", name: "指南制定参与度", categoryId: "behavior-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每季度",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-07-01", updatedAt: "2026-03-01",
    fields: [
      {
        name: "核心专家", description: "担任指南主编或副主编",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_guidelines", field: "role", operator: "=", value: "主编" },
          { table: "hcp_guidelines", field: "role", operator: "=", value: "副主编" },
        ]}],
      },
      {
        name: "参与专家", description: "担任编委或审稿人",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_guidelines", field: "role", operator: "=", value: "编委" },
          { table: "hcp_guidelines", field: "role", operator: "=", value: "审稿人" },
        ]}],
      },
    ],
  },

  // ── 行为标签 · 拜访行为 ──
  {
    id: "t10", tagId: "10010", name: "拜访响应度", categoryId: "behavior-visit",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每周",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-08-10", updatedAt: "2026-03-17",
    fields: [
      {
        name: "高响应", description: "近90天有≥3次拜访活动记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "拜访" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-12-18" },
        ]}],
      },
      {
        name: "低响应", description: "近90天无拜访记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "拜访" },
          { table: "hcp_activities", field: "activity_date", operator: "<", value: "2025-12-18" },
        ]}],
      },
    ],
  },
  {
    id: "t11", tagId: "10011", name: "会议参与活跃度", categoryId: "behavior-visit",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-07-20", updatedAt: "2026-03-15",
    fields: [
      {
        name: "高活跃", description: "近半年参加≥3场学术会议",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_conferences", field: "conference_date", operator: ">=", value: "2025-09-18" },
          { table: "hcp_conferences", field: "role", operator: "!=", value: "" },
        ]}],
      },
    ],
  },

  // ── 偏好标签 · 渠道偏好 ──
  {
    id: "t12", tagId: "10012", name: "触达渠道偏好", categoryId: "pref-channel",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-09-01", updatedAt: "2026-03-10",
    fields: [
      {
        name: "线上偏好", description: "近期活动中线上类型占比≥70%",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "线上会议" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-09-01" },
        ]}],
      },
      {
        name: "面访偏好", description: "近期活动中面访类型占比≥60%",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "面对面拜访" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-09-01" },
        ]}],
      },
    ],
  },

  // ── 偏好标签 · 内容偏好 ──
  {
    id: "t13", tagId: "10013", name: "学术关注领域", categoryId: "pref-content",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每季度",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-06-01", updatedAt: "2026-03-01",
    fields: [
      {
        name: "免疫治疗关注者", description: "研究领域含免疫治疗且有相关发文",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_research_areas", field: "name", operator: "包含", value: "免疫" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_publications", field: "title", operator: "包含", value: "免疫" },
          ]},
        ],
      },
      {
        name: "靶向治疗关注者", description: "研究领域含靶向治疗",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "name", operator: "包含", value: "靶向" },
        ]}],
      },
    ],
  },

  // ── 风险标签 · 合规风险 ──
  {
    id: "t14", tagId: "10014", name: "合规风险等级", categoryId: "risk-compliance",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每日",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2025-08-10", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高风险", description: "近30天有投诉类活动且基金存在竞品关联",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_activities", field: "activity_type", operator: "=", value: "投诉" },
            { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2026-02-16" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_grants", field: "funding_body", operator: "包含", value: "竞品" },
          ]},
        ],
      },
      {
        name: "中风险", description: "近90天有投诉记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "投诉" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-12-18" },
        ]}],
      },
    ],
  },
  {
    id: "t15", tagId: "10015", name: "基金利益冲突检测", categoryId: "risk-compliance",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算中",
    creator: "SYSTEM", createdAt: "2025-10-01", updatedAt: "2026-03-18",
    fields: [
      {
        name: "潜在冲突", description: "同时参与竞品企业基金和本企业基金",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_grants", field: "status", operator: "=", value: "进行中" },
          { table: "hcp_grants", field: "funding_body", operator: "包含", value: "竞品" },
        ]}],
      },
    ],
  },

  // ── DB-synced tags (学术维度) ──
  {
    id: "db-t1", tagId: "20001", name: "KOL等级", categoryId: "db-academic",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "顶级KOL", description: "高引用+指南参与+高影响因子",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_publications", field: "citations", operator: ">=", value: "50" },
            { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "10" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_guidelines", field: "role", operator: "!=", value: "" },
          ]},
        ],
      },
      {
        name: "区域KOL", description: "中等引用+省级以上会议参与",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "citations", operator: ">=", value: "10" },
          { table: "hcp_conferences", field: "role", operator: "!=", value: "" },
        ]}],
      },
      {
        name: "普通专家", description: "其他",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "citations", operator: "<", value: "10" },
        ]}],
      },
    ],
  },
  {
    id: "db-t2", tagId: "20002", name: "发表活跃度", categoryId: "db-academic",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高活跃", description: "近1年发文≥5篇",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: ">=", value: "2025-03-19" },
        ]}],
      },
      {
        name: "中活跃", description: "近1年发文2-4篇",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: ">=", value: "2025-03-19" },
        ]}],
      },
      {
        name: "低活跃", description: "近1年发文≤1篇",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: "<", value: "2025-03-19" },
        ]}],
      },
    ],
  },
  {
    id: "db-t3", tagId: "20003", name: "学术活跃度", categoryId: "db-academic",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高", description: "论文+会议+指南综合评估",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "5" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_conferences", field: "role", operator: "!=", value: "" },
          ]},
        ],
      },
      {
        name: "中", description: "有发文但影响因子一般",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "1" },
        ]}],
      },
    ],
  },
  {
    id: "db-t4", tagId: "20004", name: "临床试验参与", categoryId: "db-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "PI", description: "担任临床试验PI",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "role", operator: "=", value: "PI" },
        ]}],
      },
      {
        name: "Sub-I", description: "担任Sub-I或参与者",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "role", operator: "!=", value: "PI" },
          { table: "hcp_trials", field: "role", operator: "不为空", value: "" },
        ]}],
      },
    ],
  },
  {
    id: "db-t5", tagId: "20005", name: "指南编写", categoryId: "db-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每季度",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "主编/副主编", description: "担任指南主编或副主编",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_guidelines", field: "role", operator: "=", value: "主编" },
          { table: "hcp_guidelines", field: "role", operator: "=", value: "副主编" },
        ]}],
      },
      {
        name: "编委", description: "担任编委",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_guidelines", field: "role", operator: "=", value: "编委" },
        ]}],
      },
    ],
  },
  {
    id: "db-t6", tagId: "20006", name: "科研基金", categoryId: "db-academic",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "国家级", description: "承担国家自然科学基金等国家级项目",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_grants", field: "funding_body", operator: "包含", value: "国家" },
          { table: "hcp_grants", field: "status", operator: "=", value: "进行中" },
        ]}],
      },
      {
        name: "省部级", description: "承担省部级基金",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_grants", field: "funding_body", operator: "包含", value: "省" },
        ]}],
      },
    ],
  },

  // ── DB-synced tags (属性维度) ──
  {
    id: "db-t7", tagId: "20007", name: "所在区域", categoryId: "db-attribute",
    productionMethod: "业务规则", updateMethod: "手动更新",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "华东", description: "上海、江苏、浙江、安徽、山东",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "province", operator: "=", value: "上海" },
          { table: "hcp_profiles", field: "province", operator: "=", value: "江苏" },
          { table: "hcp_profiles", field: "province", operator: "=", value: "浙江" },
        ]}],
      },
      {
        name: "华北", description: "北京、天津、河北、山西",
        groupConnector: "OR",
        conditionGroups: [{ connector: "OR", conditions: [
          { table: "hcp_profiles", field: "province", operator: "=", value: "北京" },
          { table: "hcp_profiles", field: "province", operator: "=", value: "天津" },
          { table: "hcp_profiles", field: "province", operator: "=", value: "河北" },
        ]}],
      },
    ],
  },
  {
    id: "db-t8", tagId: "20008", name: "科室分类", categoryId: "db-attribute",
    productionMethod: "业务规则", updateMethod: "手动更新",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "肿瘤科", description: "标准科室包含肿瘤",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "standard_department", operator: "包含", value: "肿瘤" },
        ]}],
      },
      {
        name: "呼吸科", description: "标准科室包含呼吸",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "standard_department", operator: "包含", value: "呼吸" },
        ]}],
      },
    ],
  },
  {
    id: "db-t9", tagId: "20009", name: "职称级别", categoryId: "db-attribute",
    productionMethod: "业务规则", updateMethod: "手动更新",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "主任医师", description: "专业头衔为主任医师",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "professional_title", operator: "=", value: "主任医师" },
        ]}],
      },
      {
        name: "副主任医师", description: "专业头衔为副主任医师",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_profiles", field: "professional_title", operator: "=", value: "副主任医师" },
        ]}],
      },
    ],
  },

  // ── DB-synced tags (行为维度) ──
  {
    id: "db-t10", tagId: "20010", name: "合作意愿", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高意愿", description: "近半年有≥3次拜访+正面反馈",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "拜访" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-09-19" },
        ]}],
      },
      {
        name: "低意愿", description: "近半年无拜访或有拒绝记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_date", operator: "<", value: "2025-09-19" },
        ]}],
      },
    ],
  },
  {
    id: "db-t11", tagId: "20011", name: "学术潜力", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高潜力", description: "近1年论文增长显著+年龄<45岁",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: ">=", value: "2025-03-19" },
          { table: "hcp_publications", field: "impact_factor", operator: ">=", value: "3" },
        ]}],
      },
      {
        name: "中潜力", description: "有一定发文但增速一般",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_publications", field: "published_date", operator: ">=", value: "2025-03-19" },
        ]}],
      },
    ],
  },
  {
    id: "db-t12", tagId: "20012", name: "会议参与度", categoryId: "db-behavior",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高参与", description: "近半年参加≥3场会议",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_conferences", field: "conference_date", operator: ">=", value: "2025-09-19" },
        ]}],
      },
      {
        name: "低参与", description: "近半年参加≤1场会议",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_conferences", field: "conference_date", operator: "<", value: "2025-09-19" },
        ]}],
      },
    ],
  },
  {
    id: "db-t13", tagId: "20013", name: "处方倾向", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "创新药偏好", description: "研究方向含创新药/新药相关",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "name", operator: "包含", value: "创新" },
        ]}],
      },
      {
        name: "仿制药偏好", description: "研究方向不含创新药",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "name", operator: "不包含", value: "创新" },
        ]}],
      },
    ],
  },
  {
    id: "db-t14", tagId: "20014", name: "数字化偏好", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "线上活跃", description: "近期活动中线上类型占比≥60%",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "线上会议" },
          { table: "hcp_activities", field: "activity_date", operator: ">=", value: "2025-09-19" },
        ]}],
      },
      {
        name: "线下活跃", description: "近期活动中线下类型占比≥60%",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_activities", field: "activity_type", operator: "=", value: "面对面拜访" },
        ]}],
      },
    ],
  },
  {
    id: "db-t15", tagId: "20015", name: "临床观察情况", categoryId: "db-behavior",
    productionMethod: "业务规则", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "有临床观察", description: "有进行中的临床试验记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "status", operator: "=", value: "进行中" },
        ]}],
      },
      {
        name: "无临床观察", description: "无进行中试验",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "status", operator: "!=", value: "进行中" },
        ]}],
      },
    ],
  },
  {
    id: "db-t16", tagId: "20016", name: "产品认知度", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "高认知", description: "研究领域含本企业产品关键词",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "company", operator: "不为空", value: "" },
        ]}],
      },
      {
        name: "低认知", description: "无关联企业产品记录",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "company", operator: "为空", value: "" },
        ]}],
      },
    ],
  },
  {
    id: "db-t17", tagId: "20017", name: "处方习惯", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "早期采纳者", description: "参与新药III期试验的PI",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "phase", operator: "=", value: "III期" },
          { table: "hcp_trials", field: "role", operator: "=", value: "PI" },
        ]}],
      },
      {
        name: "保守型", description: "无新药试验参与",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_trials", field: "phase", operator: "为空", value: "" },
        ]}],
      },
    ],
  },
  {
    id: "db-t18", tagId: "20018", name: "用药态度", categoryId: "db-behavior",
    productionMethod: "AI模型", updateMethod: "定时更新", updateCycle: "每月",
    status: "计算成功",
    creator: "SYSTEM", createdAt: "2026-03-18", updatedAt: "2026-03-18",
    fields: [
      {
        name: "积极", description: "有创新药相关研究+高合作意愿",
        groupConnector: "AND",
        conditionGroups: [
          { connector: "AND", conditions: [
            { table: "hcp_research_areas", field: "name", operator: "包含", value: "免疫" },
          ]},
          { connector: "AND", conditions: [
            { table: "hcp_activities", field: "activity_type", operator: "=", value: "拜访" },
          ]},
        ],
      },
      {
        name: "中立", description: "无明显偏向",
        groupConnector: "AND",
        conditionGroups: [{ connector: "AND", conditions: [
          { table: "hcp_research_areas", field: "name", operator: "不为空", value: "" },
        ]}],
      },
    ],
  },
];
