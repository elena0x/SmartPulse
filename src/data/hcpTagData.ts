/**
 * HCP 标签数据模型 —— 支持智能标注功能
 */

export interface TagRule {
  dimension: "学术维度" | "属性维度" | "动作";
  key: string;
  operator?: string;
  value: string;
}

export interface HCPTag {
  id: string;
  label: string;
  color: "blue" | "emerald" | "violet" | "amber" | "rose";
  source: "auto" | "manual";
  /** The original NL command that generated this tag */
  originCommand?: string;
  /** Parsed logic rules for traceability */
  rules?: TagRule[];
  createdAt: string;
}

/** Summary of a unique tag across all HCPs */
export interface TagSummary {
  tag: HCPTag;
  hcpIds: string[];
  count: number;
}

// Tag store: hcpId → tags[]
const _tagStore = new Map<string, HCPTag[]>();

type TagListener = () => void;
const _tagListeners: TagListener[] = [];
function _notify() {
  _tagListeners.forEach((fn) => fn());
}

export function onTagStoreChange(fn: TagListener) {
  _tagListeners.push(fn);
  return () => {
    const i = _tagListeners.indexOf(fn);
    if (i > -1) _tagListeners.splice(i, 1);
  };
}

export function getTagsForHCP(hcpId: string): HCPTag[] {
  return _tagStore.get(hcpId) ?? [];
}

export function getAllTags(): Map<string, HCPTag[]> {
  return new Map(_tagStore);
}

/** Get all unique tags with HCP counts */
export function getUniqueTagSummaries(): TagSummary[] {
  const tagMap = new Map<string, { tag: HCPTag; hcpIds: Set<string> }>();

  for (const [hcpId, tags] of _tagStore) {
    for (const tag of tags) {
      const existing = tagMap.get(tag.id);
      if (existing) {
        existing.hcpIds.add(hcpId);
      } else {
        tagMap.set(tag.id, { tag, hcpIds: new Set([hcpId]) });
      }
    }
  }

  return Array.from(tagMap.values())
    .map((v) => ({ tag: v.tag, hcpIds: Array.from(v.hcpIds), count: v.hcpIds.size }))
    .sort((a, b) => b.count - a.count);
}

export function addTagToHCPs(hcpIds: string[], tag: HCPTag) {
  for (const id of hcpIds) {
    const existing = _tagStore.get(id) ?? [];
    // avoid duplicates by label
    if (!existing.some((t) => t.label === tag.label)) {
      _tagStore.set(id, [...existing, tag]);
    }
  }
  _notify();
}

export function removeTagFromHCP(hcpId: string, tagId: string) {
  const existing = _tagStore.get(hcpId) ?? [];
  _tagStore.set(
    hcpId,
    existing.filter((t) => t.id !== tagId)
  );
  _notify();
}

/** Remove a tag from ALL HCPs globally */
export function removeTagGlobally(tagId: string) {
  for (const [hcpId, tags] of _tagStore) {
    const filtered = tags.filter((t) => t.id !== tagId);
    if (filtered.length !== tags.length) {
      _tagStore.set(hcpId, filtered);
    }
  }
  // Clean up empty entries
  for (const [hcpId, tags] of _tagStore) {
    if (tags.length === 0) _tagStore.delete(hcpId);
  }
  _notify();
}

/** Update tag label globally */
export function updateTagLabelGlobally(tagId: string, newLabel: string) {
  for (const [, tags] of _tagStore) {
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].id === tagId) {
        tags[i] = { ...tags[i], label: newLabel };
      }
    }
  }
  _notify();
}

/** Update tag color globally */
export function updateTagColorGlobally(tagId: string, newColor: HCPTag["color"]) {
  for (const [, tags] of _tagStore) {
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].id === tagId) {
        tags[i] = { ...tags[i], color: newColor };
      }
    }
  }
  _notify();
}

/** Add a manual tag to specific HCPs */
export function addManualTag(hcpIds: string[], label: string, color: HCPTag["color"]) {
  const tag: HCPTag = {
    id: `tag-manual-${Date.now()}`,
    label,
    color,
    source: "manual",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  addTagToHCPs(hcpIds, tag);
  return tag;
}

// Pre-populate some demo tags
addTagToHCPs(["HCP-001", "HCP-003"], {
  id: "tag-demo-1",
  label: "免疫治疗先行者",
  color: "blue",
  source: "auto",
  originCommand:
    "将过去 2 年在 PubMed 发表过 3 篇以上 PD-L1 论文、且属于三甲医院的专家打上 '免疫治疗先行者' 标签",
  rules: [
    { dimension: "学术维度", key: "数据源", value: "PubMed" },
    { dimension: "学术维度", key: "关键词", value: "PD-L1" },
    { dimension: "学术维度", key: "时间范围", value: "2024-03-11 至 2026-03-11" },
    { dimension: "学术维度", key: "论文数量", operator: "≥", value: "3" },
    { dimension: "属性维度", key: "医院等级", value: "三甲" },
    { dimension: "动作", key: "新增标签", value: "免疫治疗先行者" },
  ],
  createdAt: "2026-03-10",
});

addTagToHCPs(["HCP-002"], {
  id: "tag-demo-2",
  label: "CAR-T 研究者",
  color: "violet",
  source: "auto",
  originCommand: "标注参与 CAR-T 临床试验的血液科专家",
  rules: [
    { dimension: "学术维度", key: "研究方向", value: "CAR-T" },
    { dimension: "属性维度", key: "科室", value: "血液科" },
    { dimension: "动作", key: "新增标签", value: "CAR-T 研究者" },
  ],
  createdAt: "2026-03-08",
});

addTagToHCPs(["HCP-001", "HCP-004"], {
  id: "tag-demo-3",
  label: "核心 KOL",
  color: "amber",
  source: "manual",
  createdAt: "2026-03-05",
});

addTagToHCPs(["HCP-003", "HCP-006"], {
  id: "tag-demo-4",
  label: "指南制定者",
  color: "emerald",
  source: "auto",
  originCommand: "标注参与临床指南修订的专家为 '指南制定者'",
  rules: [
    { dimension: "学术维度", key: "研究方向", value: "指南" },
    { dimension: "动作", key: "新增标签", value: "指南制定者" },
  ],
  createdAt: "2026-03-01",
});

addTagToHCPs(["HCP-005", "HCP-007", "HCP-008"], {
  id: "tag-demo-5",
  label: "潜力新星",
  color: "rose",
  source: "auto",
  originCommand: "标注近1年论文数量增长显著的中青年专家",
  rules: [
    { dimension: "学术维度", key: "时间范围", value: "近 1 年" },
    { dimension: "学术维度", key: "论文数量", operator: "≥", value: "≥ 2" },
    { dimension: "动作", key: "新增标签", value: "潜力新星" },
  ],
  createdAt: "2026-02-28",
});
