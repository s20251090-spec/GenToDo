import type { AIGenerationRequest } from "@shared/types";

/**
 * AI 提示词工程模块
 * 负责生成固定格式的 AI 提示词，确保 AI 输出符合规范
 */

export const DAILY_PLAN_FORMAT = `
【每日学习计划】
【学习主题】{theme}
【核心目标】{goal}
【任务清单】
{tasks}
【预计耗时】{duration}分钟
`;

export const TASK_FORMAT = `- {taskName}（预计{duration}分钟）`;

/**
 * 生成 AI 提示词
 * 必须传递三类全量核心参数：总计划表、完成历史、当前参数
 */
export function generateAIPrompt(request: AIGenerationRequest): string {
  const daysUntilExam = request.daysUntilExam;
  const completedTasksSummary = request.completedHistory
    .slice(-10) // 最近10条
    .map((t) => `- ${t.taskContent}`)
    .join("\n");

  const prompt = `
你是一个专业的学习计划生成助手。请根据以下信息生成一份精准、可落地的每日学习计划。

【核心约束条件】
1. 严格按照指定格式输出，不允许任何引导性话术或解释文字
2. 仅输出计划本体内容，禁止输出"以下是为您生成的计划"等前缀
3. 每个任务必须包含具体的时间估计
4. 任务必须与考试范围和当日目标相关

【用户信息】
考试日期：${request.examDate}
距离考试：${daysUntilExam}天
考试范围：${request.examScope}

【全周期总学习计划表】
${request.totalPlan}

【当日学习主题】
${request.dailyTheme}

【当日核心目标】
${request.dailyGoal}

【最近完成的学习任务记录】
${completedTasksSummary || "暂无记录"}

【输出格式要求】
【每日学习计划】
【学习主题】${request.dailyTheme}
【核心目标】${request.dailyGoal}
【任务清单】
- 任务1（预计X分钟）
- 任务2（预计X分钟）
- 任务3（预计X分钟）
【预计耗时】XXX分钟

请直接输出计划内容，不要包含任何其他文字。
`;

  return prompt;
}

/**
 * 验证 AI 输出格式
 */
export function validateAIOutput(output: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查必要的格式标记
  if (!output.includes("【每日学习计划】")) {
    errors.push("缺少【每日学习计划】标记");
  }
  if (!output.includes("【学习主题】")) {
    errors.push("缺少【学习主题】标记");
  }
  if (!output.includes("【核心目标】")) {
    errors.push("缺少【核心目标】标记");
  }
  if (!output.includes("【任务清单】")) {
    errors.push("缺少【任务清单】标记");
  }
  if (!output.includes("【预计耗时】")) {
    errors.push("缺少【预计耗时】标记");
  }

  // 检查是否包含禁止的前缀文字
  const forbiddenPrefixes = [
    "以下是为您生成的计划",
    "根据您的要求",
    "我为您生成了",
    "这是一份",
  ];

  for (const prefix of forbiddenPrefixes) {
    if (output.includes(prefix)) {
      errors.push(`包含禁止的前缀文字："${prefix}"`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 解析 AI 输出，提取任务列表
 */
export function parseAIOutput(output: string): string[] {
  const tasks: string[] = [];

  // 提取【任务清单】和【预计耗时】之间的内容
  const taskListMatch = output.match(
    /【任务清单】([\s\S]*?)【预计耗时】/
  );

  if (!taskListMatch) {
    return tasks;
  }

  const taskListContent = taskListMatch[1];

  // 按行分割，提取以 - 开头的任务
  const lines = taskListContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-")) {
      // 移除 - 前缀
      const taskContent = trimmed.substring(1).trim();
      if (taskContent) {
        tasks.push(taskContent);
      }
    }
  }

  return tasks;
}

/**
 * 清理 AI 输出，移除禁止内容
 */
export function cleanAIOutput(output: string): string {
  let cleaned = output;

  // 移除常见的引导性前缀
  const prefixPatterns = [
    /^[\s\S]*?以下是为您生成的计划[\s\S]*?\n/,
    /^[\s\S]*?根据您的要求[\s\S]*?\n/,
    /^[\s\S]*?我为您生成了[\s\S]*?\n/,
  ];

  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 移除尾部的解释性文字
  const endPatterns = [/\n[\s\S]*?希望这个计划[\s\S]*?$/i, /\n[\s\S]*?祝学习愉快[\s\S]*?$/i];

  for (const pattern of endPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.trim();
}

/**
 * 计算距离考试的天数
 */
export function calculateDaysUntilExam(examDate: string): number {
  const exam = new Date(examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);

  const diffTime = exam.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
