import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RawItem {
  index: number;
  type: string;
  title: string;
  details: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { items } = (await req.json()) as { items: RawItem[] };

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ summaries: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build prompt listing all items
    const listing = items
      .map(
        (it) =>
          `${it.index}. [${it.type}] ${it.title}${it.details ? ` (${it.details})` : ""}`
      )
      .join("\n");

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
                "你是医药情报AI助手。将每条业务数据提炼为1句简洁的中文动态摘要（15-30字），保留关键信息如人名、期刊名、药物名、试验阶段等。",
            },
            {
              role: "user",
              content: `请将以下每条业务数据提炼为1句动态摘要：\n${listing}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_summaries",
                description:
                  "Return one-sentence summaries for each business data item",
                parameters: {
                  type: "object",
                  properties: {
                    summaries: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: {
                            type: "number",
                            description: "Original item index",
                          },
                          summary: {
                            type: "string",
                            description:
                              "One-sentence Chinese summary (15-30 chars)",
                          },
                        },
                        required: ["index", "summary"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["summaries"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_summaries" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "请求频率过高，请稍后重试"
              : status === 402
                ? "AI 额度不足，请充值"
                : "AI 服务暂时不可用",
        }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let summaries: { index: number; summary: string }[] = [];

    if (toolCall) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        summaries = args.summaries ?? [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(JSON.stringify({ summaries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-activities error:", e);
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
