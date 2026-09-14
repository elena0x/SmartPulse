import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, X, Code2, Lightbulb, ExternalLink, Save, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell,
} from "recharts";
import { AnalysisResult } from "@/data/miningMockData";
import { toast } from "sonner";

interface SmartMiningResultsProps {
  result: AnalysisResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryText: string;
}

const chartConfig = {
  firstAuthor: { label: "第一作者", color: "hsl(217, 91%, 50%)" },
  correspondingAuthor: { label: "通讯作者", color: "hsl(170, 70%, 42%)" },
  other: { label: "其他", color: "hsl(220, 14%, 70%)" },
  phaseI: { label: "I 期", color: "hsl(38, 92%, 50%)" },
  phaseII: { label: "II 期", color: "hsl(217, 91%, 50%)" },
  phaseIII: { label: "III 期", color: "hsl(170, 70%, 42%)" },
  value: { label: "数值", color: "hsl(217, 91%, 50%)" },
  funding: { label: "基金(万)", color: "hsl(217, 91%, 50%)" },
  activity: { label: "活跃度", color: "hsl(170, 70%, 42%)" },
};

const SCATTER_COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(170, 70%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 55%)",
  "hsl(190, 70%, 50%)",
  "hsl(340, 70%, 55%)",
  "hsl(120, 50%, 45%)",
];

const SmartMiningResults = ({ result, open, onOpenChange, queryText }: SmartMiningResultsProps) => {
  const navigate = useNavigate();
  const [showCode, setShowCode] = useState(false);

  if (!result) return null;

  const handleSave = () => {
    toast.success("分析已保存至「我的驾驶舱」", {
      description: "系统将定期自动刷新数据",
    });
  };

  const handleDataPointClick = (hcpId?: string) => {
    if (hcpId) navigate(`/hcp/${hcpId}`);
  };

  const renderChart = () => {
    switch (result.chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <LineChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="year" className="text-[11px]" />
              <YAxis className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="firstAuthor" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ r: 4 }} name="firstAuthor" />
              <Line type="monotone" dataKey="correspondingAuthor" stroke="hsl(170, 70%, 42%)" strokeWidth={2} dot={{ r: 4 }} name="correspondingAuthor" />
              <Line type="monotone" dataKey="other" stroke="hsl(220, 14%, 70%)" strokeWidth={2} dot={{ r: 4 }} name="other" />
            </LineChart>
          </ChartContainer>
        );
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <BarChart data={result.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="name" className="text-[11px]" />
              <YAxis className="text-[11px]" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {result.chartData[0]?.phaseI !== undefined ? (
                <>
                  <Bar dataKey="phaseI" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} name="phaseI" />
                  <Bar dataKey="phaseII" fill="hsl(217, 91%, 50%)" radius={[2, 2, 0, 0]} name="phaseII" />
                  <Bar dataKey="phaseIII" fill="hsl(170, 70%, 42%)" radius={[2, 2, 0, 0]} name="phaseIII" />
                </>
              ) : (
                <Bar dataKey="value" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} name="value" />
              )}
            </BarChart>
          </ChartContainer>
        );
      case "scatter":
        return (
          <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="funding" name="基金(万)" className="text-[11px]" label={{ value: "基金总额(万元)", position: "bottom", offset: 0, style: { fontSize: 11 } }} />
              <YAxis dataKey="activity" name="活跃度" className="text-[11px]" label={{ value: "临床活跃度", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Scatter data={result.chartData} name="专家">
                {result.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={SCATTER_COLORS[index % SCATTER_COLORS.length]} r={entry.size / 2} />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">{result.title}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                查询：{queryText}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Chart */}
        <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 p-4">
          {renderChart()}
          {/* Legend for scatter */}
          {result.chartType === "scatter" && (
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {result.chartData.map((d: any, i: number) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SCATTER_COLORS[i % SCATTER_COLORS.length] }} />
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insight */}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 mt-1">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1.5">AI 洞察</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-1.5 mt-1">
          <p className="text-xs font-medium text-foreground">关键发现</p>
          {result.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-primary font-mono font-bold mt-px">{i + 1}.</span>
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>

        {/* Data Points - Drill Through */}
        <div className="mt-1">
          <p className="text-xs font-medium text-foreground mb-2">穿透查看</p>
          <div className="space-y-1">
            {result.dataPoints.map((dp, i) => (
              <button
                key={i}
                onClick={() => handleDataPointClick(dp.hcpId)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-xs group"
              >
                <span className="text-card-foreground">{dp.label}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Generated Code */}
        <div className="mt-1">
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showCode ? "隐藏" : "查看"}生成的查询代码
            {showCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showCode && (
            <motion.pre
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 p-3 rounded-lg bg-sidebar-background text-sidebar-foreground text-[11px] font-mono overflow-x-auto leading-relaxed"
            >
              {result.generatedCode}
            </motion.pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" />
            保存至驾驶舱
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartMiningResults;
