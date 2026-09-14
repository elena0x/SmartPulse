import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Sparkles, GraduationCap, FlaskConical, Gem, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { recommendedIntents, MiningIntent } from "@/data/miningMockData";

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

interface SmartMiningPanelProps {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  totalCount: number;
  onSelectIntent: (intent: MiningIntent) => void;
  onSubmitQuery: (query: string) => void;
  isAnalyzing: boolean;
}

const SmartMiningPanel = ({
  visible,
  onClose,
  selectedCount,
  totalCount,
  onSelectIntent,
  onSubmitQuery,
  isAnalyzing,
}: SmartMiningPanelProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (!query.trim() || isAnalyzing) return;
    onSubmitQuery(query.trim());
    setQuery("");
  };

  const grouped = recommendedIntents.reduce<Record<string, MiningIntent[]>>((acc, intent) => {
    (acc[intent.category] ??= []).push(intent);
    return acc;
  }, {});

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
          <div className="card-elevated rounded-xl border border-primary/20 bg-card/95 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">智能数据挖掘</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedCount > 0
                      ? `已选 ${selectedCount} 位专家进行深度分析`
                      : `对全部 ${totalCount} 位专家进行分析`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* NL Input */}
            <div className="px-5 pt-4 pb-3">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="输入你的分析问题，例如：分析张伟教授近 10 年论文产出..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="pl-9 h-10 text-sm bg-muted/40 border-border/50"
                    disabled={isAnalyzing}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-10 px-4 gap-1.5"
                  onClick={handleSubmit}
                  disabled={!query.trim() || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  分析
                </Button>
              </div>
            </div>

            {/* Recommended Intents */}
            <div className="px-5 pb-4">
              <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                系统推荐分析意图
              </p>
              <div className="space-y-3">
                {Object.entries(grouped).map(([category, intents]) => {
                  const Icon = categoryIcons[category] || GraduationCap;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {intents[0].categoryLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {intents.map((intent) => (
                          <button
                            key={intent.id}
                            onClick={() => !isAnalyzing && onSelectIntent(intent)}
                            disabled={isAnalyzing}
                            className={`group relative text-left px-3 py-2 rounded-lg border transition-all text-xs leading-relaxed max-w-[320px] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${categoryColors[category]} hover:border-primary/30`}
                          >
                            <span className="mr-1.5">{intent.icon}</span>
                            {intent.description}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SmartMiningPanel;
