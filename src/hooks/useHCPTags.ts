import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DBTag {
  id: string;
  hcp_id: string;
  tag_category: string;
  tag_key: string;
  tag_value: string;
  source: string;
  confidence: number | null;
  created_at: string;
}

const TAG_QUERY_KEY = ["hcp_tags"];

export function useHCPTagsAll() {
  return useQuery({
    queryKey: TAG_QUERY_KEY,
    queryFn: async (): Promise<DBTag[]> => {
      const { data, error } = await supabase
        .from("hcp_tags")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DBTag[];
    },
  });
}

export function useHCPTagsByHcpId(hcpId: string) {
  return useQuery({
    queryKey: [...TAG_QUERY_KEY, hcpId],
    queryFn: async (): Promise<DBTag[]> => {
      const { data, error } = await supabase
        .from("hcp_tags")
        .select("*")
        .eq("hcp_id", hcpId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DBTag[];
    },
    enabled: !!hcpId,
  });
}

interface InsertTagPayload {
  hcp_id: string;
  tag_category: string;
  tag_key: string;
  tag_value: string;
  source?: string;
  confidence?: number;
}

export function useInsertHCPTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tags: InsertTagPayload[]) => {
      if (tags.length === 0) return [];
      const { data, error } = await supabase
        .from("hcp_tags")
        .insert(tags as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TAG_QUERY_KEY }),
  });
}

/** Execute tag rules against the database and return matching hcp_ids */
export async function executeTagRules(
  fields: Array<{
    name: string;
    groupConnector: "AND" | "OR";
    conditionGroups: Array<{
      connector: "AND" | "OR";
      conditions: Array<{
        table: string;
        field: string;
        operator: string;
        value: string;
      }>;
    }>;
  }>
): Promise<string[]> {
  // Collect all matching hcp_ids across fields (AND between fields)
  let finalIds: Set<string> | null = null;

  for (const field of fields) {
    let fieldIds: Set<string> | null = null;

    for (const group of field.conditionGroups) {
      let groupIds: Set<string> | null = null;

      for (const cond of group.conditions) {
        if (!cond.table || !cond.field || cond.operator === "AI提取") continue;

        const matchedIds = await queryCondition(cond);

        if (groupIds === null) {
          groupIds = matchedIds;
        } else if (group.connector === "AND") {
          groupIds = intersect(groupIds, matchedIds);
        } else {
          groupIds = union(groupIds, matchedIds);
        }
      }

      if (groupIds === null) continue;

      if (fieldIds === null) {
        fieldIds = groupIds;
      } else if (field.groupConnector === "AND") {
        fieldIds = intersect(fieldIds, groupIds);
      } else {
        fieldIds = union(fieldIds, groupIds);
      }
    }

    if (fieldIds === null) continue;

    if (finalIds === null) {
      finalIds = fieldIds;
    } else {
      finalIds = intersect(finalIds, fieldIds);
    }
  }

  return finalIds ? Array.from(finalIds) : [];
}

async function queryCondition(cond: {
  table: string;
  field: string;
  operator: string;
  value: string;
}): Promise<Set<string>> {
  const { table, field, operator, value } = cond;

  // Build query - we only need hcp_id
  let query = supabase.from(table as any).select("hcp_id");

  switch (operator) {
    case "=":
      query = query.eq(field, value);
      break;
    case "!=":
      query = query.neq(field, value);
      break;
    case ">":
      query = query.gt(field, value);
      break;
    case ">=":
      query = query.gte(field, value);
      break;
    case "<":
      query = query.lt(field, value);
      break;
    case "<=":
      query = query.lte(field, value);
      break;
    case "包含":
      query = query.ilike(field, `%${value}%`);
      break;
    case "不包含":
      // Supabase doesn't have "not ilike" directly, use not filter
      query = query.not(field, "ilike", `%${value}%`);
      break;
    case "为空":
      query = query.is(field, null);
      break;
    case "不为空":
      query = query.not(field, "is", null);
      break;
    default:
      query = query.eq(field, value);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Tag rule query error:", error);
    return new Set();
  }

  return new Set((data ?? []).map((row: any) => row.hcp_id));
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const v of a) {
    if (b.has(v)) result.add(v);
  }
  return result;
}

function union(a: Set<string>, b: Set<string>): Set<string> {
  return new Set([...a, ...b]);
}
