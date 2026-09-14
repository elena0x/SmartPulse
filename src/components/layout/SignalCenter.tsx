import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, ArrowRight, Clock, Calendar, FileText, FlaskConical, Zap, Tags, CheckCheck } from "lucide-react";
import { useSignals, useNBAActions } from "@/hooks/useDataService";
import { useHCPProfiles } from "@/hooks/useHCPProfiles";

const DISMISS_KEY = "signal_center_read_at";

const isWithin7Days = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
};

const formatSmartDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return { icon: "clock" as const, text: "刚刚" };
  if (diffMins < 60) return { icon: "clock" as const, text: `${diffMins}分钟前` };
  if (diffHours < 24 && d.getDate() === now.getDate()) return { icon: "clock" as const, text: `${diffHours}小时前` };
  return { icon: "calendar" as const, text: `${d.getMonth() + 1}/${d.getDate()}` };
};

const SmartDateLabel = ({ dateStr }: { dateStr: string }) => {
  const { icon, text } = formatSmartDate(dateStr);
  return (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      {icon === "clock" ? <Clock className="w-2.5 h-2.5" /> : <Calendar className="w-2.5 h-2.5" />}
      {text}
    </span>
  );
};

const typeIcon = (type: string) => {
  if (type === "论文" || type === "论文发表" || type === "publication") return <FileText className="w-3 h-3" />;
  if (type === "临床试验" || type === "trial") return <FlaskConical className="w-3 h-3" />;
  return <Zap className="w-3 h-3" />;
};

const signalTypeToTab: Record<string, string> = {
  "论文发表": "publications",
  "publication": "publications",
  "临床试验": "trials",
  "trial": "trials",
  "指南更新": "guidelines",
  "guideline": "guidelines",
  "学术会议": "conferences",
  "conference": "conferences",
  "标签变更": "overview",
};

const scoreToPriority = (score: number): "high" | "medium" | "low" =>
  score >= 90 ? "high" : score >= 70 ? "medium" : "low";

const priorityConfig = {
  high: { label: "高优先", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "中优先", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  low: { label: "低优先", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
} as const;

interface SubTagCard {
  tag: string;
  subTagValue: string;
  hcpNames: Set<string>;
  latestDate: string;
}

const SignalCenter = () => {
  const [open, setOpen] = useState(false);
  const [readAt, setReadAt] = useState(() => localStorage.getItem(DISMISS_KEY) || "");
  const navigate = useNavigate();
  const { data: signals = [] } = useSignals();
  const { data: nbaActions = [] } = useNBAActions();
  const { data: hcpProfiles = [] } = useHCPProfiles();

  const profileByHcpId = useMemo(() => {
    const m = new Map<string, { name: string; hcp_id: string }>();
    for (const p of hcpProfiles) m.set(p.hcp_id, p);
    return m;
  }, [hcpProfiles]);

  const rawSignals = useMemo(() => {
    return signals
      .filter((s: any) => s.signalType !== "标签变更" && s.createdAt && isWithin7Days(s.createdAt));
  }, [signals]);

  const tagChangeSignals = useMemo(() => {
    return signals.filter((s: any) => s.signalType === "标签变更" && s.createdAt && isWithin7Days(s.createdAt));
  }, [signals]);

  // Flatten into individual sub-tag cards (one card per sub-tag value)
  const subTagCards = useMemo(() => {
    const cards = new Map<string, SubTagCard>();
    for (const s of tagChangeSignals) {
      const tagName = (s as any).tags?.[0] ?? "其他";
      const summary = (s as any).summary ?? "";
      const match = summary.match(/\[(.+?):\s*(.+?)\]/);
      const subTagValue = match ? match[2].trim() : tagName;
      const key = `${tagName}::${subTagValue}`;
      const card = cards.get(key) ?? { tag: tagName, subTagValue, hcpNames: new Set(), latestDate: "" };
      card.hcpNames.add((s as any).hcpName ?? "");
      if ((s as any).createdAt > card.latestDate) card.latestDate = (s as any).createdAt;
      cards.set(key, card);
    }
    return Array.from(cards.values())
      .sort((a, b) => b.latestDate.localeCompare(a.latestDate))
      .slice(0, 8); // limit display count
  }, [tagChangeSignals]);

  // NBA actions within 7 days — deduplicate by hcp_id, sort by time descending
  const recentNBA = useMemo(() => {
    const within7 = nbaActions.filter((a: any) => a.createdAt && isWithin7Days(a.createdAt));
    const byHcpId = new Map<string, any>();
    for (const a of within7) {
      const hcpId = a.hcpId || a.hcpName;
      const existing = byHcpId.get(hcpId);
      if (!existing || (a.score ?? 0) > (existing.score ?? 0)) {
        const profile = a.hcpId ? profileByHcpId.get(a.hcpId) : null;
        byHcpId.set(hcpId, {
          ...a,
          canonicalName: profile?.name ?? a.hcpName,
          resolvedHcpId: a.hcpId || hcpId,
        });
      }
    }
    return Array.from(byHcpId.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [nbaActions, profileByHcpId]);

  const rawCount = rawSignals.length;
  const tagCount = tagChangeSignals.length;
  const nbaCount = recentNBA.length;

  const unreadRaw = useMemo(() => readAt ? rawSignals.filter((s: any) => s.createdAt > readAt).length : rawCount, [rawSignals, readAt, rawCount]);
  const unreadTag = useMemo(() => {
    if (!readAt) return tagCount;
    return tagChangeSignals.filter((s: any) => s.createdAt > readAt).length;
  }, [tagChangeSignals, readAt, tagCount]);
  const unreadNBA = useMemo(() => readAt ? recentNBA.filter((a: any) => a.createdAt > readAt).length : nbaCount, [recentNBA, readAt, nbaCount]);
  const totalUnread = unreadRaw + unreadTag + unreadNBA;

  const defaultTab = useMemo(() => {
    if (unreadRaw > 0) return "raw";
    if (unreadTag > 0) return "tag";
    if (unreadNBA > 0) return "micro";
    return "raw";
  }, [unreadRaw, unreadTag, unreadNBA]);

  const handleDismiss = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(DISMISS_KEY, now);
    setReadAt(now);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          <Radio className="w-[18px] h-[18px]" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {Math.min(totalUnread, 9)}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto">
        <SheetHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              <SheetTitle className="text-base">信号中心</SheetTitle>
            </div>
            {totalUnread > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground" onClick={handleDismiss}>
                <CheckCheck className="w-3.5 h-3.5" />
                我知道了
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="mt-2">
          <TabsList className="w-full grid grid-cols-3 h-9">
            <TabsTrigger value="raw" className="text-xs gap-1">
              原始信号
              {unreadRaw > 0 && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 min-w-4 justify-center">{unreadRaw}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tag" className="text-xs gap-1">
              标签异动
              {unreadTag > 0 && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 min-w-4 justify-center">{unreadTag}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="micro" className="text-xs gap-1">
              待办任务
              {unreadNBA > 0 && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 min-w-4 justify-center">{unreadNBA}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Raw signals */}
          <TabsContent value="raw" className="mt-3 space-y-2">
            {rawSignals.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">近7日暂无原始信号</div>
            ) : (
              rawSignals.map((s: any) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    const tab = signalTypeToTab[s.signalType] ?? "publications";
                    if (s.hcpId) navigate(`/hcp/${s.hcpId}?tab=${tab}`);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon(s.signalType)}
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">{s.signalType}</span>
                    <div className="ml-auto">
                      {s.createdAt && <SmartDateLabel dateStr={s.createdAt} />}
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-foreground mb-0.5">{s.hcpName}</p>
                  <p className="text-[11px] text-muted-foreground">{s.summary ?? `${s.hcpName} - ${s.signalType}`}</p>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tag changes — each card is one specific sub-tag value */}
          <TabsContent value="tag" className="mt-3 space-y-2">
            {subTagCards.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">近7日暂无标签异动</div>
            ) : (
              subTagCards.map((card) => (
                <div
                  key={`${card.tag}::${card.subTagValue}`}
                  className="p-3 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/hcp-list?tag=${encodeURIComponent(card.subTagValue)}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Tags className="w-3.5 h-3.5 text-primary" />
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {card.subTagValue}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{card.tag}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {card.latestDate && <SmartDateLabel dateStr={card.latestDate} />}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    新增 {card.hcpNames.size} 位HCP：{Array.from(card.hcpNames).slice(0, 3).join("、")}{card.hcpNames.size > 3 && " 等"}
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          {/* NBA tasks */}
          <TabsContent value="micro" className="mt-3 space-y-2">
            {recentNBA.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">近7日暂无待办任务</div>
            ) : (
              recentNBA.map((a: any) => {
                const derivedPriority = scoreToPriority(a.score ?? 0);
                const pConfig = priorityConfig[derivedPriority];
                return (
                  <div
                    key={a.resolvedHcpId}
                    className="p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => { setOpen(false); navigate(`/feed#hcp-${encodeURIComponent(a.resolvedHcpId)}`); }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{a.canonicalName}</span>
                      <div className="flex items-center gap-2">
                        {a.createdAt && <SmartDateLabel dateStr={a.createdAt} />}
                        <span className="text-[10px] font-mono text-muted-foreground">评分 {a.score}</span>
                        <span className={`inline-flex items-center text-[9px] font-semibold px-1.5 py-0 rounded-full border ${pConfig.className}`}>
                          {pConfig.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-primary" />
                      {a.action}
                    </p>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default SignalCenter;
