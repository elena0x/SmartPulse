export interface HCPRecord {
  hcpId: string;
  name: string;
  province: string;
  city: string;
  institution: string;
  gender: "男" | "女";
  professionalTitle: string;
  rawDepartment: string;
  standardDepartment: string;
  adminTitle: string;
  education: string;
  supervisorTitle: string;
  resume: string;
  expertise: string;
  hospitalCategory: string;
  officialWebsite: string;
  otherInstitutions: string;
}

// Initial seed data
const initialHcpList: HCPRecord[] = [
  {
    hcpId: "HCP-001",
    name: "张伟",
    province: "北京",
    city: "北京",
    institution: "北京协和医院",
    gender: "男",
    professionalTitle: "主任医师/教授",
    rawDepartment: "肿瘤内科",
    standardDepartment: "肿瘤科",
    adminTitle: "科主任",
    education: "博士",
    supervisorTitle: "博士生导师",
    resume: "北京大学医学部博士，哈佛大学博士后，从事肿瘤免疫治疗研究20余年",
    expertise: "肺癌免疫治疗、PD-1/PD-L1联合疗法",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.pumch.cn",
    otherInstitutions: "中国抗癌协会",
  },
  {
    hcpId: "HCP-002",
    name: "李明",
    province: "上海",
    city: "上海",
    institution: "上海中山医院",
    gender: "男",
    professionalTitle: "副主任医师/副教授",
    rawDepartment: "血液内科",
    standardDepartment: "血液科",
    adminTitle: "副科主任",
    education: "博士",
    supervisorTitle: "硕士生导师",
    resume: "复旦大学博士，专注于CAR-T细胞疗法及血液肿瘤新疗法研究",
    expertise: "CAR-T细胞疗法、淋巴瘤、白血病",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.zs-hospital.sh.cn",
    otherInstitutions: "中华医学会血液学分会",
  },
  {
    hcpId: "HCP-003",
    name: "王芳",
    province: "广东",
    city: "广州",
    institution: "广州南方医院",
    gender: "女",
    professionalTitle: "主任医师/教授",
    rawDepartment: "呼吸与危重症医学科",
    standardDepartment: "呼吸科",
    adminTitle: "科主任",
    education: "博士",
    supervisorTitle: "博士生导师",
    resume: "中山大学博士，长期从事肺部疾病及呼吸肿瘤方向临床与研究工作",
    expertise: "非小细胞肺癌、靶向治疗、指南制定",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.nfyy.com",
    otherInstitutions: "NCCN指南委员会",
  },
  {
    hcpId: "HCP-004",
    name: "陈强",
    province: "四川",
    city: "成都",
    institution: "四川华西医院",
    gender: "男",
    professionalTitle: "主任医师/教授",
    rawDepartment: "消化内科",
    standardDepartment: "消化科",
    adminTitle: "学科带头人",
    education: "博士",
    supervisorTitle: "博士生导师",
    resume: "四川大学华西医学院博士，美国MD Anderson访问学者",
    expertise: "肝癌免疫联合治疗、消化道肿瘤",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.wchscu.cn",
    otherInstitutions: "中国肝癌协作组",
  },
  {
    hcpId: "HCP-005",
    name: "刘洋",
    province: "湖北",
    city: "武汉",
    institution: "武汉同济医院",
    gender: "男",
    professionalTitle: "副主任医师",
    rawDepartment: "风湿免疫科",
    standardDepartment: "免疫科",
    adminTitle: "—",
    education: "博士",
    supervisorTitle: "硕士生导师",
    resume: "华中科技大学博士，专注于自身免疫病与免疫治疗耐药机制",
    expertise: "免疫治疗耐药、肿瘤微环境",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.tjh.com.cn",
    otherInstitutions: "—",
  },
  {
    hcpId: "HCP-006",
    name: "赵敏",
    province: "浙江",
    city: "杭州",
    institution: "浙江大学附属第一医院",
    gender: "女",
    professionalTitle: "主任医师/教授",
    rawDepartment: "乳腺外科",
    standardDepartment: "乳腺科",
    adminTitle: "院长助理",
    education: "博士",
    supervisorTitle: "博士生导师",
    resume: "浙江大学博士，英国剑桥大学访问学者，国内乳腺癌精准治疗领域专家",
    expertise: "乳腺癌精准治疗、HER2靶向治疗",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.zy91.com",
    otherInstitutions: "中国乳腺癌联盟",
  },
  {
    hcpId: "HCP-007",
    name: "孙立",
    province: "江苏",
    city: "南京",
    institution: "江苏省人民医院",
    gender: "男",
    professionalTitle: "副主任医师/副教授",
    rawDepartment: "泌尿外科",
    standardDepartment: "泌尿科",
    adminTitle: "—",
    education: "硕士",
    supervisorTitle: "—",
    resume: "南京医科大学硕士，从事泌尿肿瘤微创手术及免疫治疗临床研究",
    expertise: "泌尿肿瘤、肾癌免疫治疗",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.jsph.org.cn",
    otherInstitutions: "—",
  },
  {
    hcpId: "HCP-008",
    name: "周婷",
    province: "山东",
    city: "济南",
    institution: "山东省立医院",
    gender: "女",
    professionalTitle: "主任医师",
    rawDepartment: "妇瘤科",
    standardDepartment: "妇科肿瘤",
    adminTitle: "科副主任",
    education: "博士",
    supervisorTitle: "硕士生导师",
    resume: "山东大学博士，专注卵巢癌及子宫内膜癌的综合治疗策略研究",
    expertise: "卵巢癌、妇科肿瘤免疫治疗",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.sph.com.cn",
    otherInstitutions: "中华妇产科学会肿瘤学组",
  },
];

// Mutable subscribed list — shared across components via this module
export let hcpList: HCPRecord[] = [...initialHcpList];

// All known HCPs (the "database") for matching purposes
export const hcpDatabase: HCPRecord[] = [
  ...initialHcpList,
  // 未订阅的测试 HCP，仅存在于数据库中
  {
    hcpId: "HCP-099",
    name: "林志远",
    province: "福建",
    city: "福州",
    institution: "福建医科大学附属协和医院",
    gender: "男",
    professionalTitle: "主任医师/教授",
    rawDepartment: "肿瘤内科",
    standardDepartment: "肿瘤科",
    adminTitle: "科主任",
    education: "博士",
    supervisorTitle: "博士生导师",
    resume: "福建医科大学博士，日本东京大学访问学者，从事消化道肿瘤免疫治疗研究15年",
    expertise: "胃癌免疫治疗、消化道肿瘤靶向治疗",
    hospitalCategory: "三甲综合",
    officialWebsite: "https://www.fjxiehe.com",
    otherInstitutions: "中国临床肿瘤学会(CSCO)",
  },
];

/**
 * Subscribe new HCPs to the list. Skips duplicates by hcpId.
 * Returns { added, skipped } counts.
 */
export function subscribeHCPs(records: HCPRecord[]): { added: number; skipped: number } {
  let added = 0;
  let skipped = 0;
  const existingIds = new Set(hcpList.map((h) => h.hcpId));
  for (const rec of records) {
    if (existingIds.has(rec.hcpId)) {
      skipped++;
    } else {
      hcpList.push(rec);
      existingIds.add(rec.hcpId);
      added++;
    }
  }
  // Notify listeners
  _listeners.forEach((fn) => fn([...hcpList]));
  return { added, skipped };
}

export function isSubscribed(hcpId: string): boolean {
  return hcpList.some((h) => h.hcpId === hcpId);
}

/**
 * Unsubscribe HCPs by id. Returns count of removed items.
 */
export function unsubscribeHCPs(ids: string[]): number {
  const idSet = new Set(ids);
  const before = hcpList.length;
  hcpList = hcpList.filter((h) => !idSet.has(h.hcpId));
  const removed = before - hcpList.length;
  if (removed > 0) _listeners.forEach((fn) => fn([...hcpList]));
  return removed;
}

// Simple listener pattern so HCPList page can re-render
type Listener = (list: HCPRecord[]) => void;
const _listeners: Listener[] = [];
export function onHcpListChange(fn: Listener) {
  _listeners.push(fn);
  return () => {
    const i = _listeners.indexOf(fn);
    if (i > -1) _listeners.splice(i, 1);
  };
}
