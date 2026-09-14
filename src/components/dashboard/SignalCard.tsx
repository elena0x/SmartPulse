import { motion } from "framer-motion";
import { ExternalLink, Clock } from "lucide-react";

interface SignalCardProps {
  hcpName: string;
  hospital: string;
  signalType: string;
  summary: string;
  priority: "high" | "medium" | "low";
  time: string;
  index: number;
}

const priorityConfig = {
  high: { label: "高优先", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "中优先", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  low: { label: "低优先", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
} as const;

const SignalCard = ({ hcpName, hospital, signalType, summary, priority, time, index }: SignalCardProps) => {
  const p = priorityConfig[priority];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-elevated p-4 hover:translate-y-[-1px]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${p.className}`}>
            {p.label}
          </span>
          <span className="text-xs text-muted-foreground font-medium">{signalType}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {time}
        </div>
      </div>

      <h4 className="text-sm font-semibold text-card-foreground mb-1">{hcpName}</h4>
      <p className="text-xs text-muted-foreground mb-1">{hospital}</p>
      <p className="text-sm text-card-foreground/80 leading-relaxed">{summary}</p>

      <div className="flex gap-2 mt-3">
        <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
          查看详情 <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default SignalCard;
