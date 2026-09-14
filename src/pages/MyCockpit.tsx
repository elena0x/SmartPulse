import { useState, useEffect } from "react";
import { useCockpitAnalyses } from "@/hooks/useDataService";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, RefreshCw, Trash2, Clock, GraduationCap,
  FlaskConical, Gem, BarChart3, LineChart as LineChartIcon, ScatterChart as ScatterIcon,
  ChevronDown, ChevronUp, Search as SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface SavedAnalysis {
  id: string;
  title: string;
  query: string;
  category: "academic" | "clinical" | "resource";
  categoryLabel: string;
  savedAt: string;
  lastRefreshed: string;
  hasAnomaly: boolean;
  anomalyMessage?: string;
  chartType: "bar" | "line" | "scatter";
  chartData: any[];
  summary: string;
  targetCount: number;
}

const categoryIcons: Record<string, typeof GraduationCap> = {
  academic: GraduationCap,
  clinical: FlaskConical,
  resource: Gem,
};

const categoryColors: Record<string, string> = {
  academic: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  clinical: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  resource: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const chartTypeIcons: Record<string, typeof BarChart3> = {
  bar: BarChart3,
  line: LineChartIcon,
  scatter: ScatterIcon,
};

const chartConfig = {
  firstAuthor: { label: "第一作者", color: "hsl(217, 91%, 50%)" },
  correspondingAuthor: { label: "通讯作者", color: "hsl(170, 70%, 42%)" },
  other: { label: "其他", color: "hsl(220, 14%, 70%)" },
  phaseI: { label: "I 期", color: "hsl(38, 92%, 50%)" },
  phaseII: { label: "II 期", color: "hsl(217, 91%, 50%)" },
  phaseIII: { label: "III 期", color: "hsl(170, 70%, 42%)" },
  value: { label: "数值", color: "hsl(217, 91%, 50%)" },
};

const SCATTER_COLORS = [
  "hsl(217, 91%, 50%)", "hsl(170, 70%, 42%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(280, 60%, 55%)", "hsl(190, 70%, 50%)",
  "hsl(340, 70%, 55%)", "hsl(120, 50%, 45%)",
];

const MyCockpit = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: dbAnalyses = [] } = useCockpitAnalyses();

  useEffect(() => {
    if (dbAnalyses.length > 0) {
      setAnalyses(dbAnalyses);
    }
  }, [dbAnalyses]);

  const filtered = analyses.filter(
    (a) => a.title.includes(search) || a.query.includes(search) || a.categoryLabel.includes(search)
  );

  const handleRefresh = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setAnalyses((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, lastRefreshed: new Date().toISOString() } : a
        )
      );
      setRefreshingId(null);
      toast.success("数据已刷新至最新");
    }, 1500);
  };

  const handleDelete = (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    toast.success("已从驾驶舱移除");
  };

  const renderMiniChart = (analysis: SavedAnalysis) => {
    switch (analysis.chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <LineChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="firstAuthor" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="firstAuthor" />
              <Line type="monotone" dataKey="correspondingAuthor" stroke="hsl(170, 70%, 42%)" strokeWidth={2} dot={{ r: 3 }} name="correspondingAuthor" />
              <Line type="monotone" dataKey="other" stroke="hsl(220, 14%, 70%)" strokeWidth={1.5} dot={{ r: 2 }} name="other" />
            </LineChart>
          </ChartContainer>
        );
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <BarChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="phaseI" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} name="phaseI" />
              <Bar dataKey="phaseII" fill="hsl(217, 91%, 50%)" radius={[2, 2, 0, 0]} name="phaseII" />
              <Bar dataKey="phaseIII" fill="hsl(170, 70%, 42%)" radius={[2, 2, 0, 0]} name="phaseIII" />
            </BarChart>
          </ChartContainer>
        );
      case "scatter":
        return (
          <ChartContainer config={chartConfig} className="aspect-[3/1] w-full">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="funding" name="基金(万)" tick={{ fontSize: 10 }} />
              <YAxis dataKey="activity" name="活跃度" tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Scatter data={analysis.chartData} name="专家">
                {analysis.chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={SCATTER_COLORS[i % SCATTER_COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Gauge className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">策略监控</h1>
                <p className="text-xs text-muted-foreground">
                  {analyses.length} 个已保存的分析意图
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-56">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索分析意图..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Analysis Cards */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((analysis) => {
                const CatIcon = categoryIcons[analysis.category] || GraduationCap;
                const ChartIcon = chartTypeIcons[analysis.chartType] || BarChart3;
                const isExpanded = expandedId === analysis.id;

                return (
                  <motion.div
                    key={analysis.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="card-elevated rounded-xl overflow-hidden"
                  >
                    {/* Card Header */}
                    <div
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : analysis.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[analysis.category]}`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{analysis.title}</h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <ChartIcon className="w-3 h-3" />
                              {analysis.categoryLabel}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              覆盖 {analysis.targetCount} 位专家
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(analysis.lastRefreshed), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                              刷新
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleRefresh(analysis.id); }}
                          disabled={refreshingId === analysis.id}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshingId === analysis.id ? "animate-spin" : ""}`} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认移除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要从驾驶舱移除「{analysis.title}」吗？
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(analysis.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                确认移除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 space-y-3 border-t border-border/50">
                            <div className="pt-3">
                              <p className="text-[11px] text-muted-foreground mb-1">原始查询</p>
                              <p className="text-xs text-foreground bg-muted/40 rounded-lg px-3 py-2">
                                {analysis.query}
                              </p>
                            </div>

                            {/* Chart */}
                            <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                              {renderMiniChart(analysis)}
                            </div>

                            <div className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-3">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                <span className="font-medium text-foreground">AI 洞察：</span>
                                {analysis.summary}
                              </p>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => navigate("/hcp-list")}
                              >
                                查看专家列表
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Gauge className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {search ? "未找到匹配的分析意图" : "暂无保存的分析意图"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  在 HCP 订阅列表中使用「智能数据挖掘」功能，将分析结果保存至此处
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MyCockpit;
