/**
 * 数据集管理 - 数据集定义
 */

import {
  BookOpen, FileText, FlaskConical, Coins, Calendar, Users2, Newspaper,
  Database, ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DatasetType = "事实数据" | "维度数据";
export type DatasetStatus = "已完成" | "待接入" | "待映射";
export type DataSourceType = "系统数据集" | "上传Excel" | "API";
export type FieldDataType = "TEXT" | "INTEGER" | "FLOAT" | "DATE" | "BOOLEAN" | "ARRAY" | "UUID";

export interface DataFieldDef {
  name: string;
  labelCn: string;
  dataType: FieldDataType;
  description: string;
  required: boolean;
  primaryKey: boolean;
}

export interface DataTableDef {
  key: string;
  label: string;
  columns: { key: string; label: string; width?: number }[];
  data: Record<string, string | number>[];
}

export interface OneIdMappingConfig {
  hcp?: { enabled: boolean; fields: string[] };
  drug?: { enabled: boolean; fields: string[] };
  disease?: { enabled: boolean; fields: string[] };
}

export interface DatasetDef {
  id: string;
  nameCn: string;
  nameEn: string;
  icon: LucideIcon;
  dataType: DatasetType;
  description: string;
  status: DatasetStatus;
  createdAt: string;
  isSystem: boolean;
  sourceType: DataSourceType;
  oneIdMapping?: OneIdMappingConfig;
  fieldDefs: DataFieldDef[];
  tables?: DataTableDef[];
}

/* ── Helper to build system dataset field defs ── */
const sysFields = {
  papers: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "title", labelCn: "论文标题", dataType: "TEXT" as FieldDataType, description: "论文标题", required: true, primaryKey: false },
    { name: "journal", labelCn: "期刊", dataType: "TEXT" as FieldDataType, description: "期刊名称", required: true, primaryKey: false },
    { name: "published_date", labelCn: "发表日期", dataType: "DATE" as FieldDataType, description: "论文发表日期", required: false, primaryKey: false },
    { name: "impact_factor", labelCn: "影响因子", dataType: "FLOAT" as FieldDataType, description: "期刊影响因子", required: false, primaryKey: false },
    { name: "citations", labelCn: "引用次数", dataType: "INTEGER" as FieldDataType, description: "被引用次数", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  guidelines: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "title", labelCn: "指南名称", dataType: "TEXT" as FieldDataType, description: "指南标题", required: true, primaryKey: false },
    { name: "organization", labelCn: "发布机构", dataType: "TEXT" as FieldDataType, description: "指南发布机构", required: false, primaryKey: false },
    { name: "year", labelCn: "年份", dataType: "TEXT" as FieldDataType, description: "发布年份", required: false, primaryKey: false },
    { name: "role", labelCn: "参与角色", dataType: "TEXT" as FieldDataType, description: "专家参与角色", required: false, primaryKey: false },
    { name: "status", labelCn: "状态", dataType: "TEXT" as FieldDataType, description: "指南状态", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  trials: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "title", labelCn: "试验标题", dataType: "TEXT" as FieldDataType, description: "临床试验标题", required: true, primaryKey: false },
    { name: "registration_id", labelCn: "登记号", dataType: "TEXT" as FieldDataType, description: "试验登记号", required: false, primaryKey: false },
    { name: "phase", labelCn: "分期", dataType: "TEXT" as FieldDataType, description: "试验阶段", required: false, primaryKey: false },
    { name: "status", labelCn: "状态", dataType: "TEXT" as FieldDataType, description: "试验状态", required: false, primaryKey: false },
    { name: "start_date", labelCn: "开始日期", dataType: "TEXT" as FieldDataType, description: "试验开始日期", required: false, primaryKey: false },
    { name: "end_date", labelCn: "结束日期", dataType: "TEXT" as FieldDataType, description: "试验结束日期", required: false, primaryKey: false },
    { name: "role", labelCn: "角色", dataType: "TEXT" as FieldDataType, description: "参与角色", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  grants: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "title", labelCn: "项目名称", dataType: "TEXT" as FieldDataType, description: "基金项目名称", required: true, primaryKey: false },
    { name: "funding_body", labelCn: "资助来源", dataType: "TEXT" as FieldDataType, description: "资助机构", required: false, primaryKey: false },
    { name: "amount", labelCn: "金额", dataType: "TEXT" as FieldDataType, description: "资助金额", required: false, primaryKey: false },
    { name: "period", labelCn: "周期", dataType: "TEXT" as FieldDataType, description: "资助周期", required: false, primaryKey: false },
    { name: "status", labelCn: "状态", dataType: "TEXT" as FieldDataType, description: "项目状态", required: false, primaryKey: false },
    { name: "role", labelCn: "角色", dataType: "TEXT" as FieldDataType, description: "参与角色", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  conferences: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "name", labelCn: "会议名称", dataType: "TEXT" as FieldDataType, description: "学术会议名称", required: true, primaryKey: false },
    { name: "topic", labelCn: "报告主题", dataType: "TEXT" as FieldDataType, description: "演讲主题", required: false, primaryKey: false },
    { name: "role", labelCn: "参与角色", dataType: "TEXT" as FieldDataType, description: "参会角色", required: false, primaryKey: false },
    { name: "location", labelCn: "地点", dataType: "TEXT" as FieldDataType, description: "会议地点", required: false, primaryKey: false },
    { name: "conference_date", labelCn: "日期", dataType: "DATE" as FieldDataType, description: "会议日期", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  societies: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "name", labelCn: "学会名称", dataType: "TEXT" as FieldDataType, description: "学会/组织名称", required: true, primaryKey: false },
    { name: "area_type", labelCn: "类型", dataType: "TEXT" as FieldDataType, description: "领域类型", required: true, primaryKey: false },
    { name: "level", labelCn: "级别", dataType: "TEXT" as FieldDataType, description: "组织级别", required: false, primaryKey: false },
    { name: "company", labelCn: "关联企业", dataType: "TEXT" as FieldDataType, description: "关联企业", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  news: [
    { name: "hcp_id", labelCn: "HCP ID", dataType: "TEXT" as FieldDataType, description: "专家唯一标识", required: true, primaryKey: false },
    { name: "title", labelCn: "新闻标题", dataType: "TEXT" as FieldDataType, description: "新闻标题", required: true, primaryKey: false },
    { name: "source", labelCn: "来源", dataType: "TEXT" as FieldDataType, description: "新闻来源", required: false, primaryKey: false },
    { name: "published_date", labelCn: "发布日期", dataType: "DATE" as FieldDataType, description: "发布日期", required: false, primaryKey: false },
    { name: "summary", labelCn: "摘要", dataType: "TEXT" as FieldDataType, description: "新闻摘要", required: false, primaryKey: false },
    { name: "id", labelCn: "主键ID", dataType: "UUID" as FieldDataType, description: "记录唯一标识", required: true, primaryKey: true },
  ],
  visits: [
    { name: "visit_id", labelCn: "拜访ID", dataType: "TEXT" as FieldDataType, description: "拜访记录唯一标识", required: true, primaryKey: true },
    { name: "rep_name", labelCn: "代表姓名", dataType: "TEXT" as FieldDataType, description: "医药代表姓名", required: true, primaryKey: false },
    { name: "hcp_name", labelCn: "拜访医生", dataType: "TEXT" as FieldDataType, description: "被拜访的医生姓名", required: true, primaryKey: false },
    { name: "hcp_id", labelCn: "医生ID", dataType: "TEXT" as FieldDataType, description: "医生原始ID（待映射）", required: false, primaryKey: false },
    { name: "hospital", labelCn: "医院", dataType: "TEXT" as FieldDataType, description: "拜访医院名称", required: false, primaryKey: false },
    { name: "department", labelCn: "科室", dataType: "TEXT" as FieldDataType, description: "拜访科室", required: false, primaryKey: false },
    { name: "visit_date", labelCn: "拜访日期", dataType: "DATE" as FieldDataType, description: "拜访日期", required: true, primaryKey: false },
    { name: "visit_type", labelCn: "拜访类型", dataType: "TEXT" as FieldDataType, description: "拜访类型：面访/远程/会议", required: false, primaryKey: false },
    { name: "product", labelCn: "推广产品", dataType: "TEXT" as FieldDataType, description: "本次推广的产品名称", required: false, primaryKey: false },
    { name: "disease_area", labelCn: "疾病领域", dataType: "TEXT" as FieldDataType, description: "涉及的疾病领域", required: false, primaryKey: false },
    { name: "duration_min", labelCn: "拜访时长(分钟)", dataType: "INTEGER" as FieldDataType, description: "拜访时长，单位分钟", required: false, primaryKey: false },
    { name: "key_message", labelCn: "核心信息", dataType: "TEXT" as FieldDataType, description: "传递的核心信息", required: false, primaryKey: false },
    { name: "feedback", labelCn: "反馈", dataType: "TEXT" as FieldDataType, description: "医生反馈", required: false, primaryKey: false },
    { name: "next_action", labelCn: "下一步行动", dataType: "TEXT" as FieldDataType, description: "计划的下一步行动", required: false, primaryKey: false },
  ],
};

/* ── Mock visit record data ── */
const visitMockData: Record<string, string | number>[] = [
  { visit_id: "V20260301001", rep_name: "张明", hcp_name: "王教授", hcp_id: "DOC-10032", hospital: "北京协和医院", department: "肿瘤内科", visit_date: "2026-03-01", visit_type: "面访", product: "安罗替尼", disease_area: "非小细胞肺癌", duration_min: 30, key_message: "三线治疗PFS显著延长", feedback: "对III期数据感兴趣", next_action: "发送最新文献" },
  { visit_id: "V20260301002", rep_name: "李芳", hcp_name: "陈主任", hcp_id: "DOC-10088", hospital: "上海中山医院", department: "消化内科", visit_date: "2026-03-01", visit_type: "远程", product: "瑞戈非尼", disease_area: "结直肠癌", duration_min: 20, key_message: "二线治疗OS获益", feedback: "已在部分患者中使用", next_action: "安排科室会" },
  { visit_id: "V20260302001", rep_name: "张明", hcp_name: "刘副主任", hcp_id: "DOC-10045", hospital: "北京大学人民医院", department: "呼吸科", visit_date: "2026-03-02", visit_type: "面访", product: "奥希替尼", disease_area: "EGFR突变NSCLC", duration_min: 45, key_message: "一线治疗CNS转移疗效", feedback: "关注脑转移数据", next_action: "邀请参加学术沙龙" },
  { visit_id: "V20260303001", rep_name: "王丽", hcp_name: "赵教授", hcp_id: "DOC-10120", hospital: "广州中山大学附属第一医院", department: "血液科", visit_date: "2026-03-03", visit_type: "会议", product: "伊布替尼", disease_area: "慢性淋巴细胞白血病", duration_min: 60, key_message: "一线联合方案优势", feedback: "希望看到真实世界数据", next_action: "提供RWE报告" },
  { visit_id: "V20260304001", rep_name: "李芳", hcp_name: "孙主任", hcp_id: "DOC-10076", hospital: "浙江大学医学院附属第一医院", department: "肝胆外科", visit_date: "2026-03-04", visit_type: "面访", product: "仑伐替尼", disease_area: "肝细胞癌", duration_min: 35, key_message: "联合免疫治疗ORR提升", feedback: "已开始使用联合方案", next_action: "跟进患者用药情况" },
  { visit_id: "V20260305001", rep_name: "张明", hcp_name: "周教授", hcp_id: "DOC-10155", hospital: "四川大学华西医院", department: "乳腺外科", visit_date: "2026-03-05", visit_type: "远程", product: "哌柏西利", disease_area: "HR+/HER2-乳腺癌", duration_min: 25, key_message: "CDK4/6抑制剂一线数据", feedback: "对比其他CDK4/6抑制剂", next_action: "准备对比文献" },
  { visit_id: "V20260306001", rep_name: "王丽", hcp_name: "吴主任", hcp_id: "DOC-10201", hospital: "南京鼓楼医院", department: "风湿免疫科", visit_date: "2026-03-06", visit_type: "面访", product: "托法替布", disease_area: "类风湿关节炎", duration_min: 40, key_message: "口服JAK抑制剂便利性", feedback: "关注长期安全性", next_action: "分享5年安全性数据" },
  { visit_id: "V20260307001", rep_name: "李芳", hcp_name: "郑副教授", hcp_id: "DOC-10089", hospital: "武汉同济医院", department: "神经内科", visit_date: "2026-03-07", visit_type: "面访", product: "艾美达唑仑", disease_area: "癫痫", duration_min: 30, key_message: "难治性癫痫附加治疗", feedback: "愿意尝试新方案", next_action: "安排患者入组" },
  { visit_id: "V20260308001", rep_name: "张明", hcp_name: "黄主任", hcp_id: "DOC-10033", hospital: "中国医学科学院肿瘤医院", department: "胸外科", visit_date: "2026-03-08", visit_type: "会议", product: "帕博利珠单抗", disease_area: "食管鳞癌", duration_min: 50, key_message: "新辅助治疗pCR率", feedback: "计划开展investigator study", next_action: "对接医学部支持" },
  { visit_id: "V20260310001", rep_name: "王丽", hcp_name: "林教授", hcp_id: "DOC-10178", hospital: "复旦大学附属华山医院", department: "皮肤科", visit_date: "2026-03-10", visit_type: "远程", product: "度普利尤单抗", disease_area: "特应性皮炎", duration_min: 20, key_message: "中重度AD长期控制", feedback: "门诊处方量增加", next_action: "邀请参加KOL圆桌会" },
  { visit_id: "V20260311001", rep_name: "李芳", hcp_name: "杨主任", hcp_id: "DOC-10099", hospital: "天津医科大学总医院", department: "泌尿外科", visit_date: "2026-03-11", visit_type: "面访", product: "恩扎卢胺", disease_area: "前列腺癌", duration_min: 35, key_message: "mCRPC全程管理", feedback: "希望了解联合PARP数据", next_action: "发送联合方案摘要" },
  { visit_id: "V20260312001", rep_name: "张明", hcp_name: "何副主任", hcp_id: "DOC-10210", hospital: "西安交通大学第一附属医院", department: "内分泌科", visit_date: "2026-03-12", visit_type: "面访", product: "司美格鲁肽", disease_area: "2型糖尿病", duration_min: 30, key_message: "心血管获益证据", feedback: "已在高风险患者中处方", next_action: "跟进CV outcome数据" },
];

export const allDatasets: DatasetDef[] = [
  {
    id: "papers", nameCn: "学术论文", nameEn: "Academic Papers", icon: BookOpen,
    dataType: "事实数据", description: "覆盖PubMed、万方等主流数据库的学术论文数据",
    status: "已完成", createdAt: "2025-01-15", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.papers,
    tables: [{
      key: "papers_main", label: "论文数据",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "title_cn", label: "论文标题", width: 250 }, { key: "journal", label: "期刊", width: 120 },
        { key: "pub_date", label: "发表日期", width: 100 }, { key: "impact_factor", label: "影响因子", width: 80 },
        { key: "citations", label: "引用次数", width: 80 },
      ], data: [],
    }],
  },
  {
    id: "guidelines", nameCn: "临床指南", nameEn: "Clinical Guidelines", icon: FileText,
    dataType: "事实数据", description: "国内外权威临床诊疗指南和专家共识",
    status: "已完成", createdAt: "2025-02-20", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.guidelines,
    tables: [{
      key: "guidelines_main", label: "指南列表",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "guideline_title", label: "指南名称", width: 250 }, { key: "organization", label: "发布机构", width: 150 },
        { key: "year", label: "年份", width: 80 }, { key: "role", label: "参与角色", width: 80 },
        { key: "status", label: "状态", width: 80 },
      ], data: [],
    }],
  },
  {
    id: "trials", nameCn: "临床试验", nameEn: "Clinical Trials", icon: FlaskConical,
    dataType: "事实数据", description: "CDE、ClinicalTrials.gov等注册的临床试验数据",
    status: "已完成", createdAt: "2025-03-10", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.trials,
    tables: [{
      key: "trials_main", label: "试验列表",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "registration_id", label: "登记号", width: 120 }, { key: "trial_title_cn", label: "试验标题", width: 250 },
        { key: "phase", label: "分期", width: 60 }, { key: "status", label: "状态", width: 80 },
        { key: "start_date", label: "开始日期", width: 100 }, { key: "end_date", label: "结束日期", width: 100 },
        { key: "role", label: "角色", width: 80 },
      ], data: [],
    }],
  },
  {
    id: "grants", nameCn: "基金项目", nameEn: "Research Grants", icon: Coins,
    dataType: "事实数据", description: "国家自然科学基金、科技部重点研发等科研基金数据",
    status: "已完成", createdAt: "2025-04-05", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.grants,
    tables: [{
      key: "grants_main", label: "基金列表",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "project_title", label: "项目名称", width: 250 }, { key: "fund_source", label: "资助来源", width: 120 },
        { key: "amount", label: "金额", width: 80 }, { key: "period", label: "周期", width: 100 },
        { key: "status", label: "状态", width: 80 }, { key: "role", label: "角色", width: 80 },
      ], data: [],
    }],
  },
  {
    id: "conferences", nameCn: "会议", nameEn: "Conferences", icon: Calendar,
    dataType: "事实数据", description: "ASCO、CSCO等国内外重要学术会议及参会记录",
    status: "已完成", createdAt: "2025-05-15", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.conferences,
    tables: [{
      key: "conferences_main", label: "会议记录",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "conference_name", label: "会议名称", width: 200 }, { key: "topic", label: "报告主题", width: 200 },
        { key: "role", label: "参与角色", width: 100 }, { key: "location", label: "地点", width: 100 },
        { key: "date", label: "日期", width: 100 },
      ], data: [],
    }],
  },
  {
    id: "societies", nameCn: "学会", nameEn: "Societies", icon: Users2,
    dataType: "事实数据", description: "医学学会、协会等学术组织的任职和成员信息",
    status: "已完成", createdAt: "2025-06-20", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.societies,
    tables: [{
      key: "societies_main", label: "任职信息",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "hcp_name", width: 80 },
        { key: "society_name", label: "学会名称", width: 200 }, { key: "position", label: "职务", width: 120 },
        { key: "level", label: "级别", width: 80 }, { key: "join_date", label: "加入时间", width: 100 },
      ], data: [],
    }],
  },
  {
    id: "news", nameCn: "新闻", nameEn: "News", icon: Newspaper,
    dataType: "事实数据", description: "健康报、医学界等权威媒体的行业新闻数据",
    status: "已完成", createdAt: "2025-07-10", isSystem: true,
    sourceType: "系统数据集",
    oneIdMapping: { hcp: { enabled: true, fields: ["hcp_id"] } },
    fieldDefs: sysFields.news,
    tables: [{
      key: "news_main", label: "新闻列表",
      columns: [
        { key: "hcp_id", label: "hcp_id", width: 80 }, { key: "hcp_name", label: "专家姓名", width: 80 },
        { key: "headline", label: "新闻标题", width: 250 }, { key: "source", label: "来源", width: 120 },
        { key: "pub_date", label: "发布日期", width: 100 }, { key: "summary", label: "摘要", width: 200 },
      ], data: [],
    }],
  },
  {
    id: "visit-records", nameCn: "拜访记录", nameEn: "Visit Records", icon: ClipboardList,
    dataType: "事实数据", description: "医药代表拜访记录数据集，含拜访详情、推广产品和医生反馈",
    status: "待映射", createdAt: "2026-03-05", isSystem: false,
    sourceType: "上传Excel",
    fieldDefs: sysFields.visits,
    tables: [{
      key: "visits_main", label: "拜访记录",
      columns: [
        { key: "visit_id", label: "拜访ID", width: 110 },
        { key: "rep_name", label: "代表姓名", width: 70 },
        { key: "hcp_name", label: "拜访医生", width: 80 },
        { key: "hospital", label: "医院", width: 180 },
        { key: "department", label: "科室", width: 80 },
        { key: "visit_date", label: "拜访日期", width: 100 },
        { key: "visit_type", label: "类型", width: 60 },
        { key: "product", label: "推广产品", width: 100 },
        { key: "disease_area", label: "疾病领域", width: 120 },
        { key: "duration_min", label: "时长(分)", width: 70 },
        { key: "key_message", label: "核心信息", width: 180 },
        { key: "feedback", label: "反馈", width: 160 },
        { key: "next_action", label: "下一步行动", width: 140 },
      ],
      data: visitMockData,
    }],
  },
];
