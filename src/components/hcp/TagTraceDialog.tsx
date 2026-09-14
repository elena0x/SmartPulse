import { HCPTag } from "@/data/hcpTagData";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface TagTraceDialogProps {
  tag: HCPTag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dimensionColors: Record<string, string> = {
  学术维度: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  属性维度: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  动作: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

export default function TagTraceDialog({ tag, open, onOpenChange }: TagTraceDialogProps) {
  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            标签溯源
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tag Info */}
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {tag.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {tag.source === "auto" ? "智能生成" : "手动创建"} · {tag.createdAt}
            </span>
          </div>


          {/* Logic Rules */}
          {tag.rules && tag.rules.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                逻辑规则
              </p>
              <div className="space-y-2">
                {tag.rules.map((rule, idx) => {
                  const dimClass = dimensionColors[rule.dimension] || dimensionColors["动作"];
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className={`text-[10px] font-medium shrink-0 ${dimClass}`}>
                        {rule.dimension}
                      </Badge>
                      <span className="text-muted-foreground text-xs">{rule.key}</span>
                      {rule.operator && (
                        <span className="text-xs font-mono text-primary">{rule.operator}</span>
                      )}
                      <span className="text-xs font-medium text-card-foreground px-2 py-0.5 rounded-md bg-card border border-border">
                        {rule.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
