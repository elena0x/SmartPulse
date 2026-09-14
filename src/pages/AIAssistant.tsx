import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Mail } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const presetQuestions = [
  "PD-1 抑制剂在 NSCLC 中的最新循证证据？",
  "NCCN 指南中关于肝癌二线治疗的推荐变化？",
  "帮我为张伟教授生成一封学术拜访邮件",
  "免疫治疗耐药的主要机制有哪些？",
];

const mockResponses: Record<string, string> = {
  "帮我为张伟教授生成一封学术拜访邮件": `尊敬的张伟教授：

您好！我是 [公司名称] 的医学科学联络官 [姓名]。

近日拜读了您在 Lancet Oncology 发表的关于 PD-1 联合化疗在晚期 NSCLC 中 III 期临床研究的重要成果，深感敬佩。研究所展示的显著生存获益令人瞩目。

鉴于我司产品在联合治疗领域也有最新进展，希望能约时间与您当面交流，分享我们的最新 III 期数据及差异化优势分析。

期待您的回复，祝工作顺利！`,
};

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "您好！我是 SmartPulse AI 助手，基于 GBI 医学数据库，可以为您提供：\n\n• **医学文献问答** — 指南、论文相关问题\n• **个性化邮件生成** — 针对特定 HCP 的拜访邮件/微信草稿\n• **学术情报分析** — 竞品动态、市场趋势\n\n请输入您的问题：",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");

    // Simulate response
    setTimeout(() => {
      const response =
        mockResponses[userMsg] ||
        `基于 GBI 数据库分析：\n\n关于"${userMsg}"的查询结果，系统已检索到相关文献 23 篇，涉及临床试验 5 项。\n\n**关键发现：**\n1. 最新循证证据显示该领域正在快速发展\n2. 建议关注 2026 年 ASCO 会议上的最新数据更新\n3. 相关指南预计将在下一版本中纳入新的推荐\n\n如需深入了解某个方面，请继续提问。`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 800);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-48px)] flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 医学助手
          </h1>
          <p className="text-sm text-muted-foreground mt-1">基于 GBI 数据库的智能问答与内容生成</p>
        </div>

        {/* Preset questions */}
        <div className="flex gap-2 flex-wrap mb-4">
          {presetQuestions.map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {q.length > 20 ? q.slice(0, 20) + "…" : q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground"
                    : "card-elevated text-card-foreground"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="card-elevated p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入医学问题或生成拜访内容..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;
