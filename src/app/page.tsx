"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Copy,
  Loader2,
  Sparkles,
  CheckCircle2,
  FileText,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// 示例参考文献数据
const exampleReferences = `张三, 李四. 人工智能在教育中的应用研究[J]. 计算机科学, 2023, 50(3): 123-130.
王五, 赵六, 孙七. 深度学习算法优化研究. 软件学报, 2022, 33(5): 2001-2015.
Smith J, Brown A. Machine Learning in Healthcare[M]. New York: Academic Press, 2023: 45-67.
https://www.example.com/research-paper-2023
Liu M, Chen X. Natural Language Processing: A Comprehensive Guide[C]//Proceedings of ICML 2023. 2023: 234-245.`;

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 截断文本，最长 20 个汉字
  const truncateText = (text: string, maxLength: number = 20): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleFormat = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        throw new Error("格式化失败");
      }

      const data = await response.json();
      
      // 后端直接返回 { formatted, status, changes }
      const formattedText = data.formatted || "";
      const status = String(data.status || "success").toLowerCase();
      const changes = data.changes || [];

      setOutput(formattedText);

      // 1. 获取文案内容
      const toastMsg =
        changes && changes.length > 0
          ? `✅ 已${changes.join("、")}`
          : "✅ 格式化成功";

      // 2. 智能判断颜色
      // 只要文案里包含 "已" (代表修复成功) 或者 status 是 success，就强制绿色。
      // 只有当 status 是 warning 且 changes 里明确包含 "缺少/未找到" 等负面词时，才用黄色。
      const isPositiveUpdate =
        toastMsg.includes("已") || status === "success";

      // 检查 changes 是否包含负面词（用于 warning 状态）
      const changesText = changes.join(" ");
      const hasNegativeWords =
        changesText.includes("缺少") ||
        changesText.includes("未找到") ||
        changesText.includes("无法") ||
        changesText.includes("失败");

      // 显示 Toast
      if (status === "error") {
        toast.error("❌ 处理失败，请检查输入");
      } else if (isPositiveUpdate) {
        // 正面更新：显示绿色
        toast.success(truncateText(toastMsg));
      } else if (status === "warning" && hasNegativeWords) {
        // warning 且包含负面词：显示黄色
        const warningMsg = `⚠️ ${changes.join("，")}`;
        toast.warning(truncateText(warningMsg));
      } else {
        // 其他情况：默认绿色（安全起见）
        toast.success(truncateText(toastMsg));
      }
    } catch (error) {
      setOutput("格式化失败，请稍后重试。");
      toast.error("❌ 处理失败，请检查输入");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败", error);
    }
  };

  const handleLoadExample = () => {
    setInput(exampleReferences);
    setOutput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                CiteFix
              </h1>
              <p className="text-xs text-slate-500">智能参考文献格式化</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Gradient Blob */}
      <section className="relative overflow-hidden border-b border-slate-200/80 py-8 sm:py-10">
        {/* Gradient Blob Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-indigo-400/20 blur-3xl" />
          </div>
        </div>

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-8">
              <div className="text-4xl font-bold text-slate-700">
                3秒 将混乱文本清洗为
              </div>
              <div className="mt-2 text-5xl font-black tracking-tight sm:text-6xl md:text-7xl">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  标准 GB/T 7714
                </span>
              </div>
            </h1>
            <p className="mb-0 text-base tracking-wide text-slate-500/80 sm:text-lg">
              无需 Zotero，无需填表。专为中国高校毕业生打造的 AI 格式清洗引擎。
            </p>
          </div>
        </div>
      </section>

      {/* Main Content with Grid Background */}
      <main className="relative flex-1 overflow-hidden">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 -z-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(148 163 184 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(148 163 184 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container relative z-10 mx-auto px-4 py-6">
          <div className="mx-auto max-w-7xl">
            {/* 响应式布局：桌面端左右，移动端上下 */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Input Area with Glassmorphism */}
              <div className="flex flex-col">
                <Card className="flex flex-1 flex-col border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xl">
                  <CardHeader className="relative border-b border-slate-200/50 bg-white/50">
                    <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="flex items-center justify-between pt-2">
                      <CardTitle className="text-sm font-medium tracking-tight text-slate-400">
                        输入：混乱的引用 (Raw)
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadExample}
                        className="h-8 text-xs text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        示例
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-6">
                    <Textarea
                      placeholder="粘贴你的参考文献列表，支持知网/百度学术/谷歌学术等任意格式..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="min-h-[400px] resize-none border-slate-200 bg-white/50 font-mono text-sm leading-relaxed backdrop-blur-sm transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20"
                    />
                    {/* Action Button inside Input Card */}
                    <Button
                      onClick={handleFormat}
                      disabled={!input.trim() || isLoading}
                      size="lg"
                      className="h-12 w-full gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-6 text-base font-bold tracking-tight text-white shadow-lg shadow-indigo-500/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/50 disabled:scale-100 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          正在处理...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          AI 一键清洗
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Output Area with Glassmorphism */}
              <div className="flex flex-col">
                {output || isLoading ? (
                  <Card className="flex flex-1 flex-col border-slate-200/80 bg-white/70 backdrop-blur-md shadow-xl ring-2 ring-green-500/20">
                    <CardHeader className="relative border-b border-slate-200/50 bg-white/50">
                      <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-green-500"></div>
                      <div className="flex items-center justify-between pt-2">
                        <CardTitle className="text-sm font-medium tracking-tight text-slate-400">
                          输出：标准 GB/T 7714 (Clean)
                        </CardTitle>
                        {output && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 gap-2 border-indigo-200/80 bg-white/80 text-xs text-indigo-700 backdrop-blur-sm transition-all hover:bg-indigo-50 hover:text-indigo-800"
                          >
                            {copied ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                复制
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                      <Textarea
                        readOnly
                        value={output || (isLoading ? "正在格式化..." : "")}
                        className="min-h-[450px] resize-none border-slate-200 bg-slate-50/70 font-mono text-sm leading-relaxed backdrop-blur-sm"
                        placeholder="格式化后的参考文献将显示在这里..."
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex flex-1 flex-col border-dashed border-2 border-slate-200/60 bg-white/40 backdrop-blur-sm shadow-sm">
                    <CardContent className="flex flex-1 items-center justify-center p-6">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                          <Sparkles className="h-8 w-8 text-indigo-500" />
                        </div>
                        <p className="text-sm font-semibold tracking-tight text-slate-700">
                          格式化结果将显示在这里
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          点击"AI 一键清洗"按钮开始处理
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Value Proposition Grid */}
            <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: 懒人模式 */}
              <Card className="group border-slate-200/80 bg-white/70 backdrop-blur-md shadow-lg transition-all hover:shadow-xl hover:shadow-indigo-500/10">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                    拒绝填表
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    别再像填空题一样手动输入作者年份了。不管多乱的格式，直接粘贴，AI
                    自动识别。
                  </p>
                </CardContent>
              </Card>

              {/* Card 2: 国标合规 */}
              <Card className="group border-slate-200/80 bg-white/70 backdrop-blur-md shadow-lg transition-all hover:shadow-xl hover:shadow-indigo-500/10">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                    <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                    GB/T 7714-2015
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    专为国内高校设计。自动补全 [J]、[M] 标识，自动修正标点符号，导师挑不出毛病。
                  </p>
                </CardContent>
              </Card>

              {/* Card 3: 批量处理 */}
              <Card className="group border-slate-200/80 bg-white/70 backdrop-blur-md shadow-lg transition-all hover:shadow-xl hover:shadow-indigo-500/10 sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100">
                    <Zap className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                    1 秒洗 50 条
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    人工排版 50 条需要 1 小时，CiteFix 只需要 1 秒。把时间留给正文写作。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} CiteFix. 基于 GB/T 7714-2015 标准
          </p>
        </div>
      </footer>
    </div>
  );
}
