import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import HCPDataImport from "@/components/hcp/HCPDataImport";
import { useHCPProfiles, HCPProfile } from "@/hooks/useHCPProfiles";
import { useUserSubscriptions, useAddSubscriptions, useRemoveSubscriptions } from "@/hooks/useUserSubscriptions";
import { useHCPTagsAll, DBTag } from "@/hooks/useHCPTags";
import SmartMiningPanel from "@/components/hcp/SmartMiningPanel";
import SmartMiningResults from "@/components/hcp/SmartMiningResults";
import { MiningIntent, mockAnalysisResults, defaultMockResult, AnalysisResult } from "@/data/miningMockData";
import { mockHCPScores, HCPScore, ScoringDimension, computeScores } from "@/data/scoringModelData";
import { generateNBAActions, writeNBAActions } from "@/hooks/useNBARules";
import { getTagCategoryColorClass, allTags as tagDefinitions, tableFieldMapping } from "@/data/tagManagementData";
import ScoringModelDrawer from "@/components/hcp/ScoringModelDrawer";
import ScoreDetailPopover from "@/components/hcp/ScoreDetailPopover";
import { motion } from "framer-motion";
import {
  Users, Search, ChevronLeft, ChevronRight, Trash2, Sparkles, Brain,
  TrendingUp, TrendingDown, Minus, BarChart3, Clock, ChevronDown as ChevronDownIcon,
  UserPlus, Tags, Star,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, subDays, isAfter } from "date-fns";

const PAGE_SIZE = 10;

/** Check if a DB tag was created recently (within 7 days) */
const isNewTag = (createdAt: string) => {
  try {
    return isAfter(new Date(createdAt), subDays(new Date(), 7));
  } catch {
    return false;
  }
};

const HCPList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tag = searchParams.get("tag");
    return tag ? [tag] : [];
  });
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const { data: allProfiles = [] } = useHCPProfiles();
  const { data: subscriptions = [], refetch } = useUserSubscriptions();
  const subscribedIds = useMemo(() => new Set(subscriptions.map(s => s.hcp_id)), [subscriptions]);
  const list = useMemo(() => allProfiles.filter(h => subscribedIds.has(h.hcp_id)), [allProfiles, subscribedIds]);
  const { data: dbTags = [] } = useHCPTagsAll();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [dbTraceTag, setDbTraceTag] = useState<DBTag | null>(null);
  const [dbTraceOpen, setDbTraceOpen] = useState(false);
  const [showMining, setShowMining] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [miningResult, setMiningResult] = useState<AnalysisResult | null>(null);
  const [miningResultOpen, setMiningResultOpen] = useState(false);
  const [miningQueryText, setMiningQueryText] = useState("");
  const [showScoringDrawer, setShowScoringDrawer] = useState(false);
  const [scoringActive, setScoringActive] = useState(false);
  const [scoreAppliedAt, setScoreAppliedAt] = useState(() => new Date().toLocaleString("zh-CN"));
  const [expandedTagRows, setExpandedTagRows] = useState<Set<string>>(new Set());
  const [hcpScores, setHcpScores] = useState<HCPScore[]>(mockHCPScores);
  const scoreMap = new Map(hcpScores.map((s) => [s.hcpId, s]));

  const removeSubMutation = useRemoveSubscriptions();
  const addSubMutation = useAddSubscriptions();

  // Sync tag search from URL params
  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag && !selectedTags.includes(tag)) setSelectedTags(prev => [...prev, tag]);
  }, [searchParams]);

  // Build a map of hcp_id -> DB tags
  const dbTagMap = useMemo(() => {
    const map = new Map<string, DBTag[]>();
    for (const t of dbTags) {
      const arr = map.get(t.hcp_id) ?? [];
      arr.push(t);
      map.set(t.hcp_id, arr);
    }
    return map;
  }, [dbTags]);

  // Compute new tag counts per tag_value (tags created in last 7 days)
  const newTagHcpCounts = useMemo(() => {
    const counts = new Map<string, Set<string>>();
    for (const t of dbTags) {
      if (isNewTag(t.created_at)) {
        const set = counts.get(t.tag_value) ?? new Set();
        set.add(t.hcp_id);
        counts.set(t.tag_value, set);
      }
    }
    return counts;
  }, [dbTags]);

  // Get all unique tag values for autocomplete
  const allTagValues = useMemo(() => {
    const set = new Set<string>();
    for (const t of dbTags) set.add(t.tag_value);
    return Array.from(set);
  }, [dbTags]);

  const filtered = useMemo(() => {
    let result = list.filter(
      (h) =>
        h.name.includes(search) ||
        h.hcp_id.includes(search) ||
        h.institution.includes(search) ||
        h.city.includes(search) ||
        (h.expertise ?? "").includes(search)
    );

    // Tag filter — exact match on selected tags
    if (selectedTags.length > 0) {
      result = result.filter((h) => {
        const hcpDbTags = dbTagMap.get(h.hcp_id) ?? [];
        return selectedTags.every((tag) =>
          hcpDbTags.some((t) => t.tag_value === tag || t.tag_key === tag)
        );
      });
    }

    return result;
  }, [list, search, selectedTags, dbTagMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const allPageSelected = paged.length > 0 && paged.every((h) => selectedIds.has(h.hcp_id));

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paged.forEach((h) => next.delete(h.hcp_id));
      } else {
        paged.forEach((h) => next.add(h.hcp_id));
      }
      return next;
    });
  };

  const handleUnsubscribe = async () => {
    const ids = Array.from(selectedIds);
    await removeSubMutation.mutateAsync(ids);
    setSelectedIds(new Set());
    refetch();
    toast("已退订选中的专家", {
      action: {
        label: "撤销",
        onClick: async () => {
          await addSubMutation.mutateAsync(ids);
          refetch();
          toast.success("已恢复订阅");
        },
      },
    });
  };

  const toggleTagExpand = (hcpId: string) => {
    setExpandedTagRows((prev) => {
      const next = new Set(prev);
      if (next.has(hcpId)) next.delete(hcpId);
      else next.add(hcpId);
      return next;
    });
  };

  const simulateAnalysis = (intent: MiningIntent, queryText: string) => {
    setIsAnalyzing(true);
    setMiningQueryText(queryText);
    setTimeout(() => {
      const result = mockAnalysisResults[intent.id] ?? defaultMockResult;
      setMiningResult(result);
      setMiningResultOpen(true);
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="max-w-[1400px] mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  HCP主数据
                  <span className="text-sm font-normal text-muted-foreground ml-2">({list.length})</span>
                </h1>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAddSubscription(true)}>
              <UserPlus className="w-3.5 h-3.5" /> 添加订阅
            </Button>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5">
                      <Trash2 className="w-3.5 h-3.5" /> 退订 ({selectedIds.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认退订</AlertDialogTitle>
                      <AlertDialogDescription>确定要退订选中的 {selectedIds.size} 位专家吗？</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleUnsubscribe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">确认退订</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowMining(true)}>
                <Sparkles className="w-3.5 h-3.5" /> 专家挖掘
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowScoringDrawer(true)}>
                <Brain className="w-3.5 h-3.5" /> 专家打分
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5 min-w-[160px] justify-start text-sm font-normal">
                    <Tags className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedTags.length === 0
                      ? <span className="text-muted-foreground">按标签筛选</span>
                      : <span className="truncate max-w-[120px]">{selectedTags.length} 个标签</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="搜索标签..." />
                    <CommandList>
                      <CommandEmpty>无匹配标签</CommandEmpty>
                      <CommandGroup>
                        {allTagValues.map((tv) => {
                          const isSelected = selectedTags.includes(tv);
                          return (
                            <CommandItem
                              key={tv}
                              onSelect={() => {
                                setSelectedTags(prev =>
                                  isSelected ? prev.filter(t => t !== tv) : [...prev, tv]
                                );
                                setPage(0);
                              }}
                              className="flex items-center gap-2 text-xs"
                            >
                              <Checkbox checked={isSelected} className="pointer-events-none" />
                              <span>{tv}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  {selectedTags.length > 0 && (
                    <div className="border-t border-border p-2">
                      <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => { setSelectedTags([]); setPage(0); }}>
                        清除筛选
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名/机构/城市"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-10 h-9"
                />
              </div>
            </div>
          </div>

          {/* Smart Mining Panel - opens above the table */}
          <SmartMiningPanel
            visible={showMining}
            onClose={() => setShowMining(false)}
            selectedCount={selectedIds.size}
            totalCount={list.length}
            onSelectIntent={(intent) => simulateAnalysis(intent, intent.title)}
            onSubmitQuery={(q) => simulateAnalysis({ id: "custom", category: "academic", categoryLabel: "自定义", title: q, description: q, icon: "🔍" }, q)}
            isAnalyzing={isAnalyzing}
          />

          {/* Scoring Model Drawer - opens above the table */}
          <ScoringModelDrawer
            visible={showScoringDrawer}
            onClose={() => setShowScoringDrawer(false)}
            onApply={async (dims) => {
              const newScores = computeScores(dims, hcpScores);
              setHcpScores(newScores);
              setScoringActive(true);
              setScoreAppliedAt(new Date().toLocaleString("zh-CN"));

              const nbaActions = generateNBAActions(newScores, dbTags, list);
              if (nbaActions.length > 0) {
                try {
                  await writeNBAActions(nbaActions);
                  toast.success(`已基于评分+标签自动生成 ${nbaActions.length} 条行动建议`);
                } catch (e) {
                  console.error("Failed to write NBA actions", e);
                }
              }

              toast.success("评分模型已应用，AI 评分列已更新");
            }}
          />

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10">
                    <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="text-xs font-semibold min-w-[80px]">HCP ID</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[80px]">姓名</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[70px]">地区</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[140px]">机构</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[70px]">职称</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[70px]">科室</TableHead>
                  <TableHead className="text-xs font-semibold min-w-[200px]">标签</TableHead>
                  {scoringActive && <TableHead className="text-xs font-semibold min-w-[100px]">AI 评分</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((hcp) => {
                  const hcpDbTags = dbTagMap.get(hcp.hcp_id) ?? [];
                  const isHighlighted = highlightIds.has(hcp.hcp_id);
                  const isExpanded = expandedTagRows.has(hcp.hcp_id);
                  const score = scoreMap.get(hcp.hcp_id);

                  const allTagItems = hcpDbTags.map(t => ({
                    id: t.id,
                    label: t.tag_value,
                    colorClass: getTagCategoryColorClass(t.tag_category),
                    source: t.source,
                    dbTag: t,
                    isNew: isNewTag(t.created_at),
                  }));

                  const visibleTags = isExpanded ? allTagItems : allTagItems.slice(0, 3);
                  const hiddenCount = allTagItems.length - 3;

                  return (
                    <TableRow
                      key={hcp.hcp_id}
                      className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                        isHighlighted ? "bg-primary/10 ring-1 ring-primary/30" : ""
                      }`}
                      onClick={() => navigate(`/hcp/${hcp.hcp_id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(hcp.hcp_id)}
                          onCheckedChange={() => toggleOne(hcp.hcp_id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{hcp.hcp_id}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{hcp.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{hcp.city || hcp.province}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">{hcp.institution}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{hcp.professional_title || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{hcp.standard_department || "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1 items-center">
                          {visibleTags.map((item) => (
                            <Badge
                              key={item.id}
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 cursor-pointer hover:opacity-80 ${item.colorClass} relative`}
                              onClick={() => {
                                if (item.dbTag) {
                                  setDbTraceTag(item.dbTag);
                                  setDbTraceOpen(true);
                                }
                              }}
                            >
                              {item.label}
                              {item.isNew && (
                                <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full bg-destructive" title="近7天新增" />
                              )}
                            </Badge>
                          ))}
                          {!isExpanded && hiddenCount > 0 && (
                            <button
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                              onClick={() => toggleTagExpand(hcp.hcp_id)}
                            >
                              +{hiddenCount} <ChevronDownIcon className="w-3 h-3" />
                            </button>
                          )}
                          {isExpanded && allTagItems.length > 3 && (
                            <button
                              className="text-[10px] text-muted-foreground hover:text-primary"
                              onClick={() => toggleTagExpand(hcp.hcp_id)}
                            >
                              收起
                            </button>
                          )}
                        </div>
                      </TableCell>
                      {scoringActive && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {score && (
                            <ScoreDetailPopover score={score}>
                              <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                                <span className={`text-sm font-bold ${
                                  score.totalScore >= 80 ? "text-emerald-600" :
                                  score.totalScore >= 60 ? "text-primary" :
                                  "text-muted-foreground"
                                }`}>
                                  {score.totalScore}
                                </span>
                                {score.currentRank < score.previousRank && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                                {score.currentRank > score.previousRank && <TrendingDown className="w-3 h-3 text-destructive" />}
                                {score.currentRank === score.previousRank && <Minus className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            </ScoreDetailPopover>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              共 {filtered.length} 条 · 第 {page + 1}/{totalPages} 页
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Mining Results */}
      <SmartMiningResults
        open={miningResultOpen}
        onOpenChange={setMiningResultOpen}
        result={miningResult}
        queryText={miningQueryText}
      />

      {/* DB Tag Trace Dialog */}
      <Dialog open={dbTraceOpen} onOpenChange={setDbTraceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Tags className="w-4 h-4 text-primary" />
              标签溯源
            </DialogTitle>
          </DialogHeader>
          {dbTraceTag && (() => {
            // Find matching tag definition for rules
            const tagDef = tagDefinitions.find(td => td.name === dbTraceTag.tag_key);
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={`${getTagCategoryColorClass(dbTraceTag.tag_category)}`}>
                    {dbTraceTag.tag_value}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{dbTraceTag.tag_category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {dbTraceTag.source === "rule" ? "规则生成" : dbTraceTag.source === "ai" ? "AI生成" : dbTraceTag.source}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">标签键</p>
                    <p className="text-sm font-medium text-foreground">{dbTraceTag.tag_key}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">更新时间</p>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(dbTraceTag.created_at), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">本次新增HCP数</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      {newTagHcpCounts.get(dbTraceTag.tag_value)?.size ?? 0}
                      {isNewTag(dbTraceTag.created_at) && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">生产方式</p>
                    <p className="text-sm font-medium text-foreground">{tagDef?.productionMethod ?? "-"}</p>
                  </div>
                </div>

                {/* Tag Rules - only show the matching field */}
                {tagDef && (() => {
                  const matchingField = tagDef.fields.find(f => f.name === dbTraceTag.tag_value);
                  const fieldsToShow = matchingField ? [matchingField] : [];
                  return fieldsToShow.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        逻辑规则
                      </p>
                      <div className="space-y-3">
                        {fieldsToShow.map((field, fi) => (
                          <div key={fi} className="rounded-lg border border-border p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20">
                                {field.name || `字段 ${fi + 1}`}
                              </Badge>
                              {field.description && (
                                <span className="text-[10px] text-muted-foreground">{field.description}</span>
                              )}
                            </div>
                            {field.conditionGroups.map((group, gi) => (
                              <div key={gi} className="space-y-1">
                                {gi > 0 && (
                                  <span className="text-[10px] font-mono text-primary px-2">{field.groupConnector}</span>
                                )}
                                {group.conditions.map((cond, ci) => {
                                  const tableDef = tableFieldMapping.find(t => t.table === cond.table);
                                  const fieldDef = tableDef?.fields.find(f => f.name === cond.field);
                                  return (
                                    <div key={ci} className="flex items-center gap-1.5 text-xs pl-2">
                                      {ci > 0 && <span className="text-[10px] font-mono text-muted-foreground">{group.connector}</span>}
                                      <span className="text-muted-foreground">{tableDef?.label ?? cond.table}</span>
                                      <span className="text-foreground font-medium">{fieldDef?.label ?? cond.field}</span>
                                      <span className="font-mono text-primary">{cond.operator}</span>
                                      {cond.value && (
                                        <span className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px]">{cond.value}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Subscription Sheet */}
      <Sheet open={showAddSubscription} onOpenChange={setShowAddSubscription}>
        <SheetContent className="w-[800px] sm:w-[900px] sm:max-w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>添加 HCP 订阅</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <HCPDataImport />
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default HCPList;
