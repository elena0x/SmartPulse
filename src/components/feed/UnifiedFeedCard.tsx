import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Eye, Clock, ArrowRight, MessageSquareText, Loader2,
  Check, X, Zap, Newspaper, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { TriggeredAlert } from "@/contexts/AlertConfigContext";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useHCPProfiles } from "@/hooks/useHCPProfiles";
import { getTagCategoryColorClass } from "@/data/tagManagementData";

/* ---------- types ---------- */
export interface RegularSignal {
  id: string;
  hcpName: string;
  hospital: string;
  signalType: string;
  summary: string;
  priority: "high" | "medium" | "low";
  time: string;
  tags: string[];
  publications: number;
  trials: number;
  affinity: number;
}

export interface NbaAction {
  id: string;
  hcpName: string;
  action: string;
  priority: "high" | "medium" | "low";
  score: number;
  channel: string;
  deadline: string;
}

export interface StrategySource {
  analysisId: string;
  label: string;
}

export interface DbTag {
  id: string;
  tag_key: string;
  tag_value: string;
  tag_category: string;
  source: string;
  created_at?: string;
}

export interface UnifiedItem {
  hcpId?: string;
  hcpName: string;
  hospital: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  dbTags?: DbTag[];
  triggeredAlert: TriggeredAlert | null;
  regularSignal: RegularSignal | null;
  regularStrategySource: StrategySource | null;
  regularNba: NbaAction | null;
  activities: { type: string; date: string; title: string }[];
  unifiedScore: number;
  unifiedNbaAction: string;
  unifiedChannel: string;
  nbaLoading?: boolean;
  activitiesLoading?: boolean;
  hasTagChange?: boolean;
  hasActivities?: boolean;
}

/* ---------- helpers ---------- */
const signalTypeToTab: Record<string, string> = {
  "论文发表": "publications",
  "临床试验": "trials",
  "指南更新": "guidelines",
  "学术会议": "conferences",
  "标签变更": "overview",
};

const titleSuffixes = ["主任医师", "副主任医师", "主治医师", "副教授", "教授", "副主任", "主任", "医生", "医师"];

const splitNameTitle = (name: string): { baseName: string; title: string | null } => {
  for (const suffix of titleSuffixes) {
    if (name.endsWith(suffix)) {
      return { baseName: name.slice(0, -suffix.length).trim(), title: suffix };
    }
  }
  return { baseName: name, title: null };
};

const sourceLabel = (type: string) =>
  type === "论文" ? "学术论文" : type === "临床试验" || type === "试验" ? "临床试验" : type === "临床指南" ? "临床指南" : type === "基金" ? "科研基金" : type === "会议" ? "学术会议" : type === "媒体" ? "新闻媒体" : type === "标签变更" ? "标签变更" : "业务数据";

const isNewTag = (createdAt?: string) => {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  const now = new Date();
  return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
};

/* ---------- Thinking Skeleton ---------- */
function ThinkingSkeleton({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/60" />
      <span className="text-xs text-muted-foreground animate-pulse">{label}</span>
    </div>
  );
}

/* ---------- ActivityTimeline sub-component ---------- */
const threeMonthsAgoStr = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split("T")[0];
})();

function ActivityTimeline({ activities, loading }: { activities: { type: string; date: string; title: string }[]; loading?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...activities]
    .filter((a) => Boolean(a.date) && a.date >= threeMonthsAgoStr)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const displayItems = expanded ? sorted : sorted.slice(0, 3);
  const hasMore = sorted.length > 3;

  return (
    <div className="mb-4 p-3 rounded-lg bg-muted/40 border border-border/40">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">近期动态</p>
      {loading ? (
        <ThinkingSkeleton label="正在汇总近期动态…" />
      ) : sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">近3个月无新动态</p>
      ) : (
        <>
          <div className="space-y-0">
            {displayItems.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-xs relative">
                {i < displayItems.length - 1 && (
                  <div className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />
                )}
                <div className="relative z-10 mt-1 w-[11px] h-[11px] flex-shrink-0 rounded-full bg-primary border-2 border-background" />
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground border border-border/40 whitespace-nowrap">
                      {sourceLabel(a.type)}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.date}</span>
                  </div>
                  <p className="text-card-foreground/90 mt-0.5 leading-relaxed">{a.title.length > 50 ? `${a.title.slice(0, 50)}…` : a.title}</p>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 mt-1 ml-3.5 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "收起" : `展开全部 ${sorted.length} 条动态`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const priorityConfig = {
  high: { label: "高优先", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "中优先", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  low: { label: "低优先", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
} as const;

/* ---------- component ---------- */
interface Props {
  item: UnifiedItem;
  index: number;
  onOpenStrategy: (analysisId: string) => void;
  onDismiss?: (alertId: string) => void;
}

const UnifiedFeedCard = ({ item, index, onOpenStrategy, onDismiss }: Props) => {
  const navigate = useNavigate();
  const [nbaStatus, setNbaStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const { data: profiles = [] } = useHCPProfiles();
  const findHcpId = (name: string) => profiles.find((h) => name.includes(h.name))?.hcp_id;

  const hasTrigger = !!item.triggeredAlert;
  const hasRegular = !!item.regularSignal;
  const isMerged = hasTrigger && hasRegular;
  const sourceCount = (hasTrigger ? item.triggeredAlert!.sourceAnalyses.length : 0) + (hasRegular ? 1 : 0);
  const priority = priorityConfig[item.priority];

  // Sort tags: new tags (7 days) first, then rest
  const allTags = item.dbTags ?? [];
  const sortedTags = [...allTags].sort((a, b) => {
    const aNew = isNewTag(a.created_at) ? 1 : 0;
    const bNew = isNewTag(b.created_at) ? 1 : 0;
    return bNew - aNew;
  });

  // Banner logic
  const hasTagChange = item.hasTagChange ?? false;
  const hasActivities = item.hasActivities ?? false;

  const renderBanner = () => {
    if (isMerged) {
      return (
        <>
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">多源线索合并 ×{sourceCount}</span>
        </>
      );
    }
    if (hasTrigger) {
      return (
        <>
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">
            策略预警{item.triggeredAlert!.sourceAnalyses.length > 1 ? ` ×${item.triggeredAlert!.sourceAnalyses.length}` : ""}
          </span>
        </>
      );
    }
    // Signal type logic
    if (hasTagChange && hasActivities) {
      return (
        <>
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">多源信息：原始信号 + 标签异动</span>
        </>
      );
    }
    if (hasTagChange) {
      return (
        <>
          <Newspaper className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold text-amber-600">标签异动</span>
        </>
      );
    }
    if (hasActivities) {
      return (
        <>
          <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">原始信号</span>
        </>
      );
    }
    return null;
  };

  const bannerContent = renderBanner();

  return (
    <motion.div
      id={`hcp-${item.hcpId || item.hcpName}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      className={`card-elevated overflow-hidden ${hasTrigger ? "border-primary/25 ring-1 ring-primary/10" : ""}`}
    >
      {/* Top banner - only show if there's content */}
      {bannerContent && (
        <div className="flex items-center gap-2 px-5 py-2 bg-muted/40 border-b border-border/50">
          {bannerContent}
          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {hasTrigger
              ? formatDistanceToNow(new Date(item.triggeredAlert!.triggeredAt), { addSuffix: true, locale: zhCN })
              : item.regularSignal?.time}
          </span>
        </div>
      )}

      <div className="flex">
        {/* Left: Info */}
        <div className="flex-1 p-5">
          {/* HCP Name + Priority + Score in one row */}
          {(() => {
            const { baseName, title } = splitNameTitle(item.hcpName);
            return (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-card-foreground">{baseName}</h3>
                {title && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                    {title}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    评分 {item.unifiedScore}
                  </span>
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priority.className}`}>
                    {priority.label}
                  </span>
                </div>
              </div>
            );
          })()}
          <p className="text-xs text-muted-foreground mb-3">{item.hospital}</p>

          {/* DB Tags - all tags, new tags first with red dot */}
          {sortedTags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {sortedTags.map((tag) => {
                const colorClass = getTagCategoryColorClass(tag.tag_category);
                const isRecent = isNewTag(tag.created_at);
                return (
                  <span
                    key={tag.id}
                    className={`relative text-[11px] font-medium px-2 py-0.5 rounded-full border ${colorClass}`}
                  >
                    {isRecent && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
                    )}
                    {tag.tag_value}
                  </span>
                );
              })}
            </div>
          )}


          {/* Recent Activities Timeline */}
          <ActivityTimeline activities={item.activities} loading={item.activitiesLoading} />

          {/* Unified NBA */}
          <div className={`p-3 rounded-lg border ${
            nbaStatus === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" :
            nbaStatus === "rejected" ? "bg-muted/30 border-border/30 opacity-60" :
            "bg-muted/60 border-border/50"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowRight className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary">NBA 建议</span>
            </div>
            {item.nbaLoading ? (
              <ThinkingSkeleton label="AI 正在生成行动建议…" />
            ) : (
              <>
                <p className="text-xs text-card-foreground/80 leading-relaxed">{item.unifiedNbaAction}</p>
                {nbaStatus === "pending" && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => {
                        setNbaStatus("accepted");
                        toast.success("已采纳建议", { description: `将按建议通过${item.unifiedChannel}联系 ${item.hcpName}` });
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Check className="w-3 h-3" /> 采纳
                    </button>
                    <button
                      onClick={() => {
                        setNbaStatus("rejected");
                        if (hasTrigger && onDismiss) onDismiss(item.triggeredAlert!.id);
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
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-[140px] bg-muted/30 border-l border-border/50 p-4 flex flex-col gap-2">
          <div className="relative">
            <button
              disabled
              className="w-full text-xs font-medium py-2 px-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-1.5 justify-center cursor-not-allowed opacity-70"
            >
              <MessageSquareText className="w-3 h-3" />
              生成话术
            </button>
            <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/25 whitespace-nowrap">
              待上线
            </span>
          </div>
          {hasRegular && (
            <button
              onClick={() => {
                const hcpId = findHcpId(item.hcpName);
                const tab = signalTypeToTab[item.regularSignal!.signalType] ?? "publications";
                if (hcpId) navigate(`/hcp/${hcpId}?tab=${tab}`);
              }}
              className="w-full text-xs font-medium py-2 px-3 rounded-lg bg-secondary text-secondary-foreground flex items-center gap-1.5 justify-center hover:bg-secondary/80 transition-colors"
            >
              <Eye className="w-3 h-3" /> 深度动态
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UnifiedFeedCard;
