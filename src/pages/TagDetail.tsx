import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Save, FlaskConical, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  allTags, tagCategories, TagDef, TagField, ConditionGroup, ConditionItem,
  TagProductionMethod, TagUpdateMethod, TagUpdateCycle,
  tableFieldMapping, getCategoryLabel,
} from "@/data/tagManagementData";
import { executeTagRules, useInsertHCPTags } from "@/hooks/useHCPTags";

const operators = ["=", "!=", ">", ">=", "<", "<=", "包含", "不包含", "为空", "不为空", "AI提取"];

interface TagConfig {
  name: string;
  categoryId: string;
  productionMethod: TagProductionMethod;
  updateMethod: TagUpdateMethod;
  updateCycle: TagUpdateCycle | "";
  fields: TagField[];
}

const TagDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const existingTag = useMemo(() => isNew ? null : allTags.find(t => t.id === id) ?? null, [id, isNew]);

  const [config, setConfig] = useState<TagConfig>({
    name: existingTag?.name ?? "",
    categoryId: existingTag?.categoryId ?? "",
    productionMethod: existingTag?.productionMethod ?? "业务规则",
    updateMethod: existingTag?.updateMethod ?? "手动更新",
    updateCycle: existingTag?.updateCycle ?? "",
    fields: existingTag?.fields ?? [],
  });

  const [activeFieldTab, setActiveFieldTab] = useState("0");
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
  const [aiExtractLoading, setAiExtractLoading] = useState(false);
  const [ruleExecuting, setRuleExecuting] = useState(false);
  const insertTagsMutation = useInsertHCPTags();

  const categoryOptions = useMemo(() => {
    const opts: { id: string; label: string; parent: string }[] = [];
    for (const cat of tagCategories) {
      for (const child of cat.children ?? []) {
        opts.push({ id: child.id, label: child.label, parent: cat.label });
      }
    }
    return opts;
  }, []);

  const getFieldsForTable = (tableName: string) => {
    return tableFieldMapping.find(t => t.table === tableName)?.fields ?? [];
  };

  const updateConfig = useCallback((updates: Partial<TagConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFields = useCallback((updater: (fields: TagField[]) => TagField[]) => {
    setConfig(prev => ({ ...prev, fields: updater(prev.fields) }));
  }, []);

  // Field operations
  const addField = () => {
    updateFields(fields => {
      const newFields = [...fields, {
        name: "", description: "", groupConnector: "AND" as const,
        conditionGroups: [{ connector: "AND" as const, conditions: [{ table: "", field: "", operator: "=", value: "" }] }],
      }];
      setActiveFieldTab(String(newFields.length - 1));
      return newFields;
    });
  };

  const removeField = (fi: number) => {
    if (config.fields.length <= 1) { toast.error("至少保留一个字段"); return; }
    updateFields(fields => fields.filter((_, i) => i !== fi));
    setActiveFieldTab(prev => {
      const idx = parseInt(prev);
      if (idx >= config.fields.length - 1) return String(Math.max(0, config.fields.length - 2));
      if (idx > fi) return String(idx - 1);
      return prev;
    });
  };

  const updateField = (fi: number, updates: Partial<TagField>) => {
    updateFields(fields => fields.map((f, i) => i === fi ? { ...f, ...updates } : f));
  };

  const addConditionGroup = (fi: number) => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: [...f.conditionGroups, { connector: "AND" as const, conditions: [{ table: "", field: "", operator: "=", value: "" }] }],
    } : f));
  };

  const removeConditionGroup = (fi: number, gi: number) => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: f.conditionGroups.filter((_, j) => j !== gi),
    } : f));
  };

  const updateGroupConnector = (fi: number, gi: number, connector: "AND" | "OR") => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: f.conditionGroups.map((g, j) => j === gi ? { ...g, connector } : g),
    } : f));
  };

  const addCondition = (fi: number, gi: number) => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: f.conditionGroups.map((g, j) => j === gi ? {
        ...g, conditions: [...g.conditions, { table: "", field: "", operator: "=", value: "" }],
      } : g),
    } : f));
  };

  const removeCondition = (fi: number, gi: number, ci: number) => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: f.conditionGroups.map((g, j) => j === gi ? {
        ...g, conditions: g.conditions.filter((_, k) => k !== ci),
      } : g),
    } : f));
  };

  const updateCondition = (fi: number, gi: number, ci: number, updates: Partial<ConditionItem>) => {
    updateFields(fields => fields.map((f, i) => i === fi ? {
      ...f, conditionGroups: f.conditionGroups.map((g, j) => j === gi ? {
        ...g, conditions: g.conditions.map((c, k) => {
          if (k !== ci) return c;
          const merged = { ...c, ...updates };
          if (updates.table && updates.table !== c.table) merged.field = "";
          return merged;
        }),
      } : g),
    } : f));
  };

  // Check if any condition uses AI提取
  const hasAiExtractConditions = useMemo(() => {
    return config.fields.some(f =>
      f.conditionGroups.some(g =>
        g.conditions.some(c => c.operator === "AI提取")
      )
    );
  }, [config.fields]);

  // Execute AI extraction for all AI提取 conditions
  const executeAiExtraction = async () => {
    setAiExtractLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (let fi = 0; fi < config.fields.length; fi++) {
      const field = config.fields[fi];
      for (let gi = 0; gi < field.conditionGroups.length; gi++) {
        const group = field.conditionGroups[gi];
        for (let ci = 0; ci < group.conditions.length; ci++) {
          const cond = group.conditions[ci];
          if (cond.operator !== "AI提取") continue;
          if (!cond.table || !cond.field) { failCount++; continue; }

          const tableDef = tableFieldMapping.find(t => t.table === cond.table);
          const fieldDef = tableDef?.fields.find(f => f.name === cond.field);

          try {
            const prompt = `基于以下信息，为该条件生成提取规则：
标签名称：${config.name || "（未填写）"}
字段名称：${field.name || "（未填写）"}
字段描述：${field.description || "（未填写）"}
数据表：${tableDef?.label || cond.table}
被提取字段：${fieldDef?.label || cond.field}

请基于该数据表的该字段，生成提取条件的operator和value。`;

            const { data, error } = await supabase.functions.invoke("generate-tag-rules", {
              body: { prompt },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data.fields?.[0]?.conditionGroups?.[0]?.conditions?.[0]) {
              const extracted = data.fields[0].conditionGroups[0].conditions[0];
              updateCondition(fi, gi, ci, {
                operator: extracted.operator || "=",
                value: extracted.value || "",
              });
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }
      }
    }

    setAiExtractLoading(false);
    setConfirmUpdateOpen(false);

    if (successCount > 0) toast.success(`AI已提取 ${successCount} 条规则`);
    if (failCount > 0) toast.warning(`${failCount} 条规则提取失败，请手动配置`);

    toast.success(isNew ? "标签创建成功" : "标签配置已保存");
    navigate("/tag-management");
  };

  /** Execute rules against DB and write matching tags to hcp_tags */
  const executeRulesAndWriteTags = async () => {
    setRuleExecuting(true);
    try {
      const matchedHcpIds = await executeTagRules(config.fields);
      if (matchedHcpIds.length === 0) {
        toast.warning("未找到匹配的 HCP，标签已保存但无数据写入");
        setRuleExecuting(false);
        navigate("/tag-management");
        return;
      }

      const categoryLabel = getCategoryLabel(config.categoryId);
      const tagPayloads = matchedHcpIds.map(hcpId => ({
        hcp_id: hcpId,
        tag_category: categoryLabel || config.categoryId,
        tag_key: config.name,
        tag_value: config.fields.map(f => f.name).filter(Boolean).join(", ") || "是",
        source: "rule",
        confidence: 0.9,
      }));

      await insertTagsMutation.mutateAsync(tagPayloads);
      toast.success(`标签已写入，匹配 ${matchedHcpIds.length} 位 HCP`);
    } catch (err: any) {
      toast.error("规则执行失败: " + (err?.message || "未知错误"));
    } finally {
      setRuleExecuting(false);
      navigate("/tag-management");
    }
  };

  const handleSave = () => {
    if (!config.name.trim()) { toast.error("标签名称不能为空"); return; }
    if (!config.categoryId) { toast.error("请选择标签目录"); return; }

    if (hasAiExtractConditions) {
      setConfirmUpdateOpen(true);
      return;
    }

    // Has regular rules — ask if user wants to execute
    const hasRules = config.fields.some(f =>
      f.conditionGroups.some(g =>
        g.conditions.some(c => c.table && c.field && c.value)
      )
    );

    if (hasRules) {
      setConfirmUpdateOpen(true);
      return;
    }

    toast.success(isNew ? "标签创建成功" : "标签配置已保存");
    navigate("/tag-management");
  };

  const handleConfirmUpdate = () => {
    if (hasAiExtractConditions) {
      executeAiExtraction();
    } else {
      executeRulesAndWriteTags();
    }
  };

  const handleSkipUpdate = () => {
    setConfirmUpdateOpen(false);
    toast.success(isNew ? "标签创建成功（未执行规则）" : "标签配置已保存（未执行规则）");
    navigate("/tag-management");
  };

  return (
    <AppLayout>
      <div className="max-w-[1000px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/tag-management")} className="gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> 返回
            </Button>
            <h1 className="text-lg font-bold text-foreground">
              {isNew ? "新建标签" : "配置标签"}
            </h1>
          </div>
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="w-4 h-4" /> 保存
          </Button>
        </div>

        {/* Basic info */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">基本信息</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="font-medium">标签名称 *</Label>
                <Input placeholder="请输入标签名称" value={config.name} onChange={e => updateConfig({ name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">标签目录 *</Label>
                <Select value={config.categoryId} onValueChange={v => updateConfig({ categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择目录" /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.parent} / {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">更新方式</Label>
                <Select value={config.updateMethod} onValueChange={v => updateConfig({ updateMethod: v as TagUpdateMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="手动更新">手动更新</SelectItem>
                    <SelectItem value="定时更新">定时更新</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.updateMethod === "定时更新" && (
                <div className="space-y-2">
                  <Label className="font-medium">更新周期</Label>
                  <Select value={config.updateCycle} onValueChange={v => updateConfig({ updateCycle: v as TagUpdateCycle })}>
                    <SelectTrigger><SelectValue placeholder="选择周期" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="每日">每日</SelectItem>
                      <SelectItem value="每周">每周</SelectItem>
                      <SelectItem value="每月">每月</SelectItem>
                      <SelectItem value="每季度">每季度</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tag fields / rules */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">标签规则（字段定义）</h2>
              <Button variant="outline" size="sm" onClick={addField} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> 添加字段
              </Button>
            </div>

            {config.fields.length === 0 && (
              <div className="text-center py-10 text-sm text-muted-foreground">
                暂无标签字段，点击「添加字段」开始配置
              </div>
            )}

            {config.fields.length > 0 && (
              <Tabs value={activeFieldTab} onValueChange={setActiveFieldTab}>
                <div className="flex items-center gap-2">
                  <TabsList className="flex-1 justify-start h-auto flex-wrap">
                    {config.fields.map((field, fi) => (
                      <TabsTrigger key={fi} value={String(fi)} className="relative group gap-1.5 text-xs">
                        {field.name || `字段 ${fi + 1}`}
                        {config.fields.length > 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); removeField(fi); }}
                            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {config.fields.map((field, fi) => (
                  <TabsContent key={fi} value={String(fi)} className="mt-4 space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Field name & description */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">字段名称</Label>
                          <Input placeholder="如：高投诉风险" value={field.name} onChange={e => updateField(fi, { name: e.target.value })} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">字段描述</Label>
                          <Input placeholder="描述该字段值的含义" value={field.description} onChange={e => updateField(fi, { description: e.target.value })} className="h-8 text-sm" />
                        </div>
                      </div>

                      {/* Condition groups */}
                      <div className="space-y-3">
                        {field.conditionGroups.map((group, gi) => (
                          <div key={gi}>
                            {gi > 0 && (
                              <div className="flex items-center justify-center my-2">
                                <Select value={field.groupConnector} onValueChange={v => updateField(fi, { groupConnector: v as "AND" | "OR" })}>
                                  <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">且(AND)</SelectItem>
                                    <SelectItem value="OR">或(OR)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="bg-muted/30 rounded-lg p-3 space-y-2 relative">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">条件组 {gi + 1}</Badge>
                                  <Select value={group.connector} onValueChange={v => updateGroupConnector(fi, gi, v as "AND" | "OR")}>
                                    <SelectTrigger className="w-24 h-6 text-[11px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AND">且(AND)</SelectItem>
                                      <SelectItem value="OR">或(OR)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 text-[11px] text-primary" onClick={() => addCondition(fi, gi)}>
                                    <Plus className="w-3 h-3 mr-0.5" /> 条件
                                  </Button>
                                  {field.conditionGroups.length > 1 && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeConditionGroup(fi, gi)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {group.conditions.map((cond, ci) => {
                                const availableFields = getFieldsForTable(cond.table);
                                return (
                                  <div key={ci} className="flex items-center gap-2">
                                    <Select value={cond.table} onValueChange={v => updateCondition(fi, gi, ci, { table: v })}>
                                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="选择数据表" /></SelectTrigger>
                                      <SelectContent>
                                        {tableFieldMapping.map(t => (
                                          <SelectItem key={t.table} value={t.table}>{t.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select value={cond.field} onValueChange={v => updateCondition(fi, gi, ci, { field: v })} disabled={!cond.table}>
                                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="选择字段" /></SelectTrigger>
                                      <SelectContent>
                                        {availableFields.map(f => (
                                          <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select value={cond.operator} onValueChange={v => updateCondition(fi, gi, ci, { operator: v })}>
                                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {operators.filter(op => op !== "AI提取").map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                                        <SelectItem value="AI提取" className="text-primary">
                                          <span className="flex items-center gap-1">
                                            <FlaskConical className="w-3 h-3" /> AI提取
                                            <span className="text-[9px] px-1 py-0 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">测试</span>
                                          </span>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {cond.operator !== "AI提取" && (
                                      <Input placeholder="值" value={cond.value} onChange={e => updateCondition(fi, gi, ci, { value: e.target.value })} className="flex-1 h-8 text-xs" />
                                    )}
                                    {cond.operator === "AI提取" && (
                                      <div className="flex-1 h-8 flex items-center text-xs text-muted-foreground italic">
                                        保存后由AI自动提取
                                      </div>
                                    )}
                                    {group.conditions.length > 1 && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeCondition(fi, gi, ci)}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => addConditionGroup(fi)}>
                          <Plus className="w-3 h-3" /> 添加条件组
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm AI Update Dialog */}
      <Dialog open={confirmUpdateOpen} onOpenChange={setConfirmUpdateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              是否执行AI提取？
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              {hasAiExtractConditions
                ? "检测到标签规则中包含 AI 提取条件。是否立即执行 AI 提取并更新标签？"
                : "标签规则已配置完成。是否立即执行规则匹配，将结果写入数据库？"}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasAiExtractConditions
                ? "选择「更新标签」将调用 AI 自动提取规则值；选择「仅保存」将保留配置但不执行。"
                : "选择「更新标签」将根据规则查询匹配的 HCP 并写入标签；选择「仅保存」只保存配置。"}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleSkipUpdate} disabled={aiExtractLoading || ruleExecuting}>
              仅保存
            </Button>
            <Button onClick={handleConfirmUpdate} disabled={aiExtractLoading || ruleExecuting} className="gap-1.5">
              {(aiExtractLoading || ruleExecuting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              {(aiExtractLoading || ruleExecuting) ? "执行中..." : "更新标签"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default TagDetail;
