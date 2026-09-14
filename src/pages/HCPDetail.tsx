import { useState, useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useHCPProfiles } from "@/hooks/useHCPProfiles";
import {
  useHCPPublications, useHCPGuidelines, useHCPTrials,
  useHCPGrants, useHCPConferences, useHCPNews,
  useHCPResearchAreas, useHCPActivities, useHCPRelations,
  useSignals,
} from "@/hooks/useDataService";
import { useHCPBusinessActivities } from "@/hooks/useHCPBusinessActivities";
import { useHCPTagsByHcpId } from "@/hooks/useHCPTags";
import { getTagCategoryColorClass, allTags as tagDefinitions, tableFieldMapping } from "@/data/tagManagementData";
import { interactionHistory } from "@/data/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Publication, type ClinicalGuideline, type ClinicalTrial,
  type Grant, type Conference, type NewsItem,
  type HCPRelation,
} from "@/data/hcpDetailData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, ExternalLink, BookOpen, Award, Calendar,
  FileText, FlaskConical, Landmark, Mic, Newspaper,
  ArrowUpDown, ArrowUp, ArrowDown, Filter,
  Microscope, Users, Sparkles, Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type SortDir = "asc" | "desc";

function SortButton({ label, active, dir, onToggle }: { label: string; active: boolean; dir: SortDir; onToggle: () => void }) {
  return (
    <Button variant={active ? "secondary" : "ghost"} size="sm" className="h-7 text-xs gap-1" onClick={onToggle}>
      {active ? (dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
      {label}
    </Button>
  );
}

function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-border">
      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
      {children}
    </div>
  );
}

function useSortToggle(defaultKey: string) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const toggle = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  return { sortKey, sortDir, toggle };
}

// ─── Component ────────────────────────────────────────────────
const HCPDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("tab") ?? "publications";
  
  // Fetch HCP profile from DB
  const { data: allProfiles = [] } = useHCPProfiles();
  const hcp = allProfiles.find((h) => h.hcp_id === id) ?? null;
  const hcpId = hcp?.hcp_id;

  // Fetch all detail data from DB
  const { data: publications = [] } = useHCPPublications(hcpId);
  const { data: guidelines = [] } = useHCPGuidelines(hcpId);
  const { data: trials = [] } = useHCPTrials(hcpId);
  const { data: grants = [] } = useHCPGrants(hcpId);
  const { data: conferences = [] } = useHCPConferences(hcpId);
  const { data: news = [] } = useHCPNews(hcpId);
  const { data: researchAreas = { diseases: [], drugs: [] } } = useHCPResearchAreas(hcpId);
  const { data: recentActivities = [] } = useHCPActivities(hcpId);
  // Build nameMap for business activities (same source as IntelFeed)
  const nameMap = useMemo(() => {
    if (!hcp) return new Map<string, string>();
    return new Map([[hcp.hcp_id, hcp.name]]);
  }, [hcp]);
  const { data: businessActivityMap = {} } = useHCPBusinessActivities(nameMap);
  const businessActivities = useMemo(() => {
    if (!hcp) return [];
    // Try all name variants
    const candidates = [hcp.name];
    const normalized = hcp.name
      .replace(/主任医师|副主任医师|主治医师/g, "")
      .replace(/副教授|教授|副主任|主任|医生|医师/g, "")
      .trim();
    if (normalized && normalized !== hcp.name) candidates.push(normalized);
    for (const c of candidates) {
      if (businessActivityMap[c]?.length) return businessActivityMap[c];
    }
    return [];
  }, [hcp, businessActivityMap]);
  const { data: relations = [] } = useHCPRelations(hcpId);
  const { data: signalsData = [] } = useSignals();
  const { data: hcpDbTags = [] } = useHCPTagsByHcpId(hcpId ?? "");
  
  const signal = hcp ? signalsData.find((s) => s.hcpName.includes(hcp.name)) ?? null : null;

  const [generatingScript, setGeneratingScript] = useState(false);

  // ── Publications filters & sort
  const [pubDateRange, setPubDateRange] = useState("all");
  const [pubIfRange, setPubIfRange] = useState("all");
  const pubSort = useSortToggle("date");

  const filteredPubs = useMemo(() => {
    let list = [...publications];
    if (pubDateRange !== "all") {
      const now = new Date();
      const months = pubDateRange === "6m" ? 6 : pubDateRange === "1y" ? 12 : pubDateRange === "3y" ? 36 : 0;
      if (months) {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        list = list.filter((p) => new Date(p.date) >= cutoff);
      }
    }
    if (pubIfRange !== "all") {
      const min = pubIfRange === "10+" ? 10 : pubIfRange === "30+" ? 30 : pubIfRange === "50+" ? 50 : 0;
      list = list.filter((p) => p.impactFactor >= min);
    }
    list.sort((a, b) => {
      const mul = pubSort.sortDir === "asc" ? 1 : -1;
      if (pubSort.sortKey === "date") return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return mul * (a.impactFactor - b.impactFactor);
    });
    return list;
  }, [publications, pubDateRange, pubIfRange, pubSort.sortKey, pubSort.sortDir]);

  // ── Guidelines filters & sort
  const [glYear, setGlYear] = useState("all");
  const [glRole, setGlRole] = useState("all");
  const glSort = useSortToggle("year");

  const uniqueGlRoles = useMemo(() => [...new Set(guidelines.map((g) => g.role))], [guidelines]);
  const filteredGuidelines = useMemo(() => {
    let list = [...guidelines];
    if (glYear !== "all") list = list.filter((g) => g.year === glYear);
    if (glRole !== "all") list = list.filter((g) => g.role === glRole);
    list.sort((a, b) => {
      const mul = glSort.sortDir === "asc" ? 1 : -1;
      return mul * (a.year.localeCompare(b.year));
    });
    return list;
  }, [guidelines, glYear, glRole, glSort.sortKey, glSort.sortDir]);

  // ── Trials filters & sort
  const [trialPhase, setTrialPhase] = useState("all");
  const [trialRole, setTrialRole] = useState("all");
  const trialSort = useSortToggle("startDate");

  const uniqueTrialPhases = useMemo(() => [...new Set(trials.map((t) => t.phase))], [trials]);
  const uniqueTrialRoles = useMemo(() => [...new Set(trials.map((t) => t.role))], [trials]);
  const filteredTrials = useMemo(() => {
    let list = [...trials];
    if (trialPhase !== "all") list = list.filter((t) => t.phase === trialPhase);
    if (trialRole !== "all") list = list.filter((t) => t.role === trialRole);
    list.sort((a, b) => {
      const mul = trialSort.sortDir === "asc" ? 1 : -1;
      return mul * (a.startDate.localeCompare(b.startDate));
    });
    return list;
  }, [trials, trialPhase, trialRole, trialSort.sortKey, trialSort.sortDir]);

  // ── Grants filters & sort
  const [grantType, setGrantType] = useState("all");
  const [grantPeriod, setGrantPeriod] = useState("all");
  const grantSort = useSortToggle("period");

  const uniqueGrantTypes = useMemo(() => {
    return [...new Set(grants.map((g) => {
      const m = g.fundingBody.match(/（(.+?)）/);
      return m ? m[1] : g.fundingBody;
    }))];
  }, [grants]);
  const filteredGrants = useMemo(() => {
    let list = [...grants];
    if (grantType !== "all") list = list.filter((g) => g.fundingBody.includes(grantType));
    if (grantPeriod !== "all") list = list.filter((g) => g.status === grantPeriod);
    list.sort((a, b) => {
      const mul = grantSort.sortDir === "asc" ? 1 : -1;
      return mul * (a.period.localeCompare(b.period));
    });
    return list;
  }, [grants, grantType, grantPeriod, grantSort.sortKey, grantSort.sortDir]);

  // ── Conferences filters & sort
  const [confRole, setConfRole] = useState("all");
  const [confDateRange, setConfDateRange] = useState("all");
  const [confType, setConfType] = useState("all");
  const confSort = useSortToggle("date");

  const uniqueConfRoles = useMemo(() => [...new Set(conferences.map((c) => c.role))], [conferences]);
  const filteredConferences = useMemo(() => {
    let list = [...conferences];
    if (confRole !== "all") list = list.filter((c) => c.role === confRole);
    if (confDateRange !== "all") {
      const now = new Date();
      const months = confDateRange === "6m" ? 6 : confDateRange === "1y" ? 12 : 0;
      if (months) {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        list = list.filter((c) => new Date(c.date) >= cutoff);
      }
    }
    if (confType !== "all") list = list.filter((c) => c.name.includes(confType));
    list.sort((a, b) => {
      const mul = confSort.sortDir === "asc" ? 1 : -1;
      return mul * (a.date.localeCompare(b.date));
    });
    return list;
  }, [conferences, confRole, confDateRange, confType, confSort.sortKey, confSort.sortDir]);

  // ── News sort
  const newsSort = useSortToggle("date");
  const sortedNews = useMemo(() => {
    const list = [...news];
    list.sort((a, b) => {
      const mul = newsSort.sortDir === "asc" ? 1 : -1;
      return mul * (a.date.localeCompare(b.date));
    });
    return list;
  }, [news, newsSort.sortKey, newsSort.sortDir]);

  if (!hcp) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <p className="text-lg">未找到该 HCP 记录</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back button */}
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> 返回列表
          </Button>

          {/* Profile Header */}
          <div className="card-elevated p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary-foreground">{hcp.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-card-foreground">{hcp.name}</h1>
                  <Badge variant="secondary" className="text-xs">{hcp.professional_title}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {hcp.institution} · {hcp.raw_department}
                </p>
                {hcpDbTags.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {hcpDbTags.map((tag) => {
                      const colorClass = getTagCategoryColorClass(tag.tag_category);
                      return (
                        <span key={tag.id} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${colorClass}`}>
                          {tag.tag_value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-3 mt-5 pt-5 border-t border-border">
              {([
                ["性别", hcp.gender],
                ["学历", hcp.education],
                ["省份/城市", `${hcp.province}·${hcp.city}`],
                ["医院分类", hcp.hospital_category],
                ["导师资格", hcp.supervisor_title ?? "—"],
                ["行政职务", hcp.admin_title],
                ["官网", hcp.official_website],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                  {label === "官网" && value !== "—" ? (
                    <a href={value} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5 truncate">
                      链接 <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-xs font-medium text-card-foreground truncate">{value}</p>
                  )}
                </div>
              ))}
              {/* 关系网 */}
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground mb-0.5">关系网</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {relations.length} 位关联
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {hcp.name} 的关系网络
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {relations.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">暂无关系数据</p>}
                      {relations.map((r) => (
                        <div key={r.hcpId} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-primary">{r.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{r.name}</p>
                              <p className="text-[11px] text-muted-foreground">{r.institution} · {r.department}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">{r.relation}</Badge>
                            <div className="flex gap-0.5 mt-1 justify-end">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < r.strength ? "bg-primary" : "bg-muted"}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* 研究领域 */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Microscope className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">研究领域</h3>
              </div>
              <div className="mb-3">
                <p className="text-[11px] text-muted-foreground mb-1.5">聚焦疾病</p>
                <div className="flex flex-wrap gap-1.5">
                  {researchAreas.diseases.length === 0 && <span className="text-xs text-muted-foreground">暂无数据</span>}
                  {researchAreas.diseases.map((d) => (
                    <span key={d.name} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${d.level === "核心" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">关注新药</p>
                <div className="space-y-1.5">
                  {researchAreas.drugs.length === 0 && <span className="text-xs text-muted-foreground">暂无数据</span>}
                  {researchAreas.drugs.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="text-card-foreground truncate">{d.name}</span>
                      <Badge variant={d.type === "在研" ? "secondary" : "default"} className="text-[10px] ml-2 flex-shrink-0">{d.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 多维评估 */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-card-foreground">多维评估</h3>
              </div>
              <div className="w-full aspect-square max-w-[260px] mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={[
                      { dim: "学术影响力", value: signal ? 95 : 60 },
                      { dim: "处方倾向", value: signal ? 78 : 55 },
                      { dim: "合作意愿", value: signal ? 88 : 70 },
                      { dim: "竞品关联度", value: signal ? 42 : 35 },
                      { dim: "社会影响力", value: signal ? 82 : 50 },
                    ]}
                    cx="50%" cy="50%" outerRadius="60%"
                  >
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} dy={2} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="评估" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 近期动态 */}
            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">近期动态</h3>
                {(() => {
                  const threeMonthsAgo = new Date();
                  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                  const since = threeMonthsAgo.toISOString().split("T")[0];
                  const filteredCount = businessActivities.filter((a) => Boolean(a.date) && a.date >= since).length;
                  return filteredCount > 0 ? (
                    <span className="text-[10px] text-muted-foreground ml-auto">{filteredCount} 条</span>
                  ) : null;
                })()}
              </div>
              {(() => {
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const since = threeMonthsAgo.toISOString().split("T")[0];
                const filtered = [...businessActivities]
                  .filter((a) => Boolean(a.date) && a.date >= since)
                  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                return filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无动态</p>
                ) : (
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-0 pr-2">
                      {filtered.map((item, i) => {
                        const label = item.type === "论文" ? "学术论文" : item.type === "临床试验" || item.type === "试验" ? "临床试验" : item.type === "临床指南" ? "临床指南" : item.type === "基金" ? "科研基金" : item.type === "会议" ? "学术会议" : item.type === "媒体" ? "新闻媒体" : "业务数据";
                        return (
                          <div key={i} className="flex items-start gap-3 text-xs relative">
                            {i < filtered.length - 1 && (
                              <div className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />
                            )}
                            <div className="relative z-10 mt-1 w-[11px] h-[11px] flex-shrink-0 rounded-full bg-primary border-2 border-background" />
                            <div className="flex-1 min-w-0 pb-3">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] h-4">{label}</Badge>
                                <span className="text-[10px] text-muted-foreground">{item.date}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                disabled={generatingScript}
                onClick={() => {
                  setGeneratingScript(true);
                  setTimeout(() => {
                    setGeneratingScript(false);
                    toast.success("拜访话术已生成", {
                      description: `基于${hcp.name}教授近期动态，建议围绕其最新 Lancet Oncology 论文成果展开学术交流，重点讨论 PD-1 联合治疗数据及我司产品差异化优势。`,
                      duration: 8000,
                    });
                  }, 1500);
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingScript ? "生成中..." : "一键生成拜访话术"}
              </Button>
            </div>
          </div>

          {/* Detail Tabs */}
          <Tabs defaultValue={defaultTab} className="card-elevated rounded-xl">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-4 pt-2 h-auto flex-wrap gap-1">
              <TabsTrigger value="publications" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <FileText className="w-3.5 h-3.5" /> 学术论文 ({filteredPubs.length})
              </TabsTrigger>
              <TabsTrigger value="guidelines" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <BookOpen className="w-3.5 h-3.5" /> 临床指南 ({filteredGuidelines.length})
              </TabsTrigger>
              <TabsTrigger value="trials" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <FlaskConical className="w-3.5 h-3.5" /> 临床试验 ({filteredTrials.length})
              </TabsTrigger>
              <TabsTrigger value="grants" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Landmark className="w-3.5 h-3.5" /> 基金项目 ({filteredGrants.length})
              </TabsTrigger>
              <TabsTrigger value="conferences" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Mic className="w-3.5 h-3.5" /> 会议 ({filteredConferences.length})
              </TabsTrigger>
              <TabsTrigger value="news" className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
                <Newspaper className="w-3.5 h-3.5" /> 相关新闻 ({sortedNews.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Publications ── */}
            <TabsContent value="publications" className="p-4">
              <FilterBar>
                <Select value={pubDateRange} onValueChange={setPubDateRange}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="发表时间" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="6m">近6个月</SelectItem>
                    <SelectItem value="1y">近1年</SelectItem>
                    <SelectItem value="3y">近3年</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={pubIfRange} onValueChange={setPubIfRange}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="影响因子" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部 IF</SelectItem>
                    <SelectItem value="10+">IF ≥ 10</SelectItem>
                    <SelectItem value="30+">IF ≥ 30</SelectItem>
                    <SelectItem value="50+">IF ≥ 50</SelectItem>
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <SortButton label="发表时间" active={pubSort.sortKey === "date"} dir={pubSort.sortDir} onToggle={() => pubSort.toggle("date")} />
                <SortButton label="影响因子" active={pubSort.sortKey === "if"} dir={pubSort.sortDir} onToggle={() => pubSort.toggle("if")} />
              </FilterBar>
              <div className="space-y-3">
                {filteredPubs.map((pub) => (
                  <div key={pub.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-medium text-card-foreground">{pub.title}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-primary font-medium">{pub.journal}</span>
                      <span className="text-[11px] text-muted-foreground">{pub.date}</span>
                      <span className="text-[11px] font-mono text-accent">IF {pub.impactFactor}</span>
                      <span className="text-[11px] text-muted-foreground">引用 {pub.citations}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">作者: {pub.authors.join(", ")}</p>
                  </div>
                ))}
                {filteredPubs.length === 0 && <EmptyState />}
              </div>
            </TabsContent>

            {/* ── Guidelines ── */}
            <TabsContent value="guidelines" className="p-4">
              <FilterBar>
                <Select value={glYear} onValueChange={setGlYear}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="出版日期" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年份</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={glRole} onValueChange={setGlRole}>
                  <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="角色" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    {uniqueGlRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <SortButton label="出版日期" active={glSort.sortKey === "year"} dir={glSort.sortDir} onToggle={() => glSort.toggle("year")} />
              </FilterBar>
              <div className="space-y-3">
                {filteredGuidelines.map((g) => (
                  <div key={g.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{g.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-primary">{g.organization}</span>
                        <span className="text-[11px] text-muted-foreground">{g.year}</span>
                        <span className="text-[11px] text-muted-foreground">角色: {g.role}</span>
                      </div>
                    </div>
                    <Badge variant={g.status === "已发布" ? "default" : "secondary"} className="text-[10px]">{g.status}</Badge>
                  </div>
                ))}
                {filteredGuidelines.length === 0 && <EmptyState />}
              </div>
            </TabsContent>

            {/* ── Trials ── */}
            <TabsContent value="trials" className="p-4">
              <FilterBar>
                <Select value={trialPhase} onValueChange={setTrialPhase}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="试验范围" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部阶段</SelectItem>
                    {uniqueTrialPhases.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={trialRole} onValueChange={setTrialRole}>
                  <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue placeholder="试验角色" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    {uniqueTrialRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <SortButton label="首次公示日期" active={trialSort.sortKey === "startDate"} dir={trialSort.sortDir} onToggle={() => trialSort.toggle("startDate")} />
              </FilterBar>
              <div className="space-y-3">
                {filteredTrials.map((t) => (
                  <div key={t.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{t.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-mono text-primary">{t.registrationId}</span>
                          <Badge variant="outline" className="text-[10px]">{t.phase}</Badge>
                          <span className="text-[11px] text-muted-foreground">{t.startDate} ~ {t.endDate}</span>
                          <span className="text-[11px] text-muted-foreground">角色: {t.role}</span>
                        </div>
                      </div>
                      <TrialStatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
                {filteredTrials.length === 0 && <EmptyState />}
              </div>
            </TabsContent>

            {/* ── Grants ── */}
            <TabsContent value="grants" className="p-4">
              <FilterBar>
                <Select value={grantType} onValueChange={setGrantType}>
                  <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="基金类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {uniqueGrantTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={grantPeriod} onValueChange={setGrantPeriod}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="项目状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="在研">在研</SelectItem>
                    <SelectItem value="结题">结题</SelectItem>
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <SortButton label="公示日期" active={grantSort.sortKey === "period"} dir={grantSort.sortDir} onToggle={() => grantSort.toggle("period")} />
              </FilterBar>
              <div className="space-y-3">
                {filteredGrants.map((g) => (
                  <div key={g.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-medium text-card-foreground">{g.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-primary">{g.fundingBody}</span>
                      <span className="text-[11px] font-mono text-accent">{g.amount}</span>
                      <span className="text-[11px] text-muted-foreground">{g.period}</span>
                      <span className="text-[11px] text-muted-foreground">角色: {g.role}</span>
                      <Badge variant={g.status === "在研" ? "default" : "secondary"} className="text-[10px]">{g.status}</Badge>
                    </div>
                  </div>
                ))}
                {filteredGrants.length === 0 && <EmptyState />}
              </div>
            </TabsContent>

            {/* ── Conferences ── */}
            <TabsContent value="conferences" className="p-4">
              <FilterBar>
                <Select value={confType} onValueChange={setConfType}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="会议类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部会议</SelectItem>
                    <SelectItem value="ASCO">ASCO</SelectItem>
                    <SelectItem value="CSCO">CSCO</SelectItem>
                    <SelectItem value="ESMO">ESMO</SelectItem>
                    <SelectItem value="WCLC">WCLC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={confDateRange} onValueChange={setConfDateRange}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="会议时间" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="6m">近6个月</SelectItem>
                    <SelectItem value="1y">近1年</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={confRole} onValueChange={setConfRole}>
                  <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="角色" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    {uniqueConfRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="h-4 w-px bg-border" />
                <SortButton label="会议时间" active={confSort.sortKey === "date"} dir={confSort.sortDir} onToggle={() => confSort.toggle("date")} />
              </FilterBar>
              <div className="space-y-3">
                {filteredConferences.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.topic}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-muted-foreground">{c.date}</span>
                          <span className="text-[11px] text-muted-foreground">{c.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{c.role}</Badge>
                    </div>
                  </div>
                ))}
                {filteredConferences.length === 0 && <EmptyState />}
              </div>
            </TabsContent>

            {/* ── News ── */}
            <TabsContent value="news" className="p-4">
              <FilterBar>
                <SortButton label="时间" active={newsSort.sortKey === "date"} dir={newsSort.sortDir} onToggle={() => newsSort.toggle("date")} />
              </FilterBar>
              <div className="space-y-3">
                {sortedNews.map((n) => (
                  <div key={n.id} className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-primary">{n.source}</span>
                      <span className="text-[11px] text-muted-foreground">{n.date}</span>
                    </div>
                  </div>
                ))}
                {sortedNews.length === 0 && <EmptyState />}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AppLayout>
  );
};

const EmptyState = () => (
  <div className="text-center py-12 text-sm text-muted-foreground">暂无数据</div>
);

const TrialStatusBadge = ({ status }: { status: string }) => {
  const cls =
    status === "招募中" ? "signal-badge-medium" :
    status === "进行中" ? "signal-badge-low" :
    status === "已完成" ? "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary" :
    "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground";
  return <span className={cls}>{status}</span>;
};

export default HCPDetail;
