import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, ArrowRight, Check, X, Gauge, MessageSquareText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TriggeredAlert } from "@/contexts/AlertConfigContext";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface TriggeredAlertCardProps {
  alert: TriggeredAlert;
  index: number;
  onOpenStrategy: (analysisId: string) => void;
  onDismiss: (alertId: string) => void;
}

const talkingPointsForTriggered: Record<string, string> = {
  "张伟教授": "张教授您好！系统监测到您近1月通讯作者论文产出显著增长，我司在PD-1联合治疗领域有最新的差异化数据，期望能在近期当面交流，特别是安全性和持续缓解率方面的最新突破。",
  "陈强教授": "陈教授您好！注意到您近期新增了2个临床项目，活跃度显著提升。我司在肝癌免疫联合治疗方面积累了丰富的真实世界数据，希望能探讨IIT合作的可能性。",
  "赵敏副教授": "赵教授您好！关注到您近期在科研基金和临床方面双轨发力，学术活跃度持续攀升。我司有一批最新的循证医学资料，希望能为您的研究提供参考和支持。",
};

const TriggeredAlertCard = ({ alert, index, onOpenStrategy, onDismiss }: TriggeredAlertCardProps) => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [nbaStatus, setNbaStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  const handleGenerateScript = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const script = talkingPointsForTriggered[alert.hcpName] ?? "暂无话术建议";
      toast.success("拜访话术已生成", { description: script, duration: 8000 });
    }, 1500);
  };

  const timeAgo = formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true, locale: zhCN });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      className="card-elevated overflow-hidden border-primary/25 ring-1 ring-primary/10"
    >
      {/* Auto-triggered banner */}
      <div className="flex items-center gap-2 px-5 py-2 bg-primary/5 border-b border-primary/15">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-primary">
          策略预警{alert.sourceAnalyses.length > 1 ? ` ×${alert.sourceAnalyses.length}` : ""}
        </span>
        {alert.sourceAnalyses.length === 1 ? (
          <span className="text-[10px] text-muted-foreground">
            {alert.metricLabel} {alert.operator} {alert.threshold}（当前值: {alert.currentValue}）
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">
            多策略综合评分 {alert.nbaScore}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </span>
      </div>

      <div className="flex">
        {/* Left: Info */}
        <div className="flex-1 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/20">
              高优先
            </span>
          </div>

          {/* Strategy Source Tags - show all sources */}
          {alert.sourceAnalyses.map((src) => (
            <button
              key={src.analysisId}
              onClick={() => onOpenStrategy(src.analysisId)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-colors mb-1 mr-1 cursor-pointer"
            >
              <Gauge className="w-2.5 h-2.5" />
              源自策略：{src.analysisTitle}
              <span className="text-muted-foreground ml-0.5">
                ({src.metricLabel} {src.operator} {src.threshold}，当前 {src.currentValue})
              </span>
            </button>
          ))}
          <div className="mb-1.5" />

          <h3 className="text-base font-semibold text-card-foreground">{alert.hcpName}</h3>
          <p className="text-xs text-muted-foreground mb-3">{alert.hospital}</p>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {alert.tags.map((tag) => (
              <span
                key={tag}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  tag === "策略预警"
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* NBA */}
          <div className={`p-3 rounded-lg border ${
            nbaStatus === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" :
            nbaStatus === "rejected" ? "bg-muted/30 border-border/30 opacity-60" :
            "bg-muted/60 border-border/50"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">NBA 建议</span>
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                评分 {alert.nbaScore}
              </span>
            </div>
            <p className="text-xs text-card-foreground/80 leading-relaxed">{alert.nbaAction}</p>
            {nbaStatus === "pending" && (
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setNbaStatus("accepted");
                    toast.success("已采纳建议", { description: `将按建议通过${alert.channel}联系 ${alert.hcpName}` });
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Check className="w-3 h-3" /> 采纳
                </button>
                <button
                  onClick={() => {
                    setNbaStatus("rejected");
                    onDismiss(alert.id);
                    toast("已忽略建议");
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3 h-3" /> 不采纳
                </button>
              </div>
            )}
            {nbaStatus === "accepted" && (
              <p className="text-[11px] text-emerald-600 font-medium mt-2">✓ 已采纳</p>
            )}
            {nbaStatus === "rejected" && (
              <p className="text-[11px] text-muted-foreground mt-2">已忽略</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-[140px] bg-muted/30 border-l border-border/50 p-4 flex flex-col gap-2">
          <button
            onClick={handleGenerateScript}
            disabled={generating}
            className="w-full text-xs font-medium py-2 px-3 rounded-lg gradient-primary text-primary-foreground flex items-center gap-1.5 justify-center disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquareText className="w-3 h-3" />}
            {generating ? "生成中…" : "生成话术"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TriggeredAlertCard;
