import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, Users, ArrowRight, X } from "lucide-react";

interface AnomalyDrilldownProps {
  visible: boolean;
  position: { x: number; y: number };
  dataPoint: { name?: string; value?: number; label?: string } | null;
  analysisTitle: string;
  onClose: () => void;
}

const AnomalyDrilldown = ({ visible, position, dataPoint, analysisTitle, onClose }: AnomalyDrilldownProps) => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const handleGenerateLeads = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onClose();
      navigate("/feed", { state: { fromCockpit: true, strategy: analysisTitle, dataPoint } });
    }, 800);
  };

  if (!visible || !dataPoint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[100] bg-popover border border-border rounded-xl shadow-xl p-4 w-[260px]"
        style={{ left: Math.min(position.x, window.innerWidth - 280), top: Math.min(position.y, window.innerHeight - 200) }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground">异常数据点</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/15 mb-3">
          <p className="text-xs font-medium text-foreground">{dataPoint.name || dataPoint.label || "数据点"}</p>
          {dataPoint.value !== undefined && (
            <p className="text-lg font-bold text-destructive mt-0.5">{dataPoint.value}</p>
          )}
        </div>

        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={handleGenerateLeads}
            disabled={generating}
          >
            <Zap className="w-3.5 h-3.5" />
            {generating ? "生成中…" : "生成批量线索"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => { onClose(); navigate("/hcp-list"); }}
          >
            <Users className="w-3.5 h-3.5" />
            查看关联专家
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnomalyDrilldown;
