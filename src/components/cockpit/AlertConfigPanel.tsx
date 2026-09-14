import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Zap, Settings2 } from "lucide-react";

export interface AlertConfig {
  enabled: boolean;
  autoGenerateLeads: boolean;
  metric: string;
  operator: string;
  threshold: number;
  period: string;
}

const defaultConfig: AlertConfig = {
  enabled: true,
  autoGenerateLeads: false,
  metric: "firstAuthorPubs",
  operator: ">",
  threshold: 1,
  period: "monthly",
};

/* ---------- Metrics grouped by analysis category ---------- */
type MetricOption = { value: string; label: string };

const metricsByCategory: Record<string, MetricOption[]> = {
  academic: [
    { value: "firstAuthorPubs", label: "第一作者论文数" },
    { value: "corrAuthorPubs", label: "通讯作者论文数" },
    { value: "totalPubs", label: "总论文数" },
    { value: "pubGrowthRate", label: "论文增长率 (%)" },
  ],
  clinical: [
    { value: "totalTrials", label: "临床试验总数" },
    { value: "newPITrials", label: "新增 PI 项目数" },
    { value: "phaseIIITrials", label: "III 期试验数" },
    { value: "trialGrowthRate", label: "试验增长率 (%)" },
  ],
  resource: [
    { value: "activityScore", label: "活跃度评分" },
    { value: "fundingAmount", label: "基金金额 (万元)" },
    { value: "activityGrowthRate", label: "活跃度变化率 (%)" },
  ],
};

const defaultMetricByCategory: Record<string, string> = {
  academic: "corrAuthorPubs",
  clinical: "totalTrials",
  resource: "activityScore",
};

const allMetrics: MetricOption[] = [
  ...metricsByCategory.academic,
  ...metricsByCategory.clinical,
  ...metricsByCategory.resource,
];

const operators = [
  { value: ">", label: "大于" },
  { value: ">=", label: "大于等于" },
  { value: "increase%", label: "增幅超过 %" },
];

const periods = [
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
  { value: "quarterly", label: "每季度" },
];

interface AlertConfigPanelProps {
  config?: AlertConfig;
  onChange?: (config: AlertConfig) => void;
  /** Analysis category to filter relevant metrics */
  category?: "academic" | "clinical" | "resource";
}

const AlertConfigPanel = ({ config: externalConfig, onChange, category }: AlertConfigPanelProps) => {
  const [config, setConfig] = useState<AlertConfig>(externalConfig ?? {
    ...defaultConfig,
    metric: (category && defaultMetricByCategory[category]) || defaultConfig.metric,
  });

  const availableMetrics = category ? metricsByCategory[category] ?? allMetrics : allMetrics;

  // If current metric isn't in available list, reset it
  const currentMetricValid = availableMetrics.some((m) => m.value === config.metric);
  if (!currentMetricValid && availableMetrics.length > 0 && config.metric) {
    const corrected = { ...config, metric: availableMetrics[0].value };
    setConfig(corrected);
    onChange?.(corrected);
  }

  const update = (partial: Partial<AlertConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-4">
      {/* Enable anomaly push */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-primary" />
          <div>
            <Label className="text-sm font-medium">开启异动推送</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">当指标超过阈值时自动预警</p>
          </div>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
      </div>

      {config.enabled && (
        <>
          {/* Threshold settings */}
          <div className="p-3 rounded-lg border border-border/50 bg-muted/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Settings2 className="w-3.5 h-3.5" />
              触发阈值配置
              {category && (
                <span className="text-[10px] font-normal text-muted-foreground/70 ml-1">
                  · 仅显示与图表纵轴相关的指标
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">监控指标</Label>
                <Select value={config.metric} onValueChange={(v) => update({ metric: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">触发条件</Label>
                <Select value={config.operator} onValueChange={(v) => update({ operator: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">阈值</Label>
                <Input
                  type="number"
                  value={config.threshold}
                  onChange={(e) => update({ threshold: Number(e.target.value) })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">检测周期</Label>
              <Select value={config.period} onValueChange={(v) => update({ period: v })}>
                <SelectTrigger className="h-8 text-xs mt-1 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-generate leads toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-primary" />
              <div>
                <Label className="text-sm font-medium">自动转化为行动线索</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  触发预警时，自动在线索流中生成 NBA 建议
                </p>
              </div>
            </div>
            <Switch checked={config.autoGenerateLeads} onCheckedChange={(v) => update({ autoGenerateLeads: v })} />
          </div>
        </>
      )}
    </div>
  );
};

export default AlertConfigPanel;
