import { HCPRecord } from "@/data/hcpListData";
import { signals, interactionHistory } from "@/data/mockData";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, BookOpen, Award, Calendar, FileText } from "lucide-react";

interface Props {
  hcp: HCPRecord | null;
  onClose: () => void;
}

// Match HCP record to signal data for academic stats
const getSignalData = (name: string) =>
  signals.find((s) => s.hcpName.includes(name)) ?? null;

const HCPDetailDialog = ({ hcp, onClose }: Props) => {
  if (!hcp) return null;
  const signal = getSignalData(hcp.name);

  return (
    <Dialog open={!!hcp} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-foreground">{hcp.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-card-foreground">{hcp.name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {hcp.hcpId} · {hcp.institution} · {hcp.standardDepartment}
              </p>
              {signal && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {signal.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/8 text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {signal && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">产品亲和度</p>
                <p className="text-2xl font-bold font-mono text-primary">{(signal.affinity * 100).toFixed(0)}%</p>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-4 p-4 rounded-lg bg-muted/40">
          {([
            ["性别", hcp.gender],
            ["省份 / 城市", `${hcp.province} · ${hcp.city}`],
            ["医院分类", hcp.hospitalCategory],
            ["专业头衔", hcp.professionalTitle],
            ["原始科室", hcp.rawDepartment],
            ["标准科室", hcp.standardDepartment],
            ["行政头衔", hcp.adminTitle],
            ["学历", hcp.education],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-medium text-card-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Left Column: Academic + Dimensions */}
          <div className="space-y-4">
            {signal && (
              <div className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-card-foreground">学术图谱</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">PubMed 论文</p>
                    <p className="text-xl font-bold font-mono text-card-foreground">{signal.publications}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">临床试验</p>
                    <p className="text-xl font-bold font-mono text-card-foreground">{signal.trials}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-card-foreground">多维评估</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "学术影响力", value: signal ? 95 : 60 },
                  { label: "处方倾向", value: signal ? 78 : 55 },
                  { label: "合作意愿", value: signal ? 88 : 70 },
                  { label: "竞品关联度", value: signal ? 42 : 35 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-card-foreground">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Info */}
            <div className="card-elevated p-4 space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">擅长领域</p>
                <p className="text-sm text-card-foreground">{hcp.expertise}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">其他现任机构</p>
                <p className="text-sm text-card-foreground">{hcp.otherInstitutions}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">官网</p>
                {hcp.officialWebsite !== "—" ? (
                  <a href={hcp.officialWebsite} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    {hcp.officialWebsite} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Resume + Interactions + Publications */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-elevated p-4">
              <p className="text-[11px] text-muted-foreground mb-1">简历</p>
              <p className="text-sm text-card-foreground leading-relaxed">{hcp.resume}</p>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-card-foreground">全渠道互动历史</h3>
              </div>
              <div className="space-y-2">
                {interactionHistory.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-card-foreground">{item.type}</span>
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${item.satisfaction === "高" ? "signal-badge-low" : "signal-badge-medium"}`}>
                          满意度: {item.satisfaction}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-card-foreground">近期学术动态</h3>
              </div>
              <div className="space-y-2">
                {[
                  { title: "PD-1 联合化疗在晚期 NSCLC 中的 III 期临床研究", journal: "Lancet Oncology", date: "2026-03-08", impact: "IF 51.1" },
                  { title: "免疫检查点抑制剂耐药机制的系统综述", journal: "Nature Reviews Cancer", date: "2026-02-14", impact: "IF 78.5" },
                  { title: "基于 ctDNA 的微小残留病灶监测", journal: "JCO", date: "2026-01-20", impact: "IF 45.3" },
                ].map((pub, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <p className="text-sm font-medium text-card-foreground">{pub.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-primary font-medium">{pub.journal}</span>
                      <span className="text-[10px] text-muted-foreground">{pub.date}</span>
                      <span className="text-[10px] font-mono text-accent">{pub.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HCPDetailDialog;
