import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ActivityItem {
  type: string;
  date: string;
  title: string;
}

interface NBARequest {
  hcpName: string;
  activities: ActivityItem[];
  priority: string;
  channel: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { requests } = (await req.json()) as { requests: NBARequest[] };

    if (!requests || requests.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const listing = requests
      .map((r, i) => {
        const acts = r.activities
          .slice(0, 6)
          .map((a) => `  - [${a.type}] ${a.date}: ${a.title}`)
          .join("\n");
        return `${i}. 专家：${r.hcpName}（优先级：${r.priority}，推荐渠道：${r.channel}）\n近期动态：\n${acts || "  无近期动态"}`;
      })
      .join("\n\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content:
                "你是医药行业NBA（Next Best Action）建议生成AI。根据每位HCP的近3个月动态，生成具体、可执行的行动建议。要求：1）严格基于提供的近期动态内容，不要编造数据；2）建议内容与动态高度相关；3）每条建议不超过200字；4）包含具体行动步骤和时间建议。",
            },
            {
              role: "user",
              content: `请为以下每位专家生成NBA行动建议：\n\n${listing}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_nba_suggestions",
                description: "Return NBA action suggestions for each HCP",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: {
                            type: "number",
                            description: "Original request index",
                          },
                          nba: {
                            type: "string",
                            description:
                              "NBA action suggestion in Chinese, max 200 chars, strictly based on recent activities",
                          },
                        },
                        required: ["index", "nba"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["suggestions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_nba_suggestions" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let suggestions: { index: number; nba: string }[] = [];

    if (toolCall) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        suggestions = args.suggestions ?? [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-nba error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
