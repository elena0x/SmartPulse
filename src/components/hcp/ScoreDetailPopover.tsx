import { HCPScore } from "@/data/scoringModelData";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  score: HCPScore;
  children: React.ReactNode;
}

const ScoreDetailPopover = ({ score, children }: Props) => {
  const rankDelta = score.previousRank - score.currentRank;
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">得分明细</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-primary">{score.totalScore}</span>
              <RankArrow delta={rankDelta} />
            </div>
          </div>

          <div className="space-y-2">
            {score.breakdown.map((b) => (
              <div key={b.dimensionId}>
                <button
                  className="w-full text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDim(expandedDim === b.dimensionId ? null : b.dimensionId);
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {b.metricDetails && b.metricDetails.length > 0 && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedDim === b.dimensionId ? "rotate-180" : ""}`} />
                      )}
                      {b.dimensionLabel}
                    </span>
                    <span className="font-mono text-card-foreground">
                      {b.weightedScore.toFixed(1)} <span className="text-muted-foreground">/ {b.weight}</span>
                    </span>
                  </div>
                  <Progress value={(b.rawScore) * 100} className="h-1.5 mt-1" />
                </button>

                {/* Metric-level details */}
                {expandedDim === b.dimensionId && b.metricDetails && b.metricDetails.length > 0 && (
                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-border pl-2.5">
                    {b.metricDetails.map((m) => (
                      <div key={m.metricId} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{m.metricLabel}</span>
                        <span className="font-mono text-card-foreground">
                          {(m.rawScore * 100).toFixed(0)}%
                          <span className="text-muted-foreground ml-1">×{m.metricWeight}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-1 border-t border-border text-[10px] text-muted-foreground">
            排名：第 {score.currentRank} 名
            {rankDelta !== 0 && (
              <span className={rankDelta > 0 ? " text-emerald-600" : " text-rose-600"}>
                {" "}({rankDelta > 0 ? "↑" : "↓"}{Math.abs(rankDelta)})
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

function RankArrow({ delta }: { delta: number }) {
  if (delta > 0)
    return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (delta < 0)
    return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default ScoreDetailPopover;
