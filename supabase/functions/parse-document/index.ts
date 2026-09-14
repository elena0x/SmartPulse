import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { document_id } = await req.json();
    if (!document_id) {
      throw new Error("document_id is required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get document record
    const { data: doc, error: docError } = await supabase
      .from("document_contents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Update status to processing
    await supabase
      .from("document_contents")
      .update({ status: "processing" })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      await supabase
        .from("document_contents")
        .update({ status: "error", parsed_text: "文件下载失败" })
        .eq("id", document_id);
      throw new Error(`File download failed: ${downloadError?.message}`);
    }

    // Convert file to base64 for AI processing (chunked to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binaryStr = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binaryStr += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binaryStr);

    // Determine mime type
    const ext = doc.file_name.toLowerCase().split(".").pop();
    let mimeType = "application/octet-stream";
    if (ext === "pdf") mimeType = "application/pdf";
    else if (ext === "doc") mimeType = "application/msword";
    else if (ext === "docx")
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Use Gemini to extract text content from the document
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请提取并返回这个文档的完整文本内容。保持原始的段落结构和格式。如果文档包含表格，请用 Markdown 表格格式呈现。只返回文档内容，不要添加任何解释或说明。`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error("AI Gateway error:", errBody);
      await supabase
        .from("document_contents")
        .update({ status: "error", parsed_text: "文档解析失败" })
        .eq("id", document_id);
      throw new Error(`AI Gateway error [${aiResponse.status}]: ${errBody}`);
    }

    const aiData = await aiResponse.json();
    const parsedText =
      aiData.choices?.[0]?.message?.content || "无法提取文档内容";

    // Save parsed content
    await supabase
      .from("document_contents")
      .update({ status: "completed", parsed_text: parsedText })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({ success: true, document_id, parsed_text: parsedText }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error parsing document:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
