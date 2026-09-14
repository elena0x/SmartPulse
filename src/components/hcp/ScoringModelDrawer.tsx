import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  ScoringDimension, defaultDimensions,
} from "@/data/scoringModelData";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, Settings2, Layers, ListChecks,
  SlidersHorizontal, Play, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (dimensions: ScoringDimension[]) => void;
}

type Step = 1 | 2 | 3;

const stepMeta: Record<Step, { icon: React.ReactNode; title: string; desc: string }> = {
  1: { icon: <Layers className="w-4 h-4" />, title: "维度权重", desc: "分配四大评分维度的权重占比" },
  2: { icon: <ListChecks className="w-4 h-4" />, title: "指标拾取", desc: "选择各维度下的衡量指标，并分配指标权重（不超过维度权重）" },
  3: { icon: <SlidersHorizontal className="w-4 h-4" />, title: "计分细则", desc: "配置具体指标的评分标准" },
};

const ScoringModelDrawer = ({ visible, onClose, onApply }: Props) => {
  const [step, setStep] = useState<Step>(1);
  const [dimensions, setDimensions] = useState<ScoringDimension[]>(
    () => JSON.parse(JSON.stringify(defaultDimensions))
  );
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const isWeightValid = totalWeight === 100;

  const getMetricWeightSum = (dim: ScoringDimension) =>
    dim.metrics.filter((m) => m.enabled).reduce((s, m) => s + m.weight, 0);

  const hasMetricWeightError = dimensions.some((d) => getMetricWeightSum(d) > d.weight);

  const updateWeight = useCallback((id: string, newVal: number) => {
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, weight: newVal } : d))
    );
  }, []);

  const toggleMetric = useCallback((dimId: string, metricId: string) => {
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId
          ? {
              ...d,
              metrics: d.metrics.map((m) =>
                m.id === metricId ? { ...m, enabled: !m.enabled } : m
              ),
            }
          : d
      )
    );
  }, []);

  const updateMetricWeight = useCallback((dimId: string, metricId: string, newWeight: number) => {
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === dimId
          ? {
              ...d,
              metrics: d.metrics.map((m) =>
                m.id === metricId ? { ...m, weight: newWeight } : m
              ),
            }
          : d
      )
    );
  }, []);

  const updateRuleValue = useCallback(
    (dimId: string, metricId: string, ruleIdx: number, segIdx: number, field: "score", value: number) => {
      setDimensions((prev) =>
        prev.map((d) =>
          d.id === dimId
            ? {
                ...d,
                metrics: d.metrics.map((m) =>
                  m.id === metricId && m.rules
                    ? {
                        ...m,
                        rules: m.rules.map((r, ri) =>
                          ri === ruleIdx && r.segments
                            ? { ...r, segments: r.segments.map((s, si) => (si === segIdx ? { ...s, [field]: value } : s)) }
                            : r
                        ),
                      }
                    : m
                ),
              }
            : d
        )
      );
    },
    []
  );

  const updateCoefficient = useCallback(
    (dimId: string, metricId: string, ruleIdx: number, coefIdx: number, value: number) => {
      setDimensions((prev) =>
        prev.map((d) =>
          d.id === dimId
            ? {
                ...d,
                metrics: d.metrics.map((m) =>
                  m.id === metricId && m.rules
                    ? {
                        ...m,
                        rules: m.rules.map((r, ri) =>
                          ri === ruleIdx && r.coefficients
                            ? { ...r, coefficients: r.coefficients.map((c, ci) => (ci === coefIdx ? { ...c, value } : c)) }
                            : r
                        ),
                      }
                    : m
                ),
              }
            : d
        )
      );
    },
    []
  );

  const handleApply = () => {
    if (!isWeightValid) {
      toast.error("维度权重总计必须等于 100%");
      return;
    }
    if (hasMetricWeightError) {
      toast.error("存在指标权重超出维度权重的情况，请调整");
      return;
    }
    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      onApply(dimensions);
      onClose();
      toast.success("评分模型已应用，正在计算得分...");
    }, 1500);
  };

  const enabledMetricCount = dimensions.reduce((s, d) => s + d.metrics.filter((m) => m.enabled).length, 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="mb-4 overflow-hidden"
        >
          <div className="card-elevated rounded-xl border border-primary/20 bg-card/95 backdrop-blur-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings2 className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">配置评分模型</h3>
                    <p className="text-[11px] text-muted-foreground">定义 HCP 动态评分逻辑</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 mt-4">
                {([1, 2, 3] as Step[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      step === s
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {stepMeta[s].icon}
                    {stepMeta[s].title}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto px-5 py-4">
              <p className="text-xs text-muted-foreground mb-4">{stepMeta[step].desc}</p>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-5">
                    {dimensions.map((dim) => (
                      <div key={dim.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{dim.label}</span>
                          <Badge variant={dim.weight > 0 ? "default" : "secondary"} className="text-xs font-mono">
                            {dim.weight}%
                          </Badge>
                        </div>
                        <Slider
                          value={[dim.weight]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([v]) => updateWeight(dim.id, v)}
                        />
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">权重总计</span>
                      <Badge variant={isWeightValid ? "default" : "destructive"} className="text-xs font-mono">
                        {totalWeight}% {isWeightValid ? "✓" : "≠ 100%"}
                      </Badge>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-4">
                    <TooltipProvider>
                      {dimensions.map((dim) => {
                        const metricWeightSum = getMetricWeightSum(dim);
                        const overweight = metricWeightSum > dim.weight;
                        return (
                          <div key={dim.id} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-foreground">{dim.label}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {dim.metrics.filter((m) => m.enabled).length}/{dim.metrics.length} 已选
                                </Badge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={overweight ? "destructive" : "default"} className="text-[10px] font-mono">
                                      {metricWeightSum}/{dim.weight}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">已启用指标权重合计 / 维度权重上限</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {dim.metrics.map((metric) => (
                                <div
                                  key={metric.id}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted/60 transition-colors"
                                >
                                  <Checkbox
                                    checked={metric.enabled}
                                    onCheckedChange={() => toggleMetric(dim.id, metric.id)}
                                  />
                                  <span className="text-sm text-card-foreground flex-1">{metric.label}</span>
                                  {metric.enabled && (
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={dim.weight}
                                        step={1}
                                        value={metric.weight}
                                        onChange={(e) => updateMetricWeight(dim.id, metric.id, Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 h-7 text-xs text-center"
                                      />
                                      <span className="text-[10px] text-muted-foreground">%</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </TooltipProvider>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="space-y-3">
                    {dimensions.map((dim) => {
                      const enabledMetrics = dim.metrics.filter((m) => m.enabled && m.rules);
                      if (enabledMetrics.length === 0) return null;
                      return (
                        <div key={dim.id} className="space-y-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {dim.label}
                          </span>
                          {enabledMetrics.map((metric) => (
                            <Collapsible
                              key={metric.id}
                              open={expandedMetric === metric.id}
                              onOpenChange={(o) => setExpandedMetric(o ? metric.id : null)}
                            >
                              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                                  <Badge variant="secondary" className="text-[10px] font-mono">{metric.weight}%</Badge>
                                </div>
                                {expandedMetric === metric.id ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="px-3 py-3 space-y-3">
                                  {metric.rules?.map((rule, ruleIdx) => (
                                    <div key={ruleIdx} className="space-y-2">
                                      {rule.type === "segment" && rule.segments && (
                                        <>
                                          <span className="text-xs text-muted-foreground font-medium">分段计分</span>
                                          <div className="space-y-1.5">
                                            {rule.segments.map((seg, si) => (
                                              <div key={si} className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-32 truncate">{seg.range}</span>
                                                <Input
                                                  type="number"
                                                  step={0.1}
                                                  min={0}
                                                  max={1}
                                                  value={seg.score}
                                                  onChange={(e) => updateRuleValue(dim.id, metric.id, ruleIdx, si, "score", parseFloat(e.target.value) || 0)}
                                                  className="w-20 h-7 text-xs"
                                                />
                                                <span className="text-xs text-muted-foreground">分</span>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                      {rule.type === "weighted" && rule.coefficients && (
                                        <>
                                          <span className="text-xs text-muted-foreground font-medium">加权系数</span>
                                          <div className="space-y-1.5">
                                            {rule.coefficients.map((coef, ci) => (
                                              <div key={ci} className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground w-32 truncate">{coef.label}</span>
                                                <Input
                                                  type="number"
                                                  step={0.05}
                                                  min={0}
                                                  max={1}
                                                  value={coef.value}
                                                  onChange={(e) => updateCoefficient(dim.id, metric.id, ruleIdx, ci, parseFloat(e.target.value) || 0)}
                                                  className="w-20 h-7 text-xs"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                      {rule.type === "mapping" && rule.formula && (
                                        <>
                                          <span className="text-xs text-muted-foreground font-medium">数值映射</span>
                                          <div className="text-xs text-card-foreground bg-muted/60 rounded-md px-3 py-2 font-mono">
                                            {rule.formula}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      );
                    })}
                    {enabledMetricCount === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">请先在"指标拾取"步骤中启用指标</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-border px-5 py-3.5 flex items-center justify-between">
              <div>
                {step > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s - 1) as Step)}>
                    上一步
                  </Button>
                )}
              </div>
              <div>
                {step < 3 ? (
                  <Button size="sm" onClick={() => setStep((s) => (s + 1) as Step)} disabled={step === 1 && !isWeightValid}>
                    下一步
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleApply} disabled={applying || !isWeightValid || hasMetricWeightError} className="gap-1.5">
                    {applying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        计算中...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        应用模型
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScoringModelDrawer;

