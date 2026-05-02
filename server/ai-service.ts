import { ENV } from "./_core/env";

export async function generateDailyPlan(params: {
  totalPlan: string;
  examScope: string;
  examDate: string;
  dailyTheme: string;
  dailyGoal: string;
  completedHistory: Array<{ taskContent: string; completedAt: string }>;
}): Promise<string> {
  const daysUntilExam = Math.ceil(
    (new Date(params.examDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const completedSummary = params.completedHistory
    .slice(-10)
    .map((t) => `- ${t.taskContent}`)
    .join("\n");

  const prompt = `你是学习计划生成助手。严格按照以下格式输出，禁止任何前缀、解释或后缀。

【每日学习计划】
【学习主题】${params.dailyTheme}
【核心目标】${params.dailyGoal}
【任务清单】
- 任务1（预计30分钟）
- 任务2（预计30分钟）
- 任务3（预计30分钟）
【预计耗时】90分钟

根据以下信息生成计划：
- 考试日期：${params.examDate}（${daysUntilExam}天后）
- 考试范围：${params.examScope}
- 总计划：${params.totalPlan}
- 最近完成：${completedSummary || "无"}

直接输出计划，不要任何其他文字。`;

  const response = await fetch(`${ENV.forgeApiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      model: "manus-1.6-lite",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  let result = "";
  if (data.choices?.[0]?.message?.content) {
    result = data.choices[0].message.content;
  } else if (data.result) {
    result = data.result;
  }

  return result.trim();
}

export function parsePlanOutput(output: string): string[] {
  const tasks: string[] = [];
  const taskListMatch = output.match(/【任务清单】([\s\S]*?)【预计耗时】/);

  if (taskListMatch) {
    const lines = taskListMatch[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("-")) {
        tasks.push(trimmed.substring(1).trim());
      }
    }
  }

  return tasks;
}

export function validatePlanOutput(output: string): boolean {
  return (
    output.includes("【每日学习计划】") &&
    output.includes("【学习主题】") &&
    output.includes("【核心目标】") &&
    output.includes("【任务清单】") &&
    output.includes("【预计耗时】")
  );
}
