import { useState, useEffect, useRef } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Calendar,
  Target,
  FileText,
  Shuffle,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ListChecks,
} from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [planDate, setPlanDate] = useState("");
  const [todayTarget, setTodayTarget] = useState("");
  const [planRemark, setPlanRemark] = useState("");
  const [modifyInput, setModifyInput] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskContent, setEditTaskContent] = useState("");
  const [longPressTaskId, setLongPressTaskId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPlanDate(today);
  }, []);

  // Handle modal open
  const handleOpenModal = () => {
    setIsModalOpen(true);
    setCurrentStep(1);
    setAiContent("");
    setModifyInput("");
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setAiContent("");
    setModifyInput("");
    setEditingTaskId(null);
  };

  // Handle random target
  const handleRandomTarget = () => {
    const targets = [
      "完成数学第5章习题",
      "复习英语单词100个",
      "阅读历史教材第3节",
      "完成物理实验报告",
      "预习化学新章节",
    ];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    setTodayTarget(randomTarget);
  };

  // Handle AI generation
  const handleAiGenerate = async () => {
    if (!todayTarget.trim()) {
      alert("请输入今日学习目标");
      return;
    }

    setIsLoading(true);
    setCurrentStep(2);

    try {
      // Simulate AI generation with streaming
      const mockPlan = `# 今日学习计划

## 上午 (9:00-12:00)
- **${todayTarget}** - 预计2小时
  - 完成基础题目 (30分钟)
  - 做进阶题目 (60分钟)
  - 总结知识点 (30分钟)

## 下午 (14:00-17:00)
- 巩固上午内容 - 预计1小时
- 完成课后练习 - 预计1.5小时
- 预习明日内容 - 预计30分钟

## 晚上 (19:00-21:00)
- 复习笔记 - 预计1小时
- 完成作业 - 预计1小时

${planRemark ? `\n## 特殊要求\n${planRemark}` : ""}`;

      // Simulate streaming effect
      let currentText = "";
      for (let i = 0; i < mockPlan.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        currentText += mockPlan[i];
        setAiContent(currentText);
      }
    } catch (error) {
      console.error("AI生成失败", error);
      alert("AI生成失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modify plan
  const handleModifyPlan = async () => {
    if (!modifyInput.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate AI modification
      const modifiedPlan = `${aiContent}\n\n---\n\n## 根据您的建议进行了调整：\n${modifyInput}`;
      setAiContent(modifiedPlan);
      setModifyInput("");
    } catch (error) {
      console.error("修改计划失败", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task long press
  const handleTaskMouseDown = (taskId: string, taskContent: string) => {
    setEditTaskContent(taskContent);
    longPressTimerRef.current = setTimeout(() => {
      setLongPressTaskId(taskId);
      setEditingTaskId(taskId);
    }, 800);
  };

  const handleTaskMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Handle save edit
  const handleSaveEdit = () => {
    // Save edited task
    setEditingTaskId(null);
    setLongPressTaskId(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setLongPressTaskId(null);
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!todayTarget.trim()) {
        alert("请输入今日学习目标");
        return;
      }
      handleAiGenerate();
    } else if (currentStep === 2) {
      handleCloseModal();
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setAiContent("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* 主页内容 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">GenToDo</h1>
            <p className="text-slate-500">
              {new Date().toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles size={20} />
            一键生成计划
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-2">今日完成</p>
                <p className="text-3xl font-bold text-slate-900">0%</p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-2">总体进度</p>
                <p className="text-3xl font-bold text-slate-900">0%</p>
              </div>
              <Target className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-2">待办任务</p>
                <p className="text-3xl font-bold text-slate-900">0</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Sparkles size={48} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">
              一键生成今日学习计划
            </h2>
            <p className="text-slate-500 text-center max-w-md">
              AI 将根据你的总计划、学习目标、自动为你生成今最优化的学习清单
            </p>
            <button
              onClick={handleOpenModal}
              className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-all"
            >
              生成今日 ToDo
            </button>
          </div>
        </div>
      </div>

      {/* 模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between px-7 py-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <ListChecks size={24} className="text-blue-600" />
                每日学习计划生成
              </h2>
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* 步骤进度条 */}
            <div className="flex gap-3 px-7 py-5">
              <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: currentStep === 1 ? "100%" : "100%" }}
                />
              </div>
              <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: currentStep === 2 ? "100%" : "0%" }}
                />
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {/* 步骤1：基础信息 */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      计划日期
                    </label>
                    <input
                      type="date"
                      value={planDate}
                      onChange={(e) => setPlanDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Target size={16} />
                      今日学习目标
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={todayTarget}
                        onChange={(e) => setTodayTarget(e.target.value)}
                        placeholder="请输入今日核心学习目标，可点击右侧按钮从总计划库随机获取"
                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 outline-none transition-all"
                      />
                      <button
                        onClick={handleRandomTarget}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title="从总计划库随机获取"
                      >
                        <Shuffle size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      备注信息（选填）
                    </label>
                    <textarea
                      value={planRemark}
                      onChange={(e) => setPlanRemark(e.target.value)}
                      placeholder="可输入补充说明、学习要求、注意事项等内容"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 outline-none transition-all resize-vertical min-h-20"
                    />
                  </div>
                </div>
              )}

              {/* 步骤2：AI生成与修改 */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* AI对话修改区 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modifyInput}
                      onChange={(e) => setModifyInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleModifyPlan();
                        }
                      }}
                      placeholder="输入修改指令，AI将为你调整计划，例如：增加2道数学练习题、调整任务优先级、拆分复杂任务"
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 outline-none transition-all"
                    />
                    <button
                      onClick={handleModifyPlan}
                      disabled={isLoading || !modifyInput.trim()}
                      className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  {/* AI生成内容渲染区 */}
                  <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-64 max-h-96 overflow-y-auto">
                    {isLoading && !aiContent ? (
                      <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">
                          AI正在为你生成学习计划...
                        </p>
                      </div>
                    ) : aiContent ? (
                      <div className="prose prose-sm max-w-none">
                        <MarkdownRenderer content={aiContent} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-between px-7 py-6 border-t border-slate-200 gap-3">
              {currentStep === 2 && (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 px-6 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft size={18} />
                  上一步
                </button>
              )}
              <div className="flex-1" />
              {currentStep === 1 && (
                <button
                  onClick={handleAiGenerate}
                  disabled={!todayTarget.trim()}
                  className="flex items-center gap-2 px-6 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles size={18} />
                  用AI生成计划
                </button>
              )}
              <button
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {currentStep === 1 ? "下一步" : "完成"}
                {currentStep === 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑任务弹窗 */}
      {editingTaskId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              编辑学习任务
            </h3>
            <textarea
              value={editTaskContent}
              onChange={(e) => setEditTaskContent(e.target.value)}
              rows={4}
              placeholder="修改任务内容、预计耗时、优先级等信息"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 outline-none transition-all resize-none"
            />
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
