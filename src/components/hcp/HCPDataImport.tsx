import { useState, useRef, useMemo } from "react";
import { Upload, Tags, Search, X, FileSpreadsheet, CheckCircle2, UploadCloud, Database, Loader2, UserPlus, Link2 } from "lucide-react";
import { parseSpreadsheet } from "@/lib/spreadsheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHCPProfiles, HCPProfile } from "@/hooks/useHCPProfiles";
import { useAddSubscriptions } from "@/hooks/useUserSubscriptions";
import { toast } from "@/hooks/use-toast";

const FIELD_OPTIONS = [
  { value: "hcp_id", label: "HCP ID" },
  { value: "name", label: "姓名" },
  { value: "gender", label: "性别" },
  { value: "province", label: "省份" },
  { value: "city", label: "城市" },
  { value: "institution", label: "机构名称" },
  { value: "hospital_category", label: "医院分类" },
  { value: "raw_department", label: "科室(原始)" },
  { value: "standard_department", label: "科室(标准)" },
  { value: "professional_title", label: "专业头衔" },
  { value: "admin_title", label: "行政头衔" },
  { value: "education", label: "学历" },
  { value: "supervisor_title", label: "导师头衔" },
  { value: "resume", label: "简历" },
  { value: "expertise", label: "擅长领域" },
  { value: "official_website", label: "官方网站" },
  { value: "other_institutions", label: "其他机构" },
];

const MAPPING_HINTS: Record<string, string[]> = {
  hcp_id: ["hcp_id", "hcpid", "id", "编号"],
  name: ["姓名", "名字", "name", "医生姓名"],
  gender: ["性别", "gender"],
  province: ["省份", "省", "province"],
  city: ["城市", "市", "city"],
  institution: ["医院", "机构", "institution", "hospital", "单位"],
  hospital_category: ["医院分类", "分类", "category", "等级"],
  raw_department: ["科室", "department", "dept", "原始科室"],
  standard_department: ["标准科室", "standard_dept"],
  professional_title: ["专业头衔", "职称", "title"],
  admin_title: ["行政头衔", "行政职务", "admin"],
  education: ["学历", "education"],
  supervisor_title: ["导师", "supervisor"],
  resume: ["简历", "resume", "简介"],
  expertise: ["擅长", "expertise", "专长", "领域"],
  official_website: ["网站", "website", "url"],
  other_institutions: ["其他机构", "兼职", "other"],
};

interface HCPDataImportProps {
  defaultTab?: string;
}

const HCPDataImport = ({ defaultTab = "upload" }: HCPDataImportProps) => {
  const [tab, setTab] = useState(defaultTab);

  /* Upload state */
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addSubMutation = useAddSubscriptions();

  /* All system HCP profiles for matching */
  const { data: allHCPs = [], isLoading } = useHCPProfiles();

  /* Match results state */
  const [matchResults, setMatchResults] = useState<{ row: Record<string, string>; matched?: HCPProfile }[]>([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());

  /* Tag search state */
  const [tagProvince, setTagProvince] = useState("");
  const [tagDept, setTagDept] = useState("");
  const [tagCategory, setTagCategory] = useState("");
  const [tagTitle, setTagTitle] = useState("");
  const [tagExpertise, setTagExpertise] = useState("");
  const [tagResults, setTagResults] = useState<typeof allHCPs>([]);
  const [tagSearched, setTagSearched] = useState(false);
  const [selectedTagResultIds, setSelectedTagResultIds] = useState<Set<string>>(new Set());

  const PROVINCE_OPTIONS = [...new Set(allHCPs.map((h) => h.province).filter(Boolean))];
  const DEPT_OPTIONS = [...new Set(allHCPs.map((h) => h.standard_department).filter(Boolean))];
  const CATEGORY_OPTIONS = [...new Set(allHCPs.map((h) => h.hospital_category).filter(Boolean))];
  const TITLE_OPTIONS = [...new Set(allHCPs.map((h) => h.professional_title).filter(Boolean))];
  const usedFields = new Set(Object.values(colMapping).filter(Boolean));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const json = await parseSpreadsheet(file);

        if (json.length === 0) {
          toast({ title: "文件为空", description: "未检测到有效数据行" });
          return;
        }

        const cols = Object.keys(json[0]);
        setPreviewCols(cols);
        setPreviewData(json.slice(0, 100));

        const autoMap: Record<string, string> = {};
        cols.forEach((col) => {
          const lc = col.toLowerCase();
          for (const [field, keywords] of Object.entries(MAPPING_HINTS)) {
            if (keywords.some((kw) => lc.includes(kw)) && !Object.values(autoMap).includes(field)) {
              autoMap[col] = field;
              break;
            }
          }
        });

        setColMapping(autoMap);
        toast({ title: "文件已加载", description: `检测到 ${json.length} 行数据，${cols.length} 列` });
    } catch (error) {
      toast({
        title: "解析失败",
        description: error instanceof Error ? error.message : "文件格式不支持，请使用 XLSX 或 CSV 文件",
        variant: "destructive",
      });
    }
  };

  /** Match uploaded rows against hcp_profiles by name, institution, department, title */
  const matchUploadedRows = () => {
    if (previewData.length === 0) return;
    const nameCol = Object.entries(colMapping).find(([, f]) => f === "name")?.[0];
    const instCol = Object.entries(colMapping).find(([, f]) => f === "institution")?.[0];
    const deptCol = Object.entries(colMapping).find(([, f]) => f === "standard_department" || f === "raw_department")?.[0];
    const titleCol = Object.entries(colMapping).find(([, f]) => f === "professional_title")?.[0];

    if (!nameCol) {
      toast({ title: "请先映射姓名列", description: '至少需要映射"姓名"字段用于匹配', variant: "destructive" });
      return;
    }

    const results = previewData.map((row) => {
      const rowName = (row[nameCol] || "").trim();
      const rowInst = instCol ? (row[instCol] || "").trim() : "";
      const rowDept = deptCol ? (row[deptCol] || "").trim() : "";
      const rowTitle = titleCol ? (row[titleCol] || "").trim() : "";

      // Score-based matching: name is required, others add confidence
      let bestMatch: HCPProfile | undefined;
      let bestScore = 0;

      for (const hcp of allHCPs) {
        if (!hcp.name.includes(rowName) && !rowName.includes(hcp.name)) continue;
        let score = 1; // name matched
        if (rowInst && hcp.institution && (hcp.institution.includes(rowInst) || rowInst.includes(hcp.institution))) score += 1;
        if (rowDept && ((hcp.standard_department && hcp.standard_department.includes(rowDept)) || (hcp.raw_department && hcp.raw_department.includes(rowDept)))) score += 1;
        if (rowTitle && hcp.professional_title && hcp.professional_title.includes(rowTitle)) score += 1;
        if (score > bestScore) { bestScore = score; bestMatch = hcp; }
      }

      return { row, matched: bestMatch };
    });

    setMatchResults(results);
    // Auto-select all matched
    const matchedIds = new Set(results.filter(r => r.matched).map(r => r.matched!.hcp_id));
    setSelectedMatchIds(matchedIds);

    const matchCount = results.filter(r => r.matched).length;
    toast({ title: "匹配完成", description: `${results.length} 行数据中匹配到 ${matchCount} 位HCP` });
  };

  const handleSubscribeMatched = async () => {
    const ids = Array.from(selectedMatchIds);
    if (ids.length === 0) {
      toast({ title: "未选择", description: "请选择要订阅的HCP" });
      return;
    }
    try {
      await addSubMutation.mutateAsync(ids);
      toast({ title: "订阅成功", description: `已订阅 ${ids.length} 位HCP` });
      setMatchResults([]);
      setSelectedMatchIds(new Set());
      setPreviewData([]);
      setPreviewCols([]);
      setColMapping({});
    } catch (err: any) {
      toast({ title: "订阅失败", description: err.message, variant: "destructive" });
    }
  };

  const executeTagSearch = () => {
    const results = allHCPs.filter((hcp) => {
      if (tagProvince && hcp.province !== tagProvince) return false;
      if (tagDept && hcp.standard_department !== tagDept) return false;
      if (tagCategory && hcp.hospital_category !== tagCategory) return false;
      if (tagTitle && hcp.professional_title !== tagTitle) return false;
      if (tagExpertise && !hcp.expertise.includes(tagExpertise)) return false;
      return true;
    });
    setTagResults(results);
    setTagSearched(true);
    setSelectedTagResultIds(new Set());
  };

  const handleSubscribeTagResults = async () => {
    const ids = Array.from(selectedTagResultIds);
    if (ids.length === 0) {
      toast({ title: "未选择", description: "请勾选要订阅的HCP" });
      return;
    }
    try {
      await addSubMutation.mutateAsync(ids);
      toast({ title: "订阅成功", description: `已订阅 ${ids.length} 位HCP` });
      setSelectedTagResultIds(new Set());
    } catch (err: any) {
      toast({ title: "订阅失败", description: err.message, variant: "destructive" });
    }
  };

  const clearTagFilters = () => {
    setTagProvince(""); setTagDept(""); setTagCategory(""); setTagTitle(""); setTagExpertise("");
    setTagResults([]); setTagSearched(false);
  };

  const activeTagCount = [tagProvince, tagDept, tagCategory, tagTitle, tagExpertise].filter(Boolean).length;

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList className="bg-muted/60">
        <TabsTrigger value="upload" className="gap-1.5 text-sm">
          <Upload className="w-3.5 h-3.5" />
          上传导入
        </TabsTrigger>
        <TabsTrigger value="tags" className="gap-1.5 text-sm">
          <Tags className="w-3.5 h-3.5" />
          标签检索
        </TabsTrigger>
      </TabsList>

      {/* Upload Tab */}
      <TabsContent value="upload" className="space-y-4">
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-semibold text-foreground">上传 Excel / CSV 文件</h3>
              <p className="text-xs text-muted-foreground">
                上传包含 HCP 数据的文件，系统将自动识别列名并映射到数据库字段。支持 <span className="font-mono text-primary">.xlsx</span>、<span className="font-mono text-primary">.csv</span> 格式。
              </p>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" />
                选择文件
              </Button>
            </div>
          </div>
        </div>

        {previewCols.length > 0 && (
          <div className="card-elevated rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              列映射配置
              <span className="text-xs font-normal text-muted-foreground">— 将 Excel 中的列映射到数据库字段</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {previewCols.map((col) => (
                <div key={col} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground truncate block" title={col}>{col}</label>
                  <Select
                    value={colMapping[col] || ""}
                    onValueChange={(v) => setColMapping((prev) => ({ ...prev, [col]: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="跳过此列" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">跳过此列</SelectItem>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} disabled={usedFields.has(opt.value) && colMapping[col] !== opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="border rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    {previewCols.map((col) => (
                      <TableHead key={col} className="text-[10px] font-semibold whitespace-nowrap">
                        {col}
                        {colMapping[col] && (
                          <Badge variant="secondary" className="ml-1 text-[8px] px-1">
                            → {FIELD_OPTIONS.find((f) => f.value === colMapping[col])?.label}
                          </Badge>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {previewCols.map((col) => (
                        <TableCell key={col} className="text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate">
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

             <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                共 {previewData.length} 行数据，已映射 {Object.values(colMapping).filter(Boolean).length} 个字段
              </p>
              <Button
                onClick={matchUploadedRows}
                disabled={isLoading || Object.values(colMapping).filter(Boolean).length === 0}
                className="gap-1.5"
                size="sm"
              >
                <Link2 className="w-3.5 h-3.5" />
                匹配系统HCP
              </Button>
            </div>

            {/* Match Results */}
            {matchResults.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    匹配结果
                    <Badge variant="secondary" className="text-[10px]">
                      {matchResults.filter(r => r.matched).length}/{matchResults.length} 匹配成功
                    </Badge>
                  </h4>
                  <Button
                    onClick={handleSubscribeMatched}
                    disabled={addSubMutation.isPending || selectedMatchIds.size === 0}
                    size="sm"
                    className="gap-1.5"
                  >
                    {addSubMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    订阅选中 ({selectedMatchIds.size})
                  </Button>
                </div>
                <div className="border rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={matchResults.filter(r => r.matched).length > 0 && matchResults.filter(r => r.matched).every(r => selectedMatchIds.has(r.matched!.hcp_id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMatchIds(new Set(matchResults.filter(r => r.matched).map(r => r.matched!.hcp_id)));
                              } else {
                                setSelectedMatchIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-[10px] font-semibold">上传姓名</TableHead>
                        <TableHead className="text-[10px] font-semibold">匹配状态</TableHead>
                        <TableHead className="text-[10px] font-semibold">HCP ID</TableHead>
                        <TableHead className="text-[10px] font-semibold">系统姓名</TableHead>
                        <TableHead className="text-[10px] font-semibold">机构</TableHead>
                        <TableHead className="text-[10px] font-semibold">科室</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchResults.map((r, i) => {
                        const nameCol = Object.entries(colMapping).find(([, f]) => f === "name")?.[0];
                        const rowName = nameCol ? r.row[nameCol] : "-";
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              <Checkbox
                                disabled={!r.matched}
                                checked={r.matched ? selectedMatchIds.has(r.matched.hcp_id) : false}
                                onCheckedChange={() => {
                                  if (!r.matched) return;
                                  setSelectedMatchIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(r.matched.hcp_id)) next.delete(r.matched.hcp_id);
                                    else next.add(r.matched.hcp_id);
                                    return next;
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-xs">{rowName}</TableCell>
                            <TableCell>
                              {r.matched ? (
                                <Badge className="text-[10px] bg-accent/20 text-accent border-accent/30">已匹配</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">未匹配</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-primary">{r.matched?.hcp_id ?? "-"}</TableCell>
                            <TableCell className="text-xs font-medium">{r.matched?.name ?? "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.matched?.institution ?? "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.matched?.standard_department ?? "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* Tag Search Tab */}
      <TabsContent value="tags" className="space-y-4">
        <div className="card-elevated rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">自定义筛选条件</h3>
              {activeTagCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">{activeTagCount} 项筛选</Badge>
              )}
            </div>
            {activeTagCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearTagFilters} className="text-xs h-7">
                <X className="w-3 h-3 mr-1" />
                清空
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">省份</label>
              <Select value={tagProvince} onValueChange={setTagProvince}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>{PROVINCE_OPTIONS.map((p) => <SelectItem key={p} value={p!}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">标准科室</label>
              <Select value={tagDept} onValueChange={setTagDept}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>{DEPT_OPTIONS.map((d) => <SelectItem key={d} value={d!}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">医院分类</label>
              <Select value={tagCategory} onValueChange={setTagCategory}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>{CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c!}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">专业头衔</label>
              <Select value={tagTitle} onValueChange={setTagTitle}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全部" /></SelectTrigger>
                <SelectContent>{TITLE_OPTIONS.map((t) => <SelectItem key={t} value={t!}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">擅长领域</label>
              <Input value={tagExpertise} onChange={(e) => setTagExpertise(e.target.value)} placeholder="关键词..." className="h-9 text-sm" />
            </div>
          </div>
          <Button onClick={executeTagSearch} size="sm" disabled={activeTagCount === 0 || isLoading}>
            <Search className="w-3.5 h-3.5 mr-1" />
            检索 HCP
          </Button>
        </div>

        {tagSearched && (
          <div className="card-elevated rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                共匹配 <span className="font-semibold text-foreground">{tagResults.length}</span> 位 HCP
              </p>
              {selectedTagResultIds.size > 0 && (
                <Button size="sm" className="gap-1.5 h-7" onClick={handleSubscribeTagResults} disabled={addSubMutation.isPending}>
                  {addSubMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                  订阅选中 ({selectedTagResultIds.size})
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={tagResults.length > 0 && tagResults.every(h => selectedTagResultIds.has(h.hcp_id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTagResultIds(new Set(tagResults.map(h => h.hcp_id)));
                          } else {
                            setSelectedTagResultIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">HCP ID</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">姓名</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">省份</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">机构名称</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">专业头衔</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">科室(标准)</TableHead>
                    <TableHead className="text-xs font-semibold whitespace-nowrap">擅长领域</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tagResults.map((hcp) => (
                    <TableRow key={hcp.hcp_id} className="hover:bg-primary/5 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedTagResultIds.has(hcp.hcp_id)}
                          onCheckedChange={() => {
                            setSelectedTagResultIds(prev => {
                              const next = new Set(prev);
                              if (next.has(hcp.hcp_id)) next.delete(hcp.hcp_id);
                              else next.add(hcp.hcp_id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-mono text-primary whitespace-nowrap">{hcp.hcp_id}</TableCell>
                      <TableCell className="text-sm font-medium text-card-foreground whitespace-nowrap">{hcp.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{hcp.province}</TableCell>
                      <TableCell className="text-xs text-card-foreground whitespace-nowrap">{hcp.institution}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{hcp.professional_title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{hcp.standard_department}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{hcp.expertise}</TableCell>
                    </TableRow>
                  ))}
                  {tagResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                        暂无匹配结果
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default HCPDataImport;
