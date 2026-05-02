import { useState, useEffect } from "react";
import { X, Home as HomeIcon, CheckSquare, Zap, Settings, Plus, Edit2, Trash2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface StorageData {
  totalPlan: string;
  examScope: string;
  examDate: string;
  dailyTheme: string;
  dailyGoal: string;
  completedTasks: Array<{ id: string; content: string; date: string }>;
  dailyPlan: { tasks: string[] } | null;
  chatHistory: Array<{ role: string; content: string }>;
}

export default function Home() {
  const [storage, setStorage] = useState<StorageData>({
    totalPlan: "",
    examScope: "",
    examDate: "",
    dailyTheme: "",
    dailyGoal: "",
    completedTasks: [],
    dailyPlan: null,
    chatHistory: [],
  });

  const [showModals, setShowModals] = useState({
    plan: false,
    exam: false,
    theme: false,
    chat: false,
    todo: false,
    edit: false,
  });

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gentodo-storage");
    if (saved) {
      setStorage(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const saveStorage = (data: StorageData) => {
    setStorage(data);
    localStorage.setItem("gentodo-storage", JSON.stringify(data));
  };

  const openModal = (modal: keyof typeof showModals) => {
    setShowModals((prev) => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof showModals) => {
    setShowModals((prev) => ({ ...prev, [modal]: false }));
  };

  const generateDailyPlanMutation = trpc.ai.generateDailyPlan.useMutation();
  const generateChatMutation = trpc.ai.generate.useMutation();

  // AI生成每日计划
  const generatePlan = async () => {
    if (!storage.totalPlan || !storage.examScope || !storage.examDate || !storage.dailyTheme || !storage.dailyGoal) {
      alert("请先填写所有必要信息");
      return;
    }

    setIsLoading(true);
    setStreamingText("");

    try {
      const result = await generateDailyPlanMutation.mutateAsync({
        totalPlan: storage.totalPlan,
        examScope: storage.examScope,
        examDate: storage.examDate,
        dailyTheme: storage.dailyTheme,
        dailyGoal: storage.dailyGoal,
        completedHistory: storage.completedTasks.map((t) => ({
          taskContent: t.content,
          completedAt: t.date,
        })),
      });

      if (result.isValid && result.tasks.length > 0) {
        saveStorage({
          ...storage,
          dailyPlan: { tasks: result.tasks },
        });
        setStreamingText(result.rawOutput);
        setTimeout(() => {
          closeModal("plan");
          openModal("todo");
        }, 1000);
      } else {
        alert("AI生成失败，请重试");
      }
    } catch (error) {
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送聊天消息
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    const newChat = [...storage.chatHistory, userMessage];
    setInputValue("");

    try {
      const result = await generateChatMutation.mutateAsync({ prompt: inputValue });
      const aiMessage = { role: "assistant", content: result.result };
      saveStorage({ ...storage, chatHistory: [...newChat, aiMessage] });
    } catch (error) {
      alert(`聊天失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  // 长按编辑任务
  const handleLongPress = (taskIndex: number) => {
    if (storage.dailyPlan?.tasks[taskIndex]) {
      setEditingTask(storage.dailyPlan.tasks[taskIndex]);
      openModal("edit");
    }
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingTask || !storage.dailyPlan) return;

    const taskIndex = storage.dailyPlan.tasks.findIndex((t) => t === editingTask);
    if (taskIndex >= 0) {
      const updated = [...storage.dailyPlan.tasks];
      updated[taskIndex] = inputValue;
      saveStorage({
        ...storage,
        dailyPlan: { tasks: updated },
      });
      setEditingTask(null);
      closeModal("edit");
      setInputValue("");
    }
  };

  // 标记完成
  const completeTask = (task: string) => {
    const newCompleted = [
      ...storage.completedTasks,
      {
        id: Date.now().toString(),
        content: task,
        date: new Date().toISOString(),
      },
    ];
    saveStorage({ ...storage, completedTasks: newCompleted });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* 主内容 */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">GenToDo</h1>
          <p className="text-gray-500">{new Date().toLocaleDateString("zh-CN")}</p>
        </div>

        {/* 今日计划卡片 */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">一键生成今日学习计划</h2>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-6">AI将根据您的总计划、考试范围、考试时间和当日目标，自动生成适配的每日学习计划。</p>
          <button
            onClick={() => openModal("plan")}
            className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            生成今日ToDo
          </button>
        </div>

        {/* 快速导航 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => openModal("exam")}
            className="bg-white rounded-2xl p-4 text-left hover:shadow-md transition border border-blue-100"
          >
            <div className="text-blue-600 font-semibold">考试信息</div>
            <div className="text-sm text-gray-500">{storage.examDate ? "已设置" : "未设置"}</div>
          </button>
          <button
            onClick={() => openModal("chat")}
            className="bg-white rounded-2xl p-4 text-left hover:shadow-md transition border border-blue-100"
          >
            <div className="text-blue-600 font-semibold">AI对话</div>
            <div className="text-sm text-gray-500">{storage.chatHistory.length} 条消息</div>
          </button>
        </div>
      </main>

      {/* 模态框 - 生成计划 */}
      {showModals.plan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold">设置计划信息</h3>
              <button onClick={() => closeModal("plan")} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">全周期总学习计划表</label>
                <textarea
                  value={storage.totalPlan}
                  onChange={(e) => saveStorage({ ...storage, totalPlan: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="例如：第1周复习基础知识，第2周做题训练..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">考试范围</label>
                <textarea
                  value={storage.examScope}
                  onChange={(e) => saveStorage({ ...storage, examScope: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="例如：第1-5章，重点是第3章..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">考试时间</label>
                <input
                  type="date"
                  value={storage.examDate}
                  onChange={(e) => saveStorage({ ...storage, examDate: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">当日学习主题</label>
                <input
                  type="text"
                  value={storage.dailyTheme}
                  onChange={(e) => saveStorage({ ...storage, dailyTheme: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：第3章重点知识"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">当日核心目标</label>
                <input
                  type="text"
                  value={storage.dailyGoal}
                  onChange={(e) => saveStorage({ ...storage, dailyGoal: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：掌握核心概念和做10道题"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
              <button
                onClick={() => closeModal("plan")}
                className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={generatePlan}
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isLoading ? "生成中..." : "AI生成计划"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模态框 - 待办清单 */}
      {showModals.todo && storage.dailyPlan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold">今日待办清单</h3>
              <button onClick={() => closeModal("todo")} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {storage.dailyPlan.tasks.map((task, idx) => (
                <div
                  key={idx}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleLongPress(idx);
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    onChange={() => completeTask(task)}
                    className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                  />
                  <span className="flex-1 text-gray-800">{task}</span>
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t rounded-b-3xl">
              <button
                onClick={() => closeModal("todo")}
                className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
              >
                开始学习
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模态框 - AI对话 */}
      {showModals.chat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">AI对话</h3>
              <button onClick={() => closeModal("chat")} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {storage.chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-lg px-4 py-2 rounded-2xl ${
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-sm">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入您的调整需求..."
              />
              <button
                onClick={sendMessage}
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">首页</span>
          </button>
          <button onClick={() => openModal("todo")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600">
            <CheckSquare className="w-6 h-6" />
            <span className="text-xs">待办</span>
          </button>
          <button onClick={() => openModal("chat")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600">
            <Zap className="w-6 h-6" />
            <span className="text-xs">AI管理</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600">
            <Settings className="w-6 h-6" />
            <span className="text-xs">设置</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
