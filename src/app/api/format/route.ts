import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Force Dynamic: Ensure Next.js reads environment variables at runtime, not build time
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 🚨 DEEP DEBUG: Check what variables are actually available
  const envDebug = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV, // Should be 'production' or 'preview'
    // List ALL keys that contain 'OPENAI' (do not print values, just names)
    openAiKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
    // Check specific key existence
    hasApiKey: !!process.env.OPENAI_API_KEY,
    hasBaseUrl: !!process.env.OPENAI_BASE_URL
  };
  console.log('🚨 DEEP DEBUG:', JSON.stringify(envDebug, null, 2));

  // 调试日志：打印环境变量状态（安全：不打印实际值）
  console.log('Env Check:', { 
    hasKey: !!process.env.OPENAI_API_KEY, 
    hasBaseUrl: !!process.env.OPENAI_BASE_URL 
  });

  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供有效的参考文献文本" },
        { status: 400 }
      );
    }

    // 检查环境变量
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
      console.error("Missing environment variables");
      return NextResponse.json(
        { error: "服务器配置错误，请稍后重试" },
        { status: 500 }
      );
    }

    // 调用 DeepSeek API 进行格式化
    const result = await formatReferences(text);

    return NextResponse.json(result);
  } catch (error) {
    // 完善错误处理：打印完整的错误对象
    console.error("API Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

// 使用 DeepSeek API 格式化参考文献
async function formatReferences(
  text: string
): Promise<{ formatted: string; status: string; changes: string[] }> {
  // 调试日志：打印环境变量状态（安全：不打印实际值）
  console.log('formatReferences Env Check:', { 
    hasKey: !!process.env.OPENAI_API_KEY, 
    hasBaseUrl: !!process.env.OPENAI_BASE_URL 
  });

  // 在函数内部初始化 OpenAI 客户端，避免构建时检查 credentials
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
    throw new Error("Missing environment variables");
  }

  // 确保 baseURL 不为空字符串
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  if (!baseURL) {
    throw new Error("OPENAI_BASE_URL is empty or invalid");
  }

  // 显式传入 baseURL，确保 OpenAI 中转服务正常工作
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: baseURL, // 重点：必须显式读取这个变量，确保中转服务正常工作
  });

  // 调试日志：确认 baseURL 已正确传入（安全：只打印是否存在，不打印实际值）
  console.log('OpenAI Client initialized with baseURL:', !!baseURL);

  const systemPrompt = `你是一个 GB/T 7714-2015 格式化专家。
请处理用户的引用文本。

### 输出格式 (必须为 JSON)
{
  "status": "success" | "warning" | "error",
  "result": "清洗后的完整引用字符串",
  "changes": ["简短的操作点1", "简短的操作点2"] // 最多列出2个最重要的改动
}

### status 状态判断规则 (严格区分)：

1. **status: "success"** (绿色) - 使用场景：
   - 完美转换，所有信息完整
   - **成功补全**了缺失信息（如自动推断出城市、识别出类型、补全年份等）
   - changes 字段记录成功的操作（如 "已补全出版地"、"已识别文献类型"、"已补全年份"）

2. **status: "warning"** (黄色) - 使用场景：
   - **仅当**：关键信息缺失且**无法补全**时
   - 例如：原文没有年份，且无法从上下文推断出年份
   - 例如：缺少作者、题名等核心信息
   - changes 字段记录缺失项（如 "缺少年份，请手动补充"、"缺少作者信息"）

3. **status: "error"** (红色) - 使用场景：
   - **仅当**：无法识别输入内容时
   - 例如：输入完全不是参考文献格式，无法解析
   - 例如：输入为空或完全无意义

### changes 字段的生成规则 (仅列出最重要的)：
- 如果成功补全了城市，记为 "已补全出版地"
- 如果成功识别了类型(如[J]/[M])，记为 "已识别文献类型"
- 如果成功补全了年份，记为 "已补全年份"
- 如果修正了作者格式(如加了et al)，记为 "已修正作者格式"
- 如果修正了标点，记为 "已标准化标点"
- 如果关键信息缺失且无法补全，status 设为 "warning"，changes 记为 "缺少年份，请手动补充" 或 "缺少作者信息" 等

### 示例
示例1 (success - 成功补全):
输入：三体 刘慈欣 重庆出版社
输出：
{
  "status": "success",
  "result": "[1] 刘慈欣. 三体[M]. 重庆: 重庆出版社, 2008.",
  "changes": ["已补全年份", "已识别为专著"]
}

示例2 (warning - 关键信息缺失):
输入：张三. 人工智能研究. 计算机学报
输出：
{
  "status": "warning",
  "result": "[1] 张三. 人工智能研究[J]. 计算机学报, [年份不详].",
  "changes": ["缺少年份，请手动补充"]
}

示例3 (error - 无法识别):
输入：这是一段完全无关的文字
输出：
{
  "status": "error",
  "result": "",
  "changes": ["无法识别输入内容"]
}`;

  const prompt = `请将以下混乱的参考文献文本，按照 GB/T 7714-2015 标准进行清洗和格式化。

如果输入包含多条参考文献（用换行分隔），请为每条参考文献生成一个 JSON 对象，并返回一个 JSON 数组。
如果只有一条参考文献，请返回单个 JSON 对象。

输入文本：
${text}

请严格按照 JSON 格式输出，不要添加任何解释文字。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat", // DeepSeek 的标准 API 模型名，性价比极高
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // 降低温度以获得更一致的结果
      max_tokens: 4000, // 根据实际需求调整
    });

    const responseText =
      completion.choices[0]?.message?.content?.trim() || "";

    if (!responseText) {
      throw new Error("API 返回空结果");
    }

    // 尝试解析 JSON 响应
    try {
      // 移除可能的 markdown 代码块标记
      let jsonText = responseText;
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(jsonText);
      
      // 如果返回的是数组（多条参考文献），合并结果
      if (Array.isArray(parsed)) {
        const results = parsed.map((item: any) => item.result || "").filter(Boolean);
        const allChanges = parsed
          .map((item: any) => item.changes || [])
          .flat()
          .filter((change: string, index: number, self: string[]) => 
            self.indexOf(change) === index // 去重
          );
        const status = parsed.some((item: any) => item.status === "error")
          ? "error"
          : parsed.some((item: any) => item.status === "warning")
          ? "warning"
          : "success";
        
        return {
          formatted: results.join("\n\n"),
          status,
          changes: allChanges.slice(0, 2), // 最多保留2个
        };
      }
      
      // 单条参考文献，返回完整对象
      if (parsed.result) {
        return {
          formatted: parsed.result,
          status: parsed.status || "success",
          changes: parsed.changes || [],
        };
      }
      
      // 如果没有 result 字段，返回默认值
      return {
        formatted: responseText,
        status: "success",
        changes: [],
      };
    } catch (parseError) {
      // 如果解析失败，尝试提取 JSON 部分
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.result) {
            return {
              formatted: parsed.result,
              status: parsed.status || "success",
              changes: parsed.changes || [],
            };
          }
        } catch (e) {
          // 如果还是失败，返回默认值
        }
      }
      
      // 如果无法解析 JSON，可能是 AI 返回了非 JSON 格式，尝试判断是否为错误
      console.warn("Failed to parse JSON response, returning raw text:", parseError);
      
      // 检查响应文本是否包含明显的错误信息
      const lowerText = responseText.toLowerCase();
      const isError = 
        lowerText.includes("无法识别") ||
        lowerText.includes("无法解析") ||
        lowerText.includes("错误") ||
        lowerText.includes("error") ||
        responseText.trim().length === 0;
      
      return {
        formatted: responseText,
        status: isError ? "error" : "success",
        changes: isError ? ["无法解析响应格式"] : [],
      };
    }
  } catch (error: any) {
    // 完善错误处理：打印完整的错误对象
    console.error("OpenAI API Error:", {
      message: error instanceof Error ? error.message : String(error),
      status: error?.status,
      statusText: error?.statusText,
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    
    // 提供更友好的错误信息
    if (error?.status === 401) {
      throw new Error("API 密钥无效");
    } else if (error?.status === 429) {
      throw new Error("请求过于频繁，请稍后重试");
    } else if (error?.status === 500) {
      throw new Error("API 服务器错误，请稍后重试");
    }
    
    throw error;
  }
}

// Force Vercel Rebuild: Fix Env Vars
