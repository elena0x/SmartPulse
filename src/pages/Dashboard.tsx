import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useHCPProfiles } from "@/hooks/useHCPProfiles";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useSignals, useNBAActions } from "@/hooks/useDataService";
import { useHCPTagsAll } from "@/hooks/useHCPTags";
import {
  Zap, Users, Tag, TrendingUp, Database,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import ChinaMapChart from "@/components/dashboard/ChinaMapChart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const totalHcpInGBI = 213800;

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

/** Fetch counts from business data tables */
function useBusinessDataCounts() {
  return useQuery({
    queryKey: ["business_data_counts"],
    queryFn: async () => {
      const [pubs, trials, grants, guidelines, conferences, areas] = await Promise.all([
        supabase.from("hcp_publications").select("id", { count: "exact", head: true }),
        supabase.from("hcp_trials").select("id", { count: "exact", head: true }),
        supabase.from("hcp_grants").select("id", { count: "exact", head: true }),
        supabase.from("hcp_guidelines").select("id", { count: "exact", head: true }),
        supabase.from("hcp_conferences").select("id", { count: "exact", head: true }),
        supabase.from("hcp_research_areas").select("id", { count: "exact", head: true }),
      ]);
      return {
        publications: pubs.count ?? 0,
        trials: trials.count ?? 0,
        grants: grants.count ?? 0,
        guidelines: guidelines.count ?? 0,
        conferences: conferences.count ?? 0,
        researchAreas: areas.count ?? 0,
        total: (pubs.count ?? 0) + (trials.count ?? 0) + (grants.count ?? 0) + (guidelines.count ?? 0) + (conferences.count ?? 0) + (areas.count ?? 0),
      };
    },
  });
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: allHcpProfiles = [] } = useHCPProfiles();
  const { data: subscriptions = [] } = useUserSubscriptions();
  const { data: signalsData = [] } = useSignals();
  const { data: nbaActions = [] } = useNBAActions();
  const { data: dbTags = [] } = useHCPTagsAll();
  const { data: bizCounts } = useBusinessDataCounts();

  const subscribedIds = useMemo(() => new Set(subscriptions.map(s => s.hcp_id)), [subscriptions]);
  const hcpProfiles = useMemo(() => allHcpProfiles.filter(h => subscribedIds.has(h.hcp_id)), [allHcpProfiles, subscribedIds]);
  const subscribedCount = hcpProfiles.length;

  const recentSignals = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return signalsData.filter((s: any) => s.signalType !== "标签变更" && new Date(s.createdAt) > cutoff);
  }, [signalsData]);

  const tagChangeCount = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return dbTags.filter(t => new Date(t.created_at) > cutoff).length;
  }, [dbTags]);

  const dataSourceDistribution = useMemo(() => [
    { name: "学术论文", value: bizCounts?.publications ?? 0, fill: "hsl(var(--primary))" },
    { name: "临床试验", value: bizCounts?.trials ?? 0, fill: "hsl(var(--accent))" },
    { name: "基金项目", value: bizCounts?.grants ?? 0, fill: "hsl(var(--muted-foreground))" },
    { name: "临床指南", value: bizCounts?.guidelines ?? 0, fill: "hsl(var(--border))" },
    { name: "学术会议", value: bizCounts?.conferences ?? 0, fill: "hsl(var(--secondary-foreground))" },
    { name: "研究领域", value: bizCounts?.researchAreas ?? 0, fill: "hsl(var(--destructive))" },
  ], [bizCounts]);

  const regionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of hcpProfiles) {
      const region = p.province || p.city || "未知";
      if (region) counts[region] = (counts[region] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [hcpProfiles]);

  const trackedHcpActivity = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    for (const s of signalsData) {
      const type = (s as any).signalType ?? "其他";
      if (type === "标签变更") continue;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    return Object.entries(typeCounts).map(([name, count]) => ({ name, 动态数: count }));
  }, [signalsData]);

  const scoreRisers = useMemo(() => {
    const seen = new Set<string>();
    return nbaActions
      .filter((a: any) => {
        if (seen.has(a.hcpName)) return false;
        seen.add(a.hcpName);
        return true;
      })
      .slice(0, 10)
      .map((a: any) => ({
        name: a.hcpName,
        score: a.score ?? 0,
        action: a.action,
        hcpId: a.hcpId,
      }));
  }, [nbaActions]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">全局总览</h1>
          <p className="text-sm text-muted-foreground mt-1">数据监控 · 专家追踪 · 信号概览</p>
        </div>

        {/* Stat Cards — 4 columns: 原始信号, 覆盖HCP, 标签变动, 业务数据集 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="原始信号"
            value={recentSignals.length}
            change="近 7 天新增学术异动"
            changeType="neutral"
            icon={Zap}
            gradient
            onClick={() => navigate("/feed")}
          />
          <StatCard
            title="覆盖 HCP"
            value={
              <span>
                {subscribedCount}
                <span className="text-base font-normal text-muted-foreground"> / {totalHcpInGBI.toLocaleString()}</span>
              </span>
            }
            change={`已订阅 ${subscribedCount} 位 · 可订阅 ${totalHcpInGBI.toLocaleString()} 位`}
            changeType="neutral"
            icon={Users}
            onClick={() => navigate("/hcp-list")}
          />
          <StatCard
            title="标签变动"
            value={tagChangeCount}
            change="近 7 日标签变动记录"
            changeType="neutral"
            icon={Tag}
            onClick={() => navigate("/tag-management")}
          />
          <StatCard
            title="业务数据集"
            value={bizCounts?.total ?? 0}
            change={`论文 ${bizCounts?.publications ?? 0} · 试验 ${bizCounts?.trials ?? 0} · 基金 ${bizCounts?.grants ?? 0}`}
            changeType="positive"
            icon={Database}
            onClick={() => navigate("/business-data")}
          />
        </div>

        {/* Row 1: 3 panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated p-5 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            onClick={() => navigate("/business-data")}
          >
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-card-foreground">数据概览</h3>
              <p className="text-[11px] text-muted-foreground">业务数据统计</p>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie
                    data={dataSourceDistribution}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={58}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {dataSourceDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {dataSourceDistribution.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-card-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-5 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            onClick={() => navigate("/hcp-list")}
          >
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-card-foreground">订阅专家科室分布</h3>
              <p className="text-[11px] text-muted-foreground">按标准科室统计订阅专家</p>
            </div>
            {(() => {
              const deptCounts: Record<string, number> = {};
              for (const p of hcpProfiles) {
                const dept = p.standard_department || "未知";
                deptCounts[dept] = (deptCounts[dept] || 0) + 1;
              }
              const deptData = Object.entries(deptCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);
              const fills = [
                "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))",
                "hsl(var(--secondary-foreground))", "hsl(var(--border))", "hsl(var(--destructive))",
              ];
              return (
                <div className="flex items-center gap-3 mt-3">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie data={deptData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={58} paddingAngle={2} strokeWidth={0}>
                        {deptData.map((_, idx) => <Cell key={idx} fill={fills[idx % fills.length]} />)}
                      </Pie>
                      <ReTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 flex-1">
                    {deptData.map((d, idx) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fills[idx % fills.length] }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-mono text-card-foreground">{d.value} 人</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-elevated p-5 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            onClick={() => navigate("/feed")}
          >
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-card-foreground">信号动态分布</h3>
              <p className="text-[11px] text-muted-foreground">
                近期信号 <span className="font-semibold text-card-foreground">{signalsData.length}</span> 条
              </p>
            </div>
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={trackedHcpActivity} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={35} />
                <ReTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="动态数" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Row 2: 2 panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            onClick={() => navigate("/hcp-list")}
          >
            <div className="mb-1">
              <h3 className="text-sm font-semibold text-card-foreground">区域分布</h3>
              <p className="text-[11px] text-muted-foreground">订阅专家地理位置分布</p>
            </div>
            <ChinaMapChart data={regionDistribution} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-elevated p-4"
          >
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                行动优先榜
              </h3>
              <p className="text-[11px] text-muted-foreground">根据 AI 评分排名的 Top 10 专家</p>
            </div>
            <div className="space-y-1.5">
              {scoreRisers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">暂无评分数据，请先执行专家打分</p>
              ) : (
                scoreRisers.map((h, i) => (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/40 rounded-md px-1 py-0.5 transition-colors"
                    onClick={() => h.hcpId && navigate(`/hcp/${h.hcpId}`)}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-card-foreground w-16 truncate">{h.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${(h.score / 100) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-primary font-semibold w-8 text-right">{h.score}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{h.action}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard;
