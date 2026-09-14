import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  Search, Plus, RefreshCw, Tags, ChevronRight, Trash2, Pencil, X, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useHCPTagsAll, useInsertHCPTags } from "@/hooks/useHCPTags";
import { useQueryClient } from "@tanstack/react-query";
import {
  allTags as initialTags, tagCategories as defaultCategories, flattenCategories, getCategoryLabel,
  TagDef, TagCategory, dbCategoryMapping,
} from "@/data/tagManagementData";

/** Derive tag definitions from DB hcp_tags records */
function deriveTagDefsFromDB(dbTags: Array<{ tag_key: string; tag_value: string; tag_category: string; source: string; created_at: string; hcp_id: string }>) {
  const map = new Map<string, {
    tagKey: string;
    tagCategory: string;
    source: string;
    hcpCount: number;
    latestDate: string;
    values: Set<string>;
  }>();

  for (const t of dbTags) {
    const existing = map.get(t.tag_key);
    if (existing) {
      existing.hcpCount++;
      existing.values.add(t.tag_value);
      if (t.created_at > existing.latestDate) existing.latestDate = t.created_at;
    } else {
      map.set(t.tag_key, {
        tagKey: t.tag_key,
        tagCategory: t.tag_category,
        source: t.source,
        hcpCount: 1,
        latestDate: t.created_at,
        values: new Set([t.tag_value]),
      });
    }
  }

  return Array.from(map.values());
}

const TagManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [dirSearch, setDirSearch] = useState("");
  const [tags, setTags] = useState<TagDef[]>(initialTags);
  const [categories, setCategories] = useState<TagCategory[]>(defaultCategories);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(defaultCategories.map(c => c.id))
  );
  const [deleteTarget, setDeleteTarget] = useState<TagDef | null>(null);
  const [deleting, setDeleting] = useState(false);

  // DB tags
  const { data: dbTags = [], refetch: refetchDbTags } = useHCPTagsAll();
  const queryClient = useQueryClient();

  // Derive DB-based tag summaries
  const dbTagDefs = useMemo(() => deriveTagDefsFromDB(dbTags), [dbTags]);

  // Merge: mock tags + DB-derived tags (deduped by tagKey/name)
  const mergedTags = useMemo(() => {
    const mockTagKeys = new Set(tags.map(t => t.name));
    const dbOnlyDefs = dbTagDefs.filter(d => !mockTagKeys.has(d.tagKey));

    const dbAsTags: TagDef[] = dbOnlyDefs.map((d, i) => {
      // Map DB tag_category to categoryId
      const categoryId = dbCategoryMapping[d.tagCategory] || "db-academic";
      return {
        id: `db-${d.tagKey}`,
        tagId: `DB-${String(i + 1).padStart(3, "0")}`,
        name: d.tagKey,
        categoryId,
        productionMethod: d.source === "rule" ? "业务规则" : "AI模型",
        updateMethod: "手动更新" as const,
        status: "计算成功" as const,
        creator: d.source === "rule" ? "系统规则" : "AI引擎",
        createdAt: d.latestDate,
        updatedAt: d.latestDate,
        fields: [],
      };
    });

    return [...tags, ...dbAsTags];
  }, [tags, dbTagDefs]);

  // Custom directory state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState("");
  const [addingParent, setAddingParent] = useState(false);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [newCatLabel, setNewCatLabel] = useState("");

  // Sync search from URL params
  useEffect(() => {
    const s = searchParams.get("search");
    if (s) setSearch(s);
  }, [searchParams]);

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTags = useMemo(() => {
    let t = mergedTags;
    if (activeCatId) {
      const cat = categories.find(c => c.id === activeCatId);
      if (cat?.children) {
        const childIds = cat.children.map(c => c.id);
        t = t.filter(tag => childIds.includes(tag.categoryId) || tag.categoryId === activeCatId);
      } else {
        t = t.filter(tag => tag.categoryId === activeCatId);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      t = t.filter(tag => tag.name.toLowerCase().includes(q) || tag.tagId.toLowerCase().includes(q));
    }
    return t;
  }, [activeCatId, search, mergedTags, categories]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of mergedTags) {
      counts[tag.categoryId] = (counts[tag.categoryId] || 0) + 1;
    }
    for (const cat of categories) {
      if (cat.children && cat.children.length > 0) {
        counts[cat.id] = cat.children.reduce((sum, c) => sum + (counts[c.id] || 0), 0);
      }
    }
    return counts;
  }, [mergedTags, categories]);

  const filteredCategories = useMemo(() => {
    if (!dirSearch) return categories;
    const q = dirSearch.toLowerCase();
    return categories.map(cat => ({
      ...cat,
      children: cat.children?.filter(c => c.label.includes(q)),
    })).filter(cat => cat.label.includes(q) || (cat.children && cat.children.length > 0));
  }, [dirSearch, categories]);

  const statusBadge = (status: string) => {
    if (status === "计算成功") return <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" />计算成功</span>;
    if (status === "待计算") return <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-primary" />待计算</span>;
    if (status === "计算中") return <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />计算中</span>;
    return <span className="inline-flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-destructive" />计算失败</span>;
  };

  // Get HCP count for a DB tag
  const getDbTagHcpCount = (tagName: string) => {
    const def = dbTagDefs.find(d => d.tagKey === tagName);
    return def?.hcpCount ?? 0;
  };

  // Delete tag - removes from both local state and DB
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete from DB via edge function
      const { data, error } = await supabase.functions.invoke("delete-tag", {
        body: { tagId: deleteTarget.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Remove from local state
      setTags(prev => prev.filter(t => t.id !== deleteTarget.id));

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["hcp_tags"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["nba_actions"] });

      toast.success(`标签「${deleteTarget.name}」已删除`);
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Refresh all data from DB
  const handleRefresh = () => {
    refetchDbTags();
    queryClient.invalidateQueries({ queryKey: ["signals"] });
    toast.success("数据已刷新");
  };

  // Custom directory operations
  const handleAddParent = () => {
    if (!newCatLabel.trim()) return;
    const id = `custom-${Date.now()}`;
    setCategories(prev => [...prev, { id, label: newCatLabel.trim(), children: [] }]);
    setExpandedCats(prev => new Set([...prev, id]));
    setNewCatLabel("");
    setAddingParent(false);
    toast.success("目录已添加");
  };

  const handleAddChild = (parentId: string) => {
    if (!newCatLabel.trim()) return;
    const id = `${parentId}-${Date.now()}`;
    setCategories(prev => prev.map(cat =>
      cat.id === parentId
        ? { ...cat, children: [...(cat.children || []), { id, label: newCatLabel.trim() }] }
        : cat
    ));
    setNewCatLabel("");
    setAddingChildTo(null);
    toast.success("子目录已添加");
  };

  const handleRenameCat = (catId: string) => {
    if (!editingCatLabel.trim()) return;
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) return { ...cat, label: editingCatLabel.trim() };
      if (cat.children) {
        return { ...cat, children: cat.children.map(c => c.id === catId ? { ...c, label: editingCatLabel.trim() } : c) };
      }
      return cat;
    }));
    setEditingCatId(null);
    setEditingCatLabel("");
  };

  const handleDeleteCat = (catId: string) => {
    const hasTags = mergedTags.some(t => t.categoryId === catId);
    if (hasTags) { toast.error("该目录下有标签，无法删除"); return; }
    setCategories(prev => prev
      .map(cat => ({ ...cat, children: cat.children?.filter(c => c.id !== catId) }))
      .filter(cat => cat.id !== catId)
    );
    if (activeCatId === catId) setActiveCatId(null);
    toast.success("目录已删除");
  };

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">标签管理</h1>
          <p className="text-sm text-muted-foreground mt-1">定义和管理HCP标签，支持业务规则和AI模型生产标签</p>
        </div>

        <div className="flex gap-6">
          {/* Left sidebar - tag directory */}
          <div className="w-56 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">标签目录</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAddingParent(true); setNewCatLabel(""); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="搜索标签目录" value={dirSearch} onChange={e => setDirSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>

            {addingParent && (
              <div className="flex items-center gap-1 px-1">
                <Input
                  value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)}
                  placeholder="输入目录名称" className="h-7 text-xs flex-1"
                  autoFocus onKeyDown={e => e.key === "Enter" && handleAddParent()}
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={handleAddParent}><Check className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingParent(false)}><X className="w-3 h-3" /></Button>
              </div>
            )}

            <div className="space-y-0.5">
              <button
                onClick={() => setActiveCatId(null)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeCatId === null ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "text-foreground hover:bg-muted"
                }`}
              >
                全部({mergedTags.length})
              </button>
              {filteredCategories.map(cat => (
                <div key={cat.id}>
                  <div className="flex items-center group">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-1 flex-1 px-1">
                        <Input value={editingCatLabel} onChange={e => setEditingCatLabel(e.target.value)} className="h-7 text-xs flex-1" autoFocus onKeyDown={e => e.key === "Enter" && handleRenameCat(cat.id)} />
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => handleRenameCat(cat.id)}><Check className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingCatId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { toggleExpand(cat.id); setActiveCatId(cat.id); }}
                          className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                            activeCatId === cat.id ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <ChevronRight className={`w-3 h-3 transition-transform ${expandedCats.has(cat.id) ? "rotate-90" : ""}`} />
                            {cat.label}({catCounts[cat.id] || 0})
                          </span>
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mr-1">
                          <button className="p-0.5 hover:text-primary" onClick={() => { setAddingChildTo(cat.id); setNewCatLabel(""); }}><Plus className="w-3 h-3" /></button>
                          <button className="p-0.5 hover:text-primary" onClick={() => { setEditingCatId(cat.id); setEditingCatLabel(cat.label); }}><Pencil className="w-3 h-3" /></button>
                          <button className="p-0.5 hover:text-destructive" onClick={() => handleDeleteCat(cat.id)}><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </>
                    )}
                  </div>
                  {expandedCats.has(cat.id) && (
                    <>
                      {cat.children?.map(child => (
                        <div key={child.id} className="flex items-center group">
                          {editingCatId === child.id ? (
                            <div className="flex items-center gap-1 flex-1 pl-6 pr-1">
                              <Input value={editingCatLabel} onChange={e => setEditingCatLabel(e.target.value)} className="h-6 text-xs flex-1" autoFocus onKeyDown={e => e.key === "Enter" && handleRenameCat(child.id)} />
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => handleRenameCat(child.id)}><Check className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setEditingCatId(null)}><X className="w-3 h-3" /></Button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveCatId(child.id)}
                                className={`flex-1 text-left pl-8 pr-3 py-1.5 rounded-md text-xs transition-colors ${
                                  activeCatId === child.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                {child.label}({catCounts[child.id] || 0})
                              </button>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mr-1">
                                <button className="p-0.5 hover:text-primary" onClick={() => { setEditingCatId(child.id); setEditingCatLabel(child.label); }}><Pencil className="w-2.5 h-2.5" /></button>
                                <button className="p-0.5 hover:text-destructive" onClick={() => handleDeleteCat(child.id)}><Trash2 className="w-2.5 h-2.5" /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {addingChildTo === cat.id && (
                        <div className="flex items-center gap-1 pl-6 pr-1">
                          <Input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} placeholder="子目录名称" className="h-6 text-xs flex-1" autoFocus onKeyDown={e => e.key === "Enter" && handleAddChild(cat.id)} />
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => handleAddChild(cat.id)}><Check className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAddingChildTo(null)}><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="搜索标签名称" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh}><RefreshCw className="w-3.5 h-3.5" /></Button>
                <Button size="sm" className="gap-1.5" onClick={() => navigate("/tag-management/new")}><Plus className="w-3.5 h-3.5" /> 新建标签</Button>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs font-semibold min-w-[80px]">标签ID</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[150px]">
                      <span className="flex items-center gap-1"><Tags className="w-3 h-3" /> 标签名称</span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold min-w-[90px]">更新方式</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[80px]">覆盖HCP</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[80px]">状态</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[100px]">创建人</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[200px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map(tag => (
                    <TableRow key={tag.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="text-sm text-muted-foreground font-mono">{tag.tagId}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{tag.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tag.updateMethod}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{getDbTagHcpCount(tag.name)}</TableCell>
                      <TableCell>{statusBadge(tag.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tag.creator}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <button onClick={() => navigate(`/tag-management/${tag.id}`)} className="text-xs text-primary hover:underline">配置</button>
                          <button onClick={() => navigate(`/tag-management/${tag.id}`)} className="text-xs text-primary hover:underline">详情</button>
                          <button
                            className={`text-xs ${tag.updateMethod === "定时更新" ? "text-muted-foreground cursor-not-allowed" : "text-primary hover:underline"}`}
                            disabled={tag.updateMethod === "定时更新"}
                          >
                            更新
                          </button>
                          <button className="text-xs text-destructive hover:underline" onClick={() => setDeleteTarget(tag)}>删除</button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">暂无匹配的标签</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </motion.div>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签</AlertDialogTitle>
            <AlertDialogDescription>
              删除标签「{deleteTarget?.name}」将同时删除所有关联的HCP标签记录，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default TagManagement;
