import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Play, Eye, Sparkles, Edit3, Check, Trash2, Plus, ChevronRight, ChevronDown, Layers, Tag, Settings2, Users, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HCPProfile } from "@/hooks/useHCPProfiles";
import { TagRule, HCPTag, addTagToHCPs, getUniqueTagSummaries, removeTagGlobally, updateTagLabelGlobally, updateTagColorGlobally, TagSummary } from "@/data/hcpTagData";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SmartTaggingPanelProps {
  visible: boolean;
  onClose: () => void;
  filteredHCPs: HCPProfile[];
  selectedIds: Set<string>;
  onHighlight: (ids: Set<string>) => void;
}

type BooleanOp = "AND" | "OR" | "NOT";

interface RuleItem {
  dimension: TagRule["dimension"];
  key: string;
  operator?: string;
  value: string;
  /** Connector to the NEXT rule within the same group */
  ruleConnector?: BooleanOp;
}

interface RuleGroup {
  id: string;
  connector: BooleanOp; // connector to NEXT group
  rules: RuleItem[];
}

const EXAMPLE_SUGGESTIONS = [
  "将过去 2 年在 PubMed 发表过 3 篇以上 PD-L1 论文、且属于上海三甲医院的专家打上 '免疫治疗先行者' 标签",
  "标注所有博士生导师为 '学术引领者'",
  "将北京三甲医院肿瘤科主任标注为 '核心 KOL'",
];

const TAG_COLORS: HCPTag["color"][] = ["blue", "emerald", "violet", "amber", "rose"];

const DIMENSION_OPTIONS: TagRule["dimension"][] = ["学术维度", "属性维度"];

const KEY_OPTIONS: Record<string, string[]> = {
  学术维度: ["数据源", "关键词", "时间范围", "论文数量", "研究方向"],
  属性维度: ["城市", "医院等级", "导师资格", "科室", "行政头衔"],
};

const VALUE_OPTIONS: Record<string, string[]> = {
  数据源: ["PubMed", "CNKI", "万方", "Web of Science"],
  关键词: ["PD-L1", "PD-1", "CAR-T", "EGFR", "ALK", "HER2", "VEGF", "BRAF", "KRAS", "ROS1"],
  时间范围: ["近 1 年", "近 2 年", "近 3 年", "近 5 年"],
  论文数量: ["≥ 1", "≥ 2", "≥ 3", "≥ 5", "≥ 10"],
  研究方向: ["免疫治疗", "靶向治疗", "细胞治疗", "基因治疗", "放射治疗"],
  医院等级: ["三甲", "三乙", "二甲"],
  导师资格: ["博士生导师", "硕士生导师"],
  城市: ["北京", "上海", "广州", "成都", "武汉", "杭州", "南京", "济南"],
  科室: ["肿瘤科", "血液科", "呼吸科", "心内科", "神经科"],
  行政头衔: ["科主任", "副主任", "院长", "副院长"],
};
const tagColorMap: Record<HCPTag["color"], string> = {
  blue: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  emerald: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  violet: "bg-violet-500/15 text-violet-600 border-violet-500/25",
  amber: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  rose: "bg-rose-500/15 text-rose-600 border-rose-500/25",
};

const dimensionColors: Record<string, string> = {
  学术维度: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  属性维度: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  动作: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

const connectorColors: Record<BooleanOp, string> = {
  AND: "bg-primary/10 text-primary border-primary/20",
  OR: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  NOT: "bg-destructive/10 text-destructive border-destructive/20",
};

let _groupCounter = 0;
function newGroupId() {
  return `grp-${++_groupCounter}`;
}

/** Flatten groups back to TagRule[] for storage */
function flattenGroups(groups: RuleGroup[], tagLabel: string): TagRule[] {
  const out: TagRule[] = [];
  for (const g of groups) {
    for (const r of g.rules) {
      out.push({ dimension: r.dimension, key: r.key, operator: r.operator, value: r.value });
    }
  }
  out.push({ dimension: "动作", key: "新增标签", value: tagLabel });
  return out;
}

/** Match HCPs against nested group logic */
function matchGroups(groups: RuleGroup[], pool: HCPProfile[]): string[] {
  if (groups.length === 0) return [];

  return pool
    .filter((hcp) => {
      let groupResult: boolean | null = null;

      for (let gi = 0; gi < groups.length; gi++) {
        const group = groups[gi];
        // Evaluate rules within group using per-rule connectors
        let innerResult: boolean | null = null;
        for (let ri = 0; ri < group.rules.length; ri++) {
          const rule = group.rules[ri];
          const ruleMatch = matchSingleRule(hcp, rule);
          if (innerResult === null) {
            innerResult = ruleMatch;
          } else {
            const prevConnector = group.rules[ri - 1].ruleConnector || "AND";
            if (prevConnector === "AND") innerResult = innerResult && ruleMatch;
            else if (prevConnector === "OR") innerResult = innerResult || ruleMatch;
            else if (prevConnector === "NOT") innerResult = innerResult && !ruleMatch;
          }
        }
        const thisGroupResult = innerResult ?? true;

        // Combine with previous groups
        if (groupResult === null) {
          groupResult = thisGroupResult;
        } else {
          const prevConnector = groups[gi - 1].connector;
          if (prevConnector === "AND") groupResult = groupResult && thisGroupResult;
          else if (prevConnector === "OR") groupResult = groupResult || thisGroupResult;
          else if (prevConnector === "NOT") groupResult = groupResult && !thisGroupResult;
        }
      }
      return groupResult ?? false;
    })
    .map((h) => h.hcp_id);
}

function matchSingleRule(hcp: HCPProfile, rule: RuleItem): boolean {
  if (rule.dimension === "动作") return true;
  if (rule.key === "城市") return (hcp.city ?? "").includes(rule.value);
  if (rule.key === "医院等级") return (hcp.hospital_category ?? "").includes(rule.value.replace("医院", ""));
  if (rule.key === "导师资格") return hcp.supervisor_title === rule.value;
  if (rule.key === "科室") return (hcp.standard_department ?? "").includes(rule.value.replace("科", ""));
  if (rule.key === "行政头衔") return (hcp.admin_title ?? "").includes(rule.value);
  return true; // Unknown keys treated as pass
}

/** Mock NL parse – returns groups */
function mockParseCommand(
  command: string,
  pool: HCPProfile[]
): { groups: RuleGroup[]; tagLabel: string; matchedIds: string[] } {
  const rules: RuleItem[] = [];
  let tagLabel = "自定义标签";

  const labelMatch = command.match(/['""](.+?)['""]/) || command.match(/标注.*?为\s*(.+?)$/);
  if (labelMatch) tagLabel = labelMatch[1];

  if (/PubMed/i.test(command)) rules.push({ dimension: "学术维度", key: "数据源", value: "PubMed" });
  if (/PD-L1/i.test(command)) rules.push({ dimension: "学术维度", key: "关键词", value: "PD-L1" });
  const numMatch = command.match(/(\d+)\s*篇/);
  if (numMatch) rules.push({ dimension: "学术维度", key: "论文数量", operator: "≥", value: `≥ ${numMatch[1]}` });
  const yearMatch = command.match(/过去\s*(\d+)\s*年/);
  if (yearMatch) rules.push({ dimension: "学术维度", key: "时间范围", value: `近 ${yearMatch[1]} 年` });

  const cityKeywords = ["北京", "上海", "广州", "成都", "武汉", "杭州", "南京", "济南"];
  for (const city of cityKeywords) {
    if (command.includes(city)) rules.push({ dimension: "属性维度", key: "城市", value: city });
  }
  if (/三甲/.test(command)) rules.push({ dimension: "属性维度", key: "医院等级", value: "三甲" });
  if (/博士生导师/.test(command)) rules.push({ dimension: "属性维度", key: "导师资格", value: "博士生导师" });
  if (/肿瘤/.test(command)) rules.push({ dimension: "属性维度", key: "科室", value: "肿瘤科" });
  if (/主任/.test(command) && !/副主任/.test(command)) rules.push({ dimension: "属性维度", key: "行政头衔", value: "科主任" });

  // Split into groups by dimension
  const academicRules = rules.filter((r) => r.dimension === "学术维度");
  const attrRules = rules.filter((r) => r.dimension === "属性维度");

  const groups: RuleGroup[] = [];
  // Add ruleConnector: "AND" to all but last rule in each group
  const withConnectors = (items: RuleItem[]) => items.map((r, i) => i < items.length - 1 ? { ...r, ruleConnector: "AND" as BooleanOp } : r);
  if (academicRules.length > 0) {
    groups.push({ id: newGroupId(), connector: "AND", rules: withConnectors(academicRules) });
  }
  if (attrRules.length > 0) {
    groups.push({ id: newGroupId(), connector: "AND", rules: withConnectors(attrRules) });
  }
  if (groups.length === 0) {
    groups.push({ id: newGroupId(), connector: "AND", rules: [{ dimension: "属性维度", key: "城市", value: "北京" }] });
  }

  const matchedIds = matchGroups(groups, pool);
  if (matchedIds.length === 0 && rules.length <= 1) {
    return { groups, tagLabel, matchedIds: pool.slice(0, Math.min(3, pool.length)).map((h) => h.hcp_id) };
  }

  return { groups, tagLabel, matchedIds };
}

export default function SmartTaggingPanel({
  visible,
  onClose,
  filteredHCPs,
  selectedIds,
  onHighlight,
}: SmartTaggingPanelProps) {
  const [mode, setMode] = useState<"create" | "manage">("create");
  const [command, setCommand] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [groups, setGroups] = useState<RuleGroup[]>([]);
  const [tagLabel, setTagLabel] = useState("");
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [editingTagLabel, setEditingTagLabel] = useState(false);
  const [selectedColor, setSelectedColor] = useState<HCPTag["color"]>("blue");

  // Add rule state
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null);
  const [newRuleDimension, setNewRuleDimension] = useState<TagRule["dimension"]>("属性维度");
  const [newRuleKey, setNewRuleKey] = useState("");
  const [newRuleValue, setNewRuleValue] = useState("");

  // Edit rule value state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleValue, setEditRuleValue] = useState("");

  // Tag management state
  const [tagSummaries, setTagSummaries] = useState<TagSummary[]>([]);
  const [editingMgmtTagId, setEditingMgmtTagId] = useState<string | null>(null);
  const [editMgmtLabel, setEditMgmtLabel] = useState("");
  const [mgmtRefresh, setMgmtRefresh] = useState(0);
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);
  const [editingMgmtRules, setEditingMgmtRules] = useState<RuleGroup[] | null>(null);
  const [retagMatchedIds, setRetagMatchedIds] = useState<string[]>([]);

  useEffect(() => {
    if (mode === "manage") {
      setTagSummaries(getUniqueTagSummaries());
    }
  }, [mode, mgmtRefresh]);

  const targetPool =
    selectedIds.size > 0
      ? filteredHCPs.filter((h) => selectedIds.has(h.hcp_id))
      : filteredHCPs;

  const updateMatch = useCallback(
    (g: RuleGroup[]) => {
      const ids = matchGroups(g, targetPool);
      setMatchedIds(ids);
      onHighlight(new Set(ids));
    },
    [targetPool, onHighlight]
  );

  const handleParse = useCallback(() => {
    if (!command.trim()) return;
    const result = mockParseCommand(command, targetPool);
    setGroups(result.groups);
    setTagLabel(result.tagLabel);
    setMatchedIds(result.matchedIds);
    setIsParsed(true);
    setShowSuggestions(false);
    onHighlight(new Set(result.matchedIds));
  }, [command, targetPool, onHighlight]);

  // === Group operations ===
  const updateGroups = (newGroups: RuleGroup[]) => {
    setGroups(newGroups);
    updateMatch(newGroups);
  };

  const toggleGroupConnector = (groupIdx: number) => {
    const cycle: BooleanOp[] = ["AND", "OR", "NOT"];
    const updated = [...groups];
    const cur = updated[groupIdx].connector;
    updated[groupIdx] = { ...updated[groupIdx], connector: cycle[(cycle.indexOf(cur) + 1) % 3] };
    updateGroups(updated);
  };

  const toggleRuleConnector = (groupIdx: number, ruleIdx: number) => {
    const cycle: BooleanOp[] = ["AND", "OR", "NOT"];
    const updated = [...groups];
    const newRules = [...updated[groupIdx].rules];
    const cur = newRules[ruleIdx].ruleConnector || "AND";
    newRules[ruleIdx] = { ...newRules[ruleIdx], ruleConnector: cycle[(cycle.indexOf(cur) + 1) % 3] };
    updated[groupIdx] = { ...updated[groupIdx], rules: newRules };
    updateGroups(updated);
  };

  const deleteRule = (groupIdx: number, ruleIdx: number) => {
    const updated = [...groups];
    updated[groupIdx] = {
      ...updated[groupIdx],
      rules: updated[groupIdx].rules.filter((_, i) => i !== ruleIdx),
    };
    // Remove empty groups
    const filtered = updated.filter((g) => g.rules.length > 0);
    updateGroups(filtered);
  };

  const deleteGroup = (groupIdx: number) => {
    updateGroups(groups.filter((_, i) => i !== groupIdx));
  };

  const editRuleValueStart = (groupId: string, ruleIdx: number, currentValue: string) => {
    setEditingRuleId(`${groupId}-${ruleIdx}`);
    setEditRuleValue(currentValue);
  };

  const saveRuleValue = (groupIdx: number, ruleIdx: number) => {
    const updated = [...groups];
    const newRules = [...updated[groupIdx].rules];
    newRules[ruleIdx] = { ...newRules[ruleIdx], value: editRuleValue };
    updated[groupIdx] = { ...updated[groupIdx], rules: newRules };
    setEditingRuleId(null);
    updateGroups(updated);
  };

  const addRuleToGroup = (groupId: string) => {
    if (!newRuleKey || !newRuleValue) return;
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      // Set ruleConnector on previous last rule
      const prevRules = [...g.rules];
      if (prevRules.length > 0 && !prevRules[prevRules.length - 1].ruleConnector) {
        prevRules[prevRules.length - 1] = { ...prevRules[prevRules.length - 1], ruleConnector: "AND" };
      }
      return {
        ...g,
        rules: [...prevRules, { dimension: newRuleDimension, key: newRuleKey, value: newRuleValue } as RuleItem],
      };
    });
    setAddingToGroup(null);
    setNewRuleKey("");
    setNewRuleValue("");
    updateGroups(updated);
  };

  const addNewGroup = () => {
    const newGroup: RuleGroup = {
      id: newGroupId(),
      connector: "AND",
      rules: [],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setAddingToGroup(newGroup.id);
    setNewRuleDimension("属性维度");
    setNewRuleKey("");
    setNewRuleValue("");
  };


  const handleExecute = () => {
    if (matchedIds.length === 0) {
      toast.error("没有匹配的 HCP，请调整条件");
      return;
    }
    const tag: HCPTag = {
      id: `tag-${Date.now()}`,
      label: tagLabel,
      color: selectedColor,
      source: "auto",
      originCommand: command,
      rules: flattenGroups(groups, tagLabel),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addTagToHCPs(matchedIds, tag);
    toast.success(`已为 ${matchedIds.length} 位 HCP 打上「${tagLabel}」标签`);
    onHighlight(new Set());
    resetState();
    onClose();
  };

  const resetState = () => {
    setCommand("");
    setGroups([]);
    setTagLabel("");
    setMatchedIds([]);
    setIsParsed(false);
    setShowSuggestions(true);
    setEditingTagLabel(false);
    setAddingToGroup(null);
    setEditingRuleId(null);
    setSelectedColor("blue");
  };

  const handleClose = () => {
    onHighlight(new Set());
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!visible) {
      onHighlight(new Set());
      resetState();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 rounded-xl border border-primary/20 bg-primary/[0.03] overflow-hidden"
      >
        {/* Header with mode toggle */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">智能标注</span>
            <div className="flex items-center gap-0.5 ml-2 p-0.5 rounded-lg bg-muted">
              <button
                onClick={() => setMode("create")}
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  mode === "create" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="w-3 h-3" />
                创建标签
              </button>
              <button
                onClick={() => { setMode("manage"); setMgmtRefresh((v) => v + 1); }}
                className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  mode === "manage" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings2 className="w-3 h-3" />
                标签管理
                {tagSummaries.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{tagSummaries.length}</Badge>
                )}
              </button>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Create Mode ── */}
        {mode === "create" && (
          <>
            {/* Scope indicator */}
            <div className="px-5 pt-2 pb-0">
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0
                  ? `已选 ${selectedIds.size} 位 HCP`
                  : `范围：全部 ${targetPool.length} 位 HCP`}
              </span>
            </div>

            {/* NL Command Bar */}
            <div className="px-5 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
                  <Input
                    placeholder="输入自然语言指令，例如：将上海三甲医院的博士生导师标注为 '核心 KOL' ..."
                    value={command}
                    onChange={(e) => {
                      setCommand(e.target.value);
                      setIsParsed(false);
                      setShowSuggestions(e.target.value.length === 0);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleParse()}
                    className="pl-9 h-10 text-sm bg-background border-primary/20 focus-visible:ring-primary/30"
                  />
                </div>
                <Button onClick={handleParse} size="sm" className="h-10 gap-1.5 px-4">
                  <Eye className="w-3.5 h-3.5" />
                  解析预览
                </Button>
              </div>

              {showSuggestions && !command && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  <span className="text-xs text-muted-foreground mr-1 self-center">示例：</span>
                  {EXAMPLE_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCommand(s);
                        setShowSuggestions(false);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors truncate max-w-[320px]"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Logic Visualization Panel */}
            <AnimatePresence>
              {isParsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-primary/10"
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-6">
                      {/* Rules area */}
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          逻辑解析
                        </p>

                        {groups.map((group, gi) => (
                          <div key={group.id}>
                            {/* Group box */}
                            <div className="rounded-lg border border-border bg-card/50 p-3 relative group/grp">
                              {/* Group header */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                    条件组 {gi + 1}
                                  </span>
                                </div>
                                <button
                                  onClick={() => deleteGroup(gi)}
                                  className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover/grp:opacity-100 transition-opacity"
                                  title="删除条件组"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              </div>

                              {/* Rules within group */}
                              {group.rules.map((rule, ri) => {
                                const ruleEditId = `${group.id}-${ri}`;
                                const dimClass = dimensionColors[rule.dimension] || "";
                                const valOptions = VALUE_OPTIONS[rule.key] || [];
                                return (
                                  <div key={ri}>
                                    <motion.div
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: ri * 0.03 }}
                                      className="flex items-center gap-2 text-sm group/rule py-0.5"
                                    >
                                      <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${dimClass}`}>
                                        {rule.dimension}
                                      </Badge>
                                      <span className="text-muted-foreground text-xs">{rule.key}</span>
                                      {rule.operator && (
                                        <span className="text-xs font-mono text-primary">{rule.operator}</span>
                                      )}

                                      {/* Value: dropdown edit */}
                                      {editingRuleId === ruleEditId ? (
                                        <div className="flex items-center gap-1">
                                          <Select value={editRuleValue} onValueChange={(v) => setEditRuleValue(v)}>
                                            <SelectTrigger className="h-6 w-28 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {valOptions.map((v) => (
                                                <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <button
                                            onClick={() => saveRuleValue(gi, ri)}
                                            className="p-0.5 rounded hover:bg-primary/10"
                                          >
                                            <Check className="w-3 h-3 text-primary" />
                                          </button>
                                          <button
                                            onClick={() => setEditingRuleId(null)}
                                            className="p-0.5 rounded hover:bg-muted"
                                          >
                                            <X className="w-3 h-3 text-muted-foreground" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => valOptions.length > 0 && editRuleValueStart(group.id, ri, rule.value)}
                                          className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary/30 transition-colors"
                                        >
                                          <span className="text-xs font-medium text-card-foreground">{rule.value}</span>
                                          {valOptions.length > 0 && (
                                            <Edit3 className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                          )}
                                        </button>
                                      )}

                                      <button
                                        onClick={() => deleteRule(gi, ri)}
                                        className="p-0.5 rounded hover:bg-destructive/10 opacity-0 group-hover/rule:opacity-100 transition-opacity"
                                        title="删除此条件"
                                      >
                                        <Trash2 className="w-3 h-3 text-destructive" />
                                      </button>
                                    </motion.div>

                                    {/* Per-rule connector between rules */}
                                    {ri < group.rules.length - 1 && (
                                      <div className="ml-8 my-0.5">
                                        <button
                                          onClick={() => toggleRuleConnector(gi, ri)}
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${connectorColors[rule.ruleConnector || "AND"]}`}
                                          title="点击切换 AND / OR / NOT"
                                        >
                                          {rule.ruleConnector || "AND"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add rule to this group */}
                              {addingToGroup === group.id ? (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted/50 border border-border"
                                >
                                  <Select
                                    value={newRuleDimension}
                                    onValueChange={(v) => {
                                      setNewRuleDimension(v as TagRule["dimension"]);
                                      setNewRuleKey("");
                                      setNewRuleValue("");
                                    }}
                                  >
                                    <SelectTrigger className="h-7 w-24 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DIMENSION_OPTIONS.map((d) => (
                                        <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={newRuleKey}
                                    onValueChange={(v) => {
                                      setNewRuleKey(v);
                                      setNewRuleValue("");
                                    }}
                                  >
                                    <SelectTrigger className="h-7 w-24 text-xs">
                                      <SelectValue placeholder="条件" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(KEY_OPTIONS[newRuleDimension] || []).map((k) => (
                                        <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select value={newRuleValue} onValueChange={setNewRuleValue}>
                                    <SelectTrigger className="h-7 w-28 text-xs">
                                      <SelectValue placeholder="选择值" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(VALUE_OPTIONS[newRuleKey] || []).map((v) => (
                                        <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    onClick={() => addRuleToGroup(group.id)}
                                    disabled={!newRuleKey || !newRuleValue}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2"
                                    onClick={() => setAddingToGroup(null)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </motion.div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setAddingToGroup(group.id);
                                    setNewRuleDimension("属性维度");
                                    setNewRuleKey("");
                                    setNewRuleValue("");
                                  }}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-2 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  添加条件
                                </button>
                              )}
                            </div>

                            {/* Group-level connector */}
                            {gi < groups.length - 1 && (
                              <div className="flex items-center justify-center my-2">
                                <div className="h-px flex-1 bg-border" />
                                <button
                                  onClick={() => toggleGroupConnector(gi)}
                                  className={`mx-3 text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-colors ${connectorColors[groups[gi].connector]}`}
                                  title="组间连接器：点击切换 AND / OR / NOT"
                                >
                                  {groups[gi].connector}
                                </button>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add new group */}
                        <button
                          onClick={addNewGroup}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-2 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          添加条件组
                        </button>

                        {/* Action section with editable tag + color picker */}
                        <div className="mt-3 pt-2 border-t border-border/50">
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${dimensionColors["动作"]}`}>
                              动作
                            </Badge>
                            <span className="text-muted-foreground text-xs">新增标签</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />

                            {editingTagLabel ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={tagLabel}
                                  onChange={(e) => setTagLabel(e.target.value)}
                                  className="h-6 text-xs w-36 px-2"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") setEditingTagLabel(false);
                                  }}
                                  onBlur={() => setEditingTagLabel(false)}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingTagLabel(true)}
                                className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary/30 transition-colors"
                              >
                                <span className="text-xs font-medium text-card-foreground">{tagLabel}</span>
                                <Edit3 className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}

                            {/* Color picker */}
                            <div className="flex items-center gap-1 ml-2">
                              {TAG_COLORS.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setSelectedColor(c)}
                                  className={`w-4 h-4 rounded-full border-2 transition-transform ${
                                    c === selectedColor ? "scale-125 border-foreground" : "border-transparent hover:scale-110"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      c === "blue" ? "hsl(217 91% 50%)" :
                                      c === "emerald" ? "hsl(160 84% 39%)" :
                                      c === "violet" ? "hsl(263 70% 50%)" :
                                      c === "amber" ? "hsl(38 92% 50%)" :
                                      "hsl(350 89% 60%)",
                                  }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Preview Summary */}
                      <div className="shrink-0 text-center px-5 py-4 rounded-xl bg-card border border-border min-w-[160px]">
                        <div className="text-3xl font-bold font-mono text-primary">
                          {matchedIds.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">预计影响 HCP</p>
                        <div className="mt-3">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {tagLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-primary/10">
                      <Button variant="ghost" size="sm" onClick={handleClose}>
                        取消
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={handleExecute}
                        disabled={matchedIds.length === 0}
                      >
                        <Play className="w-3.5 h-3.5" />
                        确认打标（{matchedIds.length} 位）
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── Manage Mode ── */}
        {mode === "manage" && (
          <div className="px-5 py-4">
            {tagSummaries.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">暂无标签</p>
                <p className="text-xs text-muted-foreground mt-1">通过「创建标签」开始打标</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    共 {tagSummaries.length} 个标签
                  </p>
                </div>

                {tagSummaries.map((summary) => {
                  const { tag, count } = summary;
                  const isEditing = editingMgmtTagId === tag.id;
                  const isExpanded = expandedTagId === tag.id;
                  const tagColorClass = tagColorMap[tag.color] || tagColorMap.blue;
                  const hasRules = tag.rules && tag.rules.filter(r => r.dimension !== "动作").length > 0;

                  return (
                    <motion.div
                      key={tag.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors group/tag overflow-hidden"
                    >
                      {/* Main row */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        {/* Expand toggle */}
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedTagId(null);
                              setEditingMgmtRules(null);
                            } else {
                              setExpandedTagId(tag.id);
                              // Build editable groups from tag rules
                              if (hasRules) {
                                const nonActionRules = tag.rules!.filter(r => r.dimension !== "动作");
                                const academicRules = nonActionRules.filter(r => r.dimension === "学术维度");
                                const attrRules = nonActionRules.filter(r => r.dimension === "属性维度");
                                const groups: RuleGroup[] = [];
                                const withConn = (items: TagRule[]) =>
                                  items.map((r, i) => ({
                                    dimension: r.dimension,
                                    key: r.key,
                                    operator: r.operator,
                                    value: r.value,
                                    ...(i < items.length - 1 ? { ruleConnector: "AND" as BooleanOp } : {}),
                                  }));
                                if (academicRules.length > 0)
                                  groups.push({ id: newGroupId(), connector: "AND", rules: withConn(academicRules) });
                                if (attrRules.length > 0)
                                  groups.push({ id: newGroupId(), connector: "AND", rules: withConn(attrRules) });
                                setEditingMgmtRules(groups);
                                const ids = matchGroups(groups, filteredHCPs);
                                setRetagMatchedIds(ids);
                              } else {
                                setEditingMgmtRules(null);
                              }
                            }
                          }}
                          className="p-0.5 rounded hover:bg-muted transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>

                        {/* Tag label */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editMgmtLabel}
                                onChange={(e) => setEditMgmtLabel(e.target.value)}
                                className="h-7 text-xs w-40 px-2"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && editMgmtLabel.trim()) {
                                    updateTagLabelGlobally(tag.id, editMgmtLabel.trim());
                                    setEditingMgmtTagId(null);
                                    setMgmtRefresh((v) => v + 1);
                                    toast.success(`标签已重命名为「${editMgmtLabel.trim()}」`);
                                  }
                                  if (e.key === "Escape") setEditingMgmtTagId(null);
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (editMgmtLabel.trim()) {
                                    updateTagLabelGlobally(tag.id, editMgmtLabel.trim());
                                    setEditingMgmtTagId(null);
                                    setMgmtRefresh((v) => v + 1);
                                    toast.success(`标签已重命名为「${editMgmtLabel.trim()}」`);
                                  }
                                }}
                                className="p-1 rounded hover:bg-primary/10"
                              >
                                <Check className="w-3.5 h-3.5 text-primary" />
                              </button>
                              <button onClick={() => setEditingMgmtTagId(null)} className="p-1 rounded hover:bg-muted">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${tagColorClass}`}>
                              {tag.source === "auto" && <Sparkles className="w-2.5 h-2.5 mr-1" />}
                              {tag.label}
                            </span>
                          )}
                        </div>

                        {/* HCP count */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {count} 位
                        </div>

                        {/* Source badge */}
                        <Badge variant="secondary" className="text-[9px]">
                          {tag.source === "auto" ? "AI生成" : "手动"}
                        </Badge>

                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{tag.createdAt}</span>

                        {/* Color picker */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                updateTagColorGlobally(tag.id, c);
                                setMgmtRefresh((v) => v + 1);
                              }}
                              className={`w-4 h-4 rounded-full border-2 transition-transform ${
                                c === tag.color ? "scale-110 border-foreground" : "border-transparent hover:scale-110"
                              }`}
                              style={{
                                backgroundColor:
                                  c === "blue" ? "hsl(217 91% 50%)" :
                                  c === "emerald" ? "hsl(160 84% 39%)" :
                                  c === "violet" ? "hsl(263 70% 50%)" :
                                  c === "amber" ? "hsl(38 92% 50%)" :
                                  "hsl(350 89% 60%)",
                              }}
                              title={c}
                            />
                          ))}
                        </div>

                        {/* Edit + Delete */}
                        <button
                          onClick={() => { setEditingMgmtTagId(tag.id); setEditMgmtLabel(tag.label); }}
                          className="p-1 rounded hover:bg-muted opacity-0 group-hover/tag:opacity-100 transition-opacity"
                          title="重命名"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              title="删除标签"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除标签</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除标签「{tag.label}」吗？这将从 {count} 位 HCP 中移除此标签，操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  removeTagGlobally(tag.id);
                                  setMgmtRefresh((v) => v + 1);
                                  if (expandedTagId === tag.id) setExpandedTagId(null);
                                  toast.success(`已删除标签「${tag.label}」，影响 ${count} 位 HCP`);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                确认删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Expanded rules panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-border"
                          >
                            <div className="px-4 py-3 bg-muted/30">
                              {/* Original command */}
                              {tag.originCommand && (
                                <div className="mb-3">
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">原始指令</p>
                                  <p className="text-xs text-foreground/80 bg-card rounded-md px-3 py-2 border border-border italic">
                                    "{tag.originCommand}"
                                  </p>
                                </div>
                              )}

                              {hasRules && editingMgmtRules ? (
                                <>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">逻辑规则（可编辑）</p>
                                  <div className="space-y-2">
                                    {editingMgmtRules.map((group, gi) => (
                                      <div key={group.id}>
                                        <div className="rounded-lg border border-border bg-card/50 p-2.5">
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <Layers className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">条件组 {gi + 1}</span>
                                          </div>
                                          {group.rules.map((rule, ri) => {
                                            const dimClass = dimensionColors[rule.dimension] || "";
                                            const valOptions = VALUE_OPTIONS[rule.key] || [];
                                            const mgmtRuleEditId = `mgmt-${tag.id}-${gi}-${ri}`;
                                            return (
                                              <div key={ri}>
                                                <div className="flex items-center gap-2 text-sm py-0.5 group/mrule">
                                                  <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${dimClass}`}>
                                                    {rule.dimension}
                                                  </Badge>
                                                  <span className="text-muted-foreground text-xs">{rule.key}</span>
                                                  {rule.operator && <span className="text-xs font-mono text-primary">{rule.operator}</span>}

                                                  {editingRuleId === mgmtRuleEditId ? (
                                                    <div className="flex items-center gap-1">
                                                      <Select value={editRuleValue} onValueChange={setEditRuleValue}>
                                                        <SelectTrigger className="h-6 w-28 text-xs">
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {valOptions.map((v) => (
                                                            <SelectItem key={v} value={v} className="text-xs">{v}</SelectItem>
                                                          ))}
                                                        </SelectContent>
                                                      </Select>
                                                      <button
                                                        onClick={() => {
                                                          const updated = [...editingMgmtRules];
                                                          const newRules = [...updated[gi].rules];
                                                          newRules[ri] = { ...newRules[ri], value: editRuleValue };
                                                          updated[gi] = { ...updated[gi], rules: newRules };
                                                          setEditingMgmtRules(updated);
                                                          setEditingRuleId(null);
                                                          setRetagMatchedIds(matchGroups(updated, filteredHCPs));
                                                        }}
                                                        className="p-0.5 rounded hover:bg-primary/10"
                                                      >
                                                        <Check className="w-3 h-3 text-primary" />
                                                      </button>
                                                      <button onClick={() => setEditingRuleId(null)} className="p-0.5 rounded hover:bg-muted">
                                                        <X className="w-3 h-3 text-muted-foreground" />
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        if (valOptions.length > 0) {
                                                          setEditingRuleId(mgmtRuleEditId);
                                                          setEditRuleValue(rule.value);
                                                        }
                                                      }}
                                                      className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary/30 transition-colors"
                                                    >
                                                      <span className="text-xs font-medium text-card-foreground">{rule.value}</span>
                                                      {valOptions.length > 0 && (
                                                        <Edit3 className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                      )}
                                                    </button>
                                                  )}

                                                  <button
                                                    onClick={() => {
                                                      const updated = [...editingMgmtRules];
                                                      updated[gi] = { ...updated[gi], rules: updated[gi].rules.filter((_, i) => i !== ri) };
                                                      const filtered = updated.filter(g => g.rules.length > 0);
                                                      setEditingMgmtRules(filtered);
                                                      setRetagMatchedIds(matchGroups(filtered, filteredHCPs));
                                                    }}
                                                    className="p-0.5 rounded hover:bg-destructive/10 opacity-0 group-hover/mrule:opacity-100 transition-opacity"
                                                  >
                                                    <Trash2 className="w-3 h-3 text-destructive" />
                                                  </button>
                                                </div>
                                                {ri < group.rules.length - 1 && (
                                                  <div className="ml-8 my-0.5">
                                                    <button
                                                      onClick={() => {
                                                        const cycle: BooleanOp[] = ["AND", "OR", "NOT"];
                                                        const updated = [...editingMgmtRules];
                                                        const newRules = [...updated[gi].rules];
                                                        const cur = newRules[ri].ruleConnector || "AND";
                                                        newRules[ri] = { ...newRules[ri], ruleConnector: cycle[(cycle.indexOf(cur) + 1) % 3] };
                                                        updated[gi] = { ...updated[gi], rules: newRules };
                                                        setEditingMgmtRules(updated);
                                                        setRetagMatchedIds(matchGroups(updated, filteredHCPs));
                                                      }}
                                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${connectorColors[rule.ruleConnector || "AND"]}`}
                                                    >
                                                      {rule.ruleConnector || "AND"}
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {gi < editingMgmtRules.length - 1 && (
                                          <div className="flex items-center justify-center my-1.5">
                                            <div className="h-px flex-1 bg-border" />
                                            <button
                                              onClick={() => {
                                                const cycle: BooleanOp[] = ["AND", "OR", "NOT"];
                                                const updated = [...editingMgmtRules];
                                                const cur = updated[gi].connector;
                                                updated[gi] = { ...updated[gi], connector: cycle[(cycle.indexOf(cur) + 1) % 3] };
                                                setEditingMgmtRules(updated);
                                                setRetagMatchedIds(matchGroups(updated, filteredHCPs));
                                              }}
                                              className={`mx-3 text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-colors ${connectorColors[editingMgmtRules[gi].connector]}`}
                                            >
                                              {editingMgmtRules[gi].connector}
                                            </button>
                                            <div className="h-px flex-1 bg-border" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Re-tag action bar */}
                                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                                    <span className="text-xs text-muted-foreground">
                                      修改后预计匹配 <span className="font-semibold text-primary">{retagMatchedIds.length}</span> 位 HCP
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 h-7 text-xs"
                                      disabled={retagMatchedIds.length === 0 || !editingMgmtRules || editingMgmtRules.length === 0}
                                      onClick={() => {
                                        // Remove old tag globally, re-apply with new rules
                                        removeTagGlobally(tag.id);
                                        const newTag: HCPTag = {
                                          id: tag.id,
                                          label: tag.label,
                                          color: tag.color,
                                          source: "auto",
                                          originCommand: tag.originCommand,
                                          rules: flattenGroups(editingMgmtRules!, tag.label),
                                          createdAt: new Date().toISOString().slice(0, 10),
                                        };
                                        addTagToHCPs(retagMatchedIds, newTag);
                                        setExpandedTagId(null);
                                        setEditingMgmtRules(null);
                                        setMgmtRefresh((v) => v + 1);
                                        toast.success(`已重新打标「${tag.label}」，匹配 ${retagMatchedIds.length} 位 HCP`);
                                      }}
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      重新打标
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground py-2">
                                  {tag.source === "manual" ? "手动创建的标签，无逻辑规则" : "无可编辑的逻辑规则"}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
