import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tableSchema = `
Available tables and fields:
- hcp_profiles: name, gender, province, city, institution, hospital_category, professional_title, admin_title, supervisor_title, standard_department, raw_department, education, expertise, other_institutions
- hcp_publications: title, journal, impact_factor, citations, published_date, authors, doi
- hcp_guidelines: title, organization, role, status, year
- hcp_trials: title, phase, status, role, start_date, end_date, registration_id
- hcp_grants: title, amount, funding_body, role, status, period
- hcp_conferences: name, role, topic, location, conference_date
- hcp_research_areas: name, area_type, level, company
- hcp_news: title, source, published_date, summary
- hcp_activities: title, activity_type, activity_date

Available operators: =, !=, >, >=, <, <=, 包含, 不包含, 为空, 不为空
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a tag rule generator for a pharmaceutical HCP (Healthcare Professional) intelligence platform. Given a natural language description, generate tag fields with condition rules.

${tableSchema}

Return a JSON object with this structure:
{
  "name": "tag name",
  "categoryId": "suggested category id (one of: basic-demo, basic-prof, behavior-academic, behavior-visit, pref-channel, pref-content, risk-compliance)",
  "fields": [
    {
      "name": "field value name",
      "description": "field description",
      "groupConnector": "AND" or "OR",
      "conditionGroups": [
        {
          "connector": "AND" or "OR",
          "conditions": [
            { "table": "table_name", "field": "field_name", "operator": "operator", "value": "value" }
          ]
        }
      ]
    }
  ]
}

Always respond with valid JSON only, no markdown or extra text.`
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_tag_rules",
              description: "Generate tag rules based on user description",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Tag name" },
                  categoryId: { type: "string", enum: ["basic-demo", "basic-prof", "behavior-academic", "behavior-visit", "pref-channel", "pref-content", "risk-compliance"] },
                  fields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        groupConnector: { type: "string", enum: ["AND", "OR"] },
                        conditionGroups: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              connector: { type: "string", enum: ["AND", "OR"] },
                              conditions: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    table: { type: "string" },
                                    field: { type: "string" },
                                    operator: { type: "string" },
                                    value: { type: "string" }
                                  },
                                  required: ["table", "field", "operator", "value"]
                                }
                              }
                            },
                            required: ["connector", "conditions"]
                          }
                        }
                      },
                      required: ["name", "description", "groupConnector", "conditionGroups"]
                    }
                  }
                },
                required: ["name", "categoryId", "fields"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_tag_rules" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求频率限制，请稍后重试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "额度不足，请充值" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI服务异常" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const rules = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
      return new Response(JSON.stringify(rules), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "无法解析AI返回结果" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-tag-rules error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
