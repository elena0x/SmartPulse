import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Plus, ArrowLeft, Search, Database, Trash2, Link2, Loader2, Check, X,
  Upload, PlugZap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  allDatasets as initialDatasets,
  DatasetDef, DataTableDef, DatasetType, DataFieldDef, FieldDataType, OneIdMappingConfig,
} from "@/data/businessDataMock";

const FIELD_DATA_TYPES: FieldDataType[] = ["TEXT", "INTEGER", "FLOAT", "DATE", "BOOLEAN", "ARRAY", "UUID"];

const emptyField = (): DataFieldDef => ({
  name: "", labelCn: "", dataType: "TEXT", description: "", required: false, primaryKey: false,
});

const BusinessData = () => {
  const [datasets, setDatasets] = useState<DatasetDef[]>(initialDatasets);
  const [activeDataset, setActiveDataset] = useState<DatasetDef | null>(null);
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createNameCn, setCreateNameCn] = useState("");
  const [createNameEn, setCreateNameEn] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createType, setCreateType] = useState<DatasetType>("维度数据");
  const [createFields, setCreateFields] = useState<DataFieldDef[]>([emptyField()]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DatasetDef | null>(null);

  // Detail view
  const [detailTab, setDetailTab] = useState<"records" | "fields">("records");
  const [activeTableKey, setActiveTableKey] = useState("");
  const [detailSearch, setDetailSearch] = useState("");

  // ONE ID mapping — supports all 3 types simultaneously
  const [mappingTarget, setMappingTarget] = useState<DatasetDef | null>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingHcpEnabled, setMappingHcpEnabled] = useState(false);
  const [mappingHcpFields, setMappingHcpFields] = useState<string[]>([]);
  const [mappingDrugEnabled, setMappingDrugEnabled] = useState(false);
  const [mappingDrugFields, setMappingDrugFields] = useState<string[]>([]);
  const [mappingDiseaseEnabled, setMappingDiseaseEnabled] = useState(false);
  const [mappingDiseaseFields, setMappingDiseaseFields] = useState<string[]>([]);

  // Data access dialog
  const [accessTarget, setAccessTarget] = useState<DatasetDef | null>(null);
  const [accessMethod, setAccessMethod] = useState<"API" | "上传Excel">("上传Excel");
  const [accessLoading, setAccessLoading] = useState(false);

  // ── Load real data for system datasets ──
  useEffect(() => {
    async function loadSystemData() {
      const [pubRes, trialRes, grantRes, confRes, guideRes, newsRes, profileRes] = await Promise.all([
        supabase.from("hcp_publications").select("*").order("published_date", { ascending: false }),
        supabase.from("hcp_trials").select("*").order("start_date", { ascending: false }),
        supabase.from("hcp_grants").select("*").order("period", { ascending: false }),
        supabase.from("hcp_conferences").select("*").order("conference_date", { ascending: false }),
        supabase.from("hcp_guidelines").select("*").order("year", { ascending: false }),
        supabase.from("hcp_news").select("*").order("published_date", { ascending: false }),
        supabase.from("hcp_profiles").select("hcp_id, name"),
      ]);
      const nameMap: Record<string, string> = {};
      (profileRes.data ?? []).forEach((p: any) => { nameMap[p.hcp_id] = p.name; });
      const mapName = (hcpId: string) => nameMap[hcpId] || hcpId;

      setDatasets(prev => prev.map(ds => {
        if (!ds.isSystem) return ds;
        if (ds.id === "papers" && pubRes.data) {
          const rows = pubRes.data.map((p: any) => ({
            hcp_id: p.hcp_id, hcp_name: mapName(p.hcp_id),
            title_cn: p.title, journal: p.journal,
            pub_date: p.published_date ?? "", impact_factor: p.impact_factor ?? 0,
            citations: p.citations ?? 0,
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        if (ds.id === "trials" && trialRes.data) {
          const rows = trialRes.data.map((t: any) => ({
            hcp_id: t.hcp_id, hcp_name: mapName(t.hcp_id),
            registration_id: t.registration_id ?? "", trial_title_cn: t.title,
            phase: t.phase ?? "", status: t.status ?? "",
            start_date: t.start_date ?? "", end_date: t.end_date ?? "", role: t.role ?? "",
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        if (ds.id === "grants" && grantRes.data) {
          const rows = grantRes.data.map((g: any) => ({
            hcp_id: g.hcp_id, hcp_name: mapName(g.hcp_id),
            project_title: g.title, fund_source: g.funding_body ?? "",
            amount: g.amount ?? "", period: g.period ?? "",
            status: g.status ?? "", role: g.role ?? "",
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        if (ds.id === "conferences" && confRes.data) {
          const rows = confRes.data.map((c: any) => ({
            hcp_id: c.hcp_id, hcp_name: mapName(c.hcp_id),
            conference_name: c.name, topic: c.topic ?? "",
            role: c.role ?? "", location: c.location ?? "", date: c.conference_date ?? "",
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        if (ds.id === "guidelines" && guideRes.data) {
          const rows = guideRes.data.map((g: any) => ({
            hcp_id: g.hcp_id, hcp_name: mapName(g.hcp_id),
            guideline_title: g.title, organization: g.organization ?? "",
            year: g.year ?? "", role: g.role ?? "", status: g.status ?? "",
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        if (ds.id === "news" && newsRes.data) {
          const rows = newsRes.data.map((n: any) => ({
            hcp_id: n.hcp_id, hcp_name: mapName(n.hcp_id),
            headline: n.title, source: n.source ?? "",
            pub_date: n.published_date ?? "", summary: n.summary ?? "",
          }));
          return { ...ds, tables: [{ ...ds.tables![0], data: rows }] };
        }
        return ds;
      }));
    }
    loadSystemData();
  }, []);

  // ── Create helpers ──
  const updateField = (idx: number, patch: Partial<DataFieldDef>) => {
    setCreateFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };
  const removeField = (idx: number) => setCreateFields(prev => prev.filter((_, i) => i !== idx));
  const addField = () => setCreateFields(prev => [...prev, emptyField()]);

  const resetCreateForm = () => {
    setCreateNameCn(""); setCreateNameEn(""); setCreateDesc("");
    setCreateType("维度数据"); setCreateFields([emptyField()]);
  };

  const handleCreateSubmit = () => {
    if (!createNameCn.trim()) { toast.error("请输入数据集中文名称"); return; }
    const validFields = createFields.filter(f => f.name.trim());
    if (validFields.length === 0) { toast.error("请至少定义一个字段"); return; }
    const newDs: DatasetDef = {
      id: `user-${Date.now()}`,
      nameCn: createNameCn,
      nameEn: createNameEn || createNameCn,
      icon: Database,
      dataType: createType,
      description: createDesc || `用户创建的${createType}数据集`,
      status: "待接入",
      createdAt: new Date().toISOString().slice(0, 10),
      isSystem: false,
      sourceType: "上传Excel",
      fieldDefs: validFields,
    };
    setDatasets(prev => [...prev, newDs]);
    setCreateOpen(false);
    resetCreateForm();
    toast.success(`数据集「${createNameCn}」创建成功`);
  };

  // ── Delete ──
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDatasets(prev => prev.filter(d => d.id !== deleteTarget.id));
    if (activeDataset?.id === deleteTarget.id) setActiveDataset(null);
    toast.success(`已删除「${deleteTarget.nameCn}」`);
    setDeleteTarget(null);
  };

  // ── Data access ──
  const handleDataAccess = async () => {
    if (!accessTarget) return;
    setAccessLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setDatasets(prev => prev.map(ds =>
      ds.id === accessTarget.id ? { ...ds, status: "待映射" as const, sourceType: accessMethod } : ds
    ));
    setAccessLoading(false);
    setAccessTarget(null);
    setAccessMethod("上传Excel");
    toast.success(`「${accessTarget.nameCn}」数据接入完成（${accessMethod}）`);
  };

  // ── ONE ID mapping ──
  const openMappingDialog = (ds: DatasetDef) => {
    setMappingTarget(ds);
    // Pre-fill from existing mapping config
    const m = ds.oneIdMapping;
    setMappingHcpEnabled(!!m?.hcp?.enabled);
    setMappingHcpFields(m?.hcp?.fields ?? []);
    setMappingDrugEnabled(!!m?.drug?.enabled);
    setMappingDrugFields(m?.drug?.fields ?? []);
    setMappingDiseaseEnabled(!!m?.disease?.enabled);
    setMappingDiseaseFields(m?.disease?.fields ?? []);
  };

  const handleOneIdMapping = async () => {
    if (!mappingTarget) return;
    if (!mappingHcpEnabled && !mappingDrugEnabled && !mappingDiseaseEnabled) {
      toast.error("请至少启用一种映射类型"); return;
    }
    if (mappingHcpEnabled && mappingHcpFields.length === 0) { toast.error("请选择 HCP 匹配字段"); return; }
    if (mappingDrugEnabled && mappingDrugFields.length === 0) { toast.error("请选择药品匹配字段"); return; }
    if (mappingDiseaseEnabled && mappingDiseaseFields.length === 0) { toast.error("请选择疾病匹配字段"); return; }

    setMappingLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    const config: OneIdMappingConfig = {};
    if (mappingHcpEnabled) config.hcp = { enabled: true, fields: mappingHcpFields };
    if (mappingDrugEnabled) config.drug = { enabled: true, fields: mappingDrugFields };
    if (mappingDiseaseEnabled) config.disease = { enabled: true, fields: mappingDiseaseFields };

    setDatasets(prev => prev.map(ds =>
      ds.id === mappingTarget.id
        ? { ...ds, oneIdMapping: config, status: "已完成" as const }
        : ds
    ));
    setMappingLoading(false);
    setMappingTarget(null);

    const types = [
      mappingHcpEnabled && "HCP",
      mappingDrugEnabled && "药品",
      mappingDiseaseEnabled && "疾病",
    ].filter(Boolean).join("、");
    toast.success(`「${mappingTarget.nameCn}」ONE ID 映射完成（${types}）`);
  };

  // Derive available fields for mapping from dataset fieldDefs
  const mappingFieldOptions = mappingTarget?.fieldDefs.map(f => f.name) ?? [];

  // Filter
  const filteredDatasets = datasets.filter(ds =>
    ds.nameCn.includes(search) || ds.nameEn.toLowerCase().includes(search.toLowerCase()) || ds.description.includes(search)
  );

  const statusBadge = (status: string) => {
    if (status === "已完成") return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[11px] font-medium">已完成</Badge>;
    if (status === "待映射") return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[11px] font-medium">待映射</Badge>;
    return <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-0 text-[11px] font-medium">待接入</Badge>;
  };

  const typeBadge = (type: DatasetType) => (
    <Badge variant="outline" className="text-[11px] font-medium border-border">{type}</Badge>
  );

  // Determine recommended action based on status — only one primary action
  const getActions = (ds: DatasetDef) => {
    if (ds.isSystem) return null;
    return (
      <div className="flex items-center gap-1">
        {ds.status === "待接入" && (
          <Button
            key="access" variant="outline" size="sm" className="h-7 text-xs gap-1"
            onClick={() => { setAccessTarget(ds); setAccessMethod("上传Excel"); }}
          >
            <Upload className="w-3 h-3" /> 数据接入
          </Button>
        )}
        {ds.status === "待映射" && (
          <Button
            key="mapping" variant="outline" size="sm" className="h-7 text-xs gap-1"
            onClick={() => openMappingDialog(ds)}
          >
            <Link2 className="w-3 h-3" /> ONEID映射
          </Button>
        )}
        {ds.status === "已完成" && (
          <Button
            key="mapping" variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => openMappingDialog(ds)}
          >
            <Link2 className="w-3 h-3" /> 重新映射
          </Button>
        )}
        <Button
          key="delete" variant="ghost" size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteTarget(ds)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  // ══════════════════════════════════════════
  // DETAIL VIEW - two tabs
  // ══════════════════════════════════════════
  if (activeDataset) {
    const ds = activeDataset;
    const tables = ds.tables || [];
    const currentTableKey = activeTableKey || (tables.length > 0 ? tables[0].key : "");
    const currentTable = tables.find(t => t.key === currentTableKey) || tables[0];
    const filteredRows = currentTable?.data.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(detailSearch.toLowerCase()))
    ) || [];

    return (
      <AppLayout>
        <div className="max-w-[1400px] mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setActiveDataset(null); setDetailSearch(""); setDetailTab("records"); }} className="gap-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> 返回
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">{ds.nameCn}</h1>
                  <span className="text-sm text-muted-foreground">{ds.nameEn}</span>
                  {statusBadge(ds.status)}
                </div>
                <p className="text-xs text-muted-foreground">{ds.description}</p>
              </div>
            </div>
          </div>

          {/* Two tabs */}
          <Tabs value={detailTab} onValueChange={v => setDetailTab(v as "records" | "fields")}>
            <TabsList>
              <TabsTrigger value="records" className="text-xs">数据记录</TabsTrigger>
              <TabsTrigger value="fields" className="text-xs">数据字段</TabsTrigger>
            </TabsList>

            <TabsContent value="records">
              {/* Meta info card */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl p-5 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">中文名称</p>
                    <p className="text-sm font-medium text-foreground">{ds.nameCn}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">英文名称（表名）</p>
                    <p className="text-sm font-medium text-foreground">{ds.nameEn}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">数据类型</p>
                    <p className="text-sm">{typeBadge(ds.dataType)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">数据源类型</p>
                    <Badge variant="outline" className="text-[11px]">{ds.sourceType}</Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] text-muted-foreground mb-1">描述</p>
                  <p className="text-sm text-muted-foreground">{ds.description}</p>
                </div>
              </motion.div>

              {/* Data table */}
              {tables.length > 1 && (
                <Tabs value={currentTableKey} onValueChange={setActiveTableKey} className="mb-3">
                  <TabsList>
                    {tables.map(t => <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>)}
                  </TabsList>
                </Tabs>
              )}

              <div className="flex justify-end mb-3">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="搜索数据..." value={detailSearch} onChange={e => setDetailSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                </div>
              </div>

              {currentTable ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/60">
                          {currentTable.columns.map(col => (
                            <TableHead key={col.key} className="text-xs font-semibold whitespace-nowrap" style={col.width ? { minWidth: col.width } : undefined}>
                              {col.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row, i) => (
                          <TableRow key={i} className="hover:bg-primary/5 transition-colors">
                            {currentTable.columns.map(col => (
                              <TableCell key={col.key} className="text-xs text-muted-foreground whitespace-normal max-w-[280px]">
                                <span className="line-clamp-3">{row[col.key] ?? "-"}</span>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {filteredRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={currentTable.columns.length} className="text-center text-sm text-muted-foreground py-12">暂无数据</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">共 {filteredRows.length} 条数据</p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-20 text-muted-foreground text-sm">该数据集暂无数据记录</div>
              )}
            </TabsContent>

            <TabsContent value="fields">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="text-xs font-semibold min-w-[120px]">字段名</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[100px]">中文名称</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[80px]">数据类型</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[180px]">字段描述</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[60px]">是否必填</TableHead>
                      <TableHead className="text-xs font-semibold min-w-[60px]">是否主键</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ds.fieldDefs.map((f, i) => (
                      <TableRow key={i} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="text-xs font-mono text-foreground">{f.name}</TableCell>
                        <TableCell className="text-xs text-foreground">{f.labelCn}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{f.dataType}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.description}</TableCell>
                        <TableCell>{f.required ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-muted-foreground/40" />}</TableCell>
                        <TableCell>{f.primaryKey ? <Check className="w-3.5 h-3.5 text-primary" /> : <X className="w-3.5 h-3.5 text-muted-foreground/40" />}</TableCell>
                      </TableRow>
                    ))}
                    {ds.fieldDefs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">暂无字段定义</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground">共 {ds.fieldDefs.length} 个字段</p>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // ══════════════════════════════════════════
  // MAIN LIST VIEW
  // ══════════════════════════════════════════
  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">业务数据</h1>
          <p className="text-sm text-muted-foreground mt-1">管理数据集，支持新建数据集、数据接入和 ONE ID 映射</p>
        </div>

        {/* 3-step workflow */}
        <div className="card-elevated rounded-xl px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[
              { step: "01", title: "新建数据集", desc: "定义数据字段信息" },
              { step: "02", title: "数据接入", desc: "映射数据源并选择接入方式" },
              { step: "03", title: "ONEID映射", desc: "定义ID关联策略" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center">
                {idx > 0 && <div className="w-12 lg:w-20 h-px bg-border mx-3" />}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold shrink-0">
                    {item.step}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Create */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="搜索数据集..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>
          <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> 新建数据集
          </Button>
        </div>

        {/* Dataset table — no ONE ID column */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-elevated rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-semibold min-w-[120px]">数据集中文名称</TableHead>
                <TableHead className="text-xs font-semibold min-w-[150px]">数据集英文名称</TableHead>
                <TableHead className="text-xs font-semibold min-w-[90px]">数据类型</TableHead>
                <TableHead className="text-xs font-semibold min-w-[200px]">描述</TableHead>
                <TableHead className="text-xs font-semibold min-w-[80px]">状态</TableHead>
                <TableHead className="text-xs font-semibold min-w-[100px]">创建时间</TableHead>
                <TableHead className="text-xs font-semibold min-w-[180px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDatasets.map(ds => (
                <TableRow
                  key={ds.id}
                  className="hover:bg-primary/5 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveDataset(ds);
                    setActiveTableKey(ds.tables?.[0]?.key ?? "");
                    setDetailSearch("");
                    setDetailTab("records");
                  }}
                >
                  <TableCell className="text-sm font-medium text-foreground">{ds.nameCn}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ds.nameEn}</TableCell>
                  <TableCell>{typeBadge(ds.dataType)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[250px]">
                    <span className="line-clamp-1">{ds.description}</span>
                  </TableCell>
                  <TableCell>{statusBadge(ds.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{ds.createdAt}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    {getActions(ds) ?? <span className="text-xs text-muted-foreground">系统数据集</span>}
                  </TableCell>
                </TableRow>
              ))}
              {filteredDatasets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">暂无匹配的数据集</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={v => { if (!v) setCreateOpen(false); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建数据集</DialogTitle>
            <DialogDescription>填写基本信息并定义数据字段</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">数据集中文名称 *</Label>
                <Input placeholder="请输入中文名称" value={createNameCn} onChange={e => setCreateNameCn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">数据集英文名称</Label>
                <Input placeholder="请输入英文名称" value={createNameEn} onChange={e => setCreateNameEn(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">数据类型 *</Label>
                <Select value={createType} onValueChange={v => setCreateType(v as DatasetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="事实数据">事实数据</SelectItem>
                    <SelectItem value="维度数据">维度数据</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">描述</Label>
                <Input placeholder="请输入描述" value={createDesc} onChange={e => setCreateDesc(e.target.value)} />
              </div>
            </div>

            {/* Field definitions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">字段定义 *</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addField}>
                  <Plus className="w-3 h-3" /> 添加字段
                </Button>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-[11px] font-semibold min-w-[100px]">字段名 *</TableHead>
                      <TableHead className="text-[11px] font-semibold min-w-[90px]">中文名称</TableHead>
                      <TableHead className="text-[11px] font-semibold min-w-[80px]">数据类型</TableHead>
                      <TableHead className="text-[11px] font-semibold min-w-[100px]">字段描述</TableHead>
                      <TableHead className="text-[11px] font-semibold w-[50px]">必填</TableHead>
                      <TableHead className="text-[11px] font-semibold w-[50px]">主键</TableHead>
                      <TableHead className="text-[11px] font-semibold w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createFields.map((f, i) => (
                      <TableRow key={i}>
                        <TableCell className="p-1.5">
                          <Input className="h-7 text-xs" placeholder="field_name" value={f.name} onChange={e => updateField(i, { name: e.target.value })} />
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Input className="h-7 text-xs" placeholder="中文名" value={f.labelCn} onChange={e => updateField(i, { labelCn: e.target.value })} />
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Select value={f.dataType} onValueChange={v => updateField(i, { dataType: v as FieldDataType })}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FIELD_DATA_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-1.5">
                          <Input className="h-7 text-xs" placeholder="描述" value={f.description} onChange={e => updateField(i, { description: e.target.value })} />
                        </TableCell>
                        <TableCell className="p-1.5 text-center">
                          <Checkbox checked={f.required} onCheckedChange={v => updateField(i, { required: !!v })} />
                        </TableCell>
                        <TableCell className="p-1.5 text-center">
                          <Checkbox checked={f.primaryKey} onCheckedChange={v => updateField(i, { primaryKey: !!v })} />
                        </TableCell>
                        <TableCell className="p-1.5">
                          {createFields.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeField(i)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreateSubmit}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ONE ID Mapping Dialog — supports all 3 types simultaneously ── */}
      <Dialog open={!!mappingTarget} onOpenChange={v => { if (!v) setMappingTarget(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>ONE ID 映射配置</DialogTitle>
            <DialogDescription>
              为「{mappingTarget?.nameCn}」配置 ONE ID 映射，可同时启用多种实体类型
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {/* HCP */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">HCP（医疗专业人士）</span>
                </div>
                <Switch checked={mappingHcpEnabled} onCheckedChange={setMappingHcpEnabled} />
              </div>
              {mappingHcpEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">匹配字段（可多选）</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border border-input p-2 max-h-28 overflow-y-auto">
                    {mappingFieldOptions.map(f => (
                      <label key={f} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox
                          checked={mappingHcpFields.includes(f)}
                          onCheckedChange={(checked) => {
                            setMappingHcpFields(prev => checked ? [...prev, f] : prev.filter(x => x !== f));
                          }}
                          className="h-3.5 w-3.5"
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drug */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">药品</span>
                <Switch checked={mappingDrugEnabled} onCheckedChange={setMappingDrugEnabled} />
              </div>
              {mappingDrugEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">匹配字段（可多选）</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border border-input p-2 max-h-28 overflow-y-auto">
                    {mappingFieldOptions.map(f => (
                      <label key={f} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox
                          checked={mappingDrugFields.includes(f)}
                          onCheckedChange={(checked) => {
                            setMappingDrugFields(prev => checked ? [...prev, f] : prev.filter(x => x !== f));
                          }}
                          className="h-3.5 w-3.5"
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disease */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">疾病</span>
                <Switch checked={mappingDiseaseEnabled} onCheckedChange={setMappingDiseaseEnabled} />
              </div>
              {mappingDiseaseEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">匹配字段（可多选）</Label>
                  <div className="flex flex-wrap gap-2 rounded-md border border-input p-2 max-h-28 overflow-y-auto">
                    {mappingFieldOptions.map(f => (
                      <label key={f} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox
                          checked={mappingDiseaseFields.includes(f)}
                          onCheckedChange={(checked) => {
                            setMappingDiseaseFields(prev => checked ? [...prev, f] : prev.filter(x => x !== f));
                          }}
                          className="h-3.5 w-3.5"
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p>• 启用映射类型后，需选择数据集中对应的字段</p>
              <p>• 系统将根据所选字段自动匹配主数据 ONE ID</p>
              <p>• 映射完成后数据集可用于标签定义</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingTarget(null)}>取消</Button>
            <Button onClick={handleOneIdMapping} disabled={mappingLoading} className="gap-2">
              {mappingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {mappingLoading ? "映射中..." : "开始映射"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Data Access Dialog — API or File Import ── */}
      <Dialog open={!!accessTarget} onOpenChange={v => { if (!v) { setAccessTarget(null); setAccessLoading(false); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>数据接入</DialogTitle>
            <DialogDescription>
              为「{accessTarget?.nameCn}」选择数据接入方式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  accessMethod === "上传Excel"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => setAccessMethod("上传Excel")}
              >
                <Upload className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">文件导入</p>
                <p className="text-[11px] text-muted-foreground mt-1">上传 Excel / CSV 文件，系统自动解析并导入数据</p>
              </button>
              <button
                type="button"
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  accessMethod === "API"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => setAccessMethod("API")}
              >
                <PlugZap className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">API 接入</p>
                <p className="text-[11px] text-muted-foreground mt-1">通过 API 接口实时同步数据，支持定时拉取</p>
              </button>
            </div>

            {accessMethod === "上传Excel" && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">点击或拖拽文件到此区域上传</p>
                <p className="text-[11px] text-muted-foreground mt-1">支持 .xlsx、.csv 格式</p>
              </div>
            )}

            {accessMethod === "API" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">API 地址</Label>
                  <Input placeholder="https://api.example.com/data" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">同步频率</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime" className="text-xs">实时</SelectItem>
                      <SelectItem value="hourly" className="text-xs">每小时</SelectItem>
                      <SelectItem value="daily" className="text-xs">每天</SelectItem>
                      <SelectItem value="weekly" className="text-xs">每周</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAccessTarget(null); setAccessLoading(false); }}>取消</Button>
            <Button onClick={handleDataAccess} disabled={accessLoading} className="gap-2">
              {accessLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {accessLoading ? "接入中..." : "开始接入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除数据集「{deleteTarget?.nameCn}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default BusinessData;
