import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Gauge, AlertTriangle } from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";

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
];

interface StrategySourceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: {
    title: string;
    query: string;
    summary: string;
    chartType: "bar" | "line" | "scatter";
    chartData: any[];
    hasAnomaly: boolean;
    anomalyMessage?: string;
    categoryLabel: string;
  } | null;
}

const StrategySourceDrawer = ({ open, onOpenChange, analysis }: StrategySourceDrawerProps) => {
  if (!analysis) return null;

  const renderChart = () => {
    switch (analysis.chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <LineChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="firstAuthor" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="firstAuthor" />
              <Line type="monotone" dataKey="correspondingAuthor" stroke="hsl(170, 70%, 42%)" strokeWidth={2} dot={{ r: 3 }} name="correspondingAuthor" />
            </LineChart>
          </ChartContainer>
        );
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <BarChart data={analysis.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="phaseI" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} name="phaseI" />
              <Bar dataKey="phaseII" fill="hsl(217, 91%, 50%)" radius={[2, 2, 0, 0]} name="phaseII" />
              <Bar dataKey="phaseIII" fill="hsl(170, 70%, 42%)" radius={[2, 2, 0, 0]} name="phaseIII" />
            </BarChart>
          </ChartContainer>
        );
      case "scatter":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="funding" name="基金(万)" tick={{ fontSize: 11 }} />
              <YAxis dataKey="activity" name="活跃度" tick={{ fontSize: 11 }} />
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <SheetTitle className="text-base">策略溯源</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            此线索由以下驾驶舱策略预警生成
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Strategy info */}
          <div className="p-3 rounded-lg border border-primary/15 bg-primary/5">
            <p className="text-sm font-semibold text-foreground mb-1">{analysis.title}</p>
            <p className="text-xs text-muted-foreground">{analysis.query}</p>
            <Badge variant="outline" className="mt-2 text-[10px]">{analysis.categoryLabel}</Badge>
          </div>

          {/* Anomaly highlight */}
          {analysis.hasAnomaly && analysis.anomalyMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/15">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{analysis.anomalyMessage}</p>
            </div>
          )}

          {/* Chart */}
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
            {renderChart()}
          </div>

          {/* AI Summary */}
          <div className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">AI 洞察：</span>
              {analysis.summary}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StrategySourceDrawer;
