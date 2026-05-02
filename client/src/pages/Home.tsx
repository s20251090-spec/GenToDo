import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useStreamingAI } from "@/hooks/useStreamingAI";
import {
  Sparkles,
  Zap,
  Target,
  CheckSquare2,
  Settings as SettingsIcon,
  MessageSquare,
  BookOpen,
  FileText,
  Trash2,
  Edit2,
  X,
  Eye,
  Download,
  Database,
  Home as HomeIcon,
  Plus,
} from "lucide-react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentDate, setCurrentDate] = useState("");
  const [storage, setStorage] = useState<any>({
    examScope: null,
    totalPlan: null,
    chatHistory: [],
    todoHistory: {},
    learningHistory: {},
    recycleBin: [],
  });

  const [todayProgress, setTodayProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [todos, setTodos] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [examScope, setExamScope] = useState("");
  const [showModals, setShowModals] = useState({
    chat: false,
    plan: false,
    scope: false,
    recycle: false,
    dailyPlan: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dailyPlanData, setDailyPlanData] = useState({
    totalPlan: "",
    examScope: "",
    examDate: "",
    dailyTheme: "",
    dailyGoal: "",
  });
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);

  // tRPC mutations
  const generatePlanMutation = trpc.ai.generate.useMutation();
  
  // Streaming hook
  const { stream, streamingText: currentStreamingText, isStreaming: currentIsStreaming, reset: resetStreaming } = useStreamingAI();

  // Load storage from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gentodo_storage");
    if (saved) {
      try {
        setStorage(JSON.parse(saved));
      } catch (e) {
        console.error("加载存储失败", e);
      }
    }

    // Load settings
    const settings = localStorage.getItem("gentodo_settings");
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        setDailyPlanData({
          totalPlan: parsedSettings.totalPlan || "",
          examScope: parsedSettings.examScope || "",
          examDate: parsedSettings.examDate || "",
          dailyTheme: parsedSettings.dailyTheme || "",
          dailyGoal: parsedSettings.dailyGoal || "",
        });
      } catch (e) {
        console.error("加载设置失败", e);
      }
    }

    // Format date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    setCurrentDate(now.toLocaleDateString("zh-CN", options));
  }, []);

  // Save storage to localStorage
  const saveStorage = (newStorage: any) => {
    setStorage(newStorage);
    localStorage.setItem("gentodo_storage", JSON.stringify(newStorage));
  };

  const openModal = (modalId: string) => {
    setShowModals((prev) => ({ ...prev, [modalId]: true }));
  };

  const closeModal = (modalId: string) => {
    setShowModals((prev) => ({ ...prev, [modalId]: false }));
  };

  const closeDailyPlanModal = () => {
    setShowModals((prev) => ({ ...prev, dailyPlan: false }));
    setCurrentStep(1);
    setGeneratedPlan("");
    setSelectedTasks([]);
  };

  const handleGeneratePlan = async () => {
    if (!examScope) {
      alert("请先输入考试范围");
      return;
    }

    setAiLoading(true);
    try {
      const response = await generatePlanMutation.mutateAsync({
        prompt: `根据以下信息生成一份详细的每日学习计划：
总学习计划：${dailyPlanData.totalPlan}
考试范围：${dailyPlanData.examScope}
考试时间：${dailyPlanData.examDate}
当日主题：${dailyPlanData.dailyTheme}
当日目标：${dailyPlanData.dailyGoal}

请生成具体、可执行的每日学习任务清单。`,
      });

      if (response && response.result) {
        setGeneratedPlan(response.result);
        setCurrentStep(3);
      }
    } catch (error) {
      console.error("生成计划失败", error);
      alert("生成计划失败，请检查 API 密钥是否正确配置");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsStreaming(true);
    resetStreaming();

    try {
      await stream(inputValue, {
        onChunk: (chunk: string) => {
          setStreamingText((prev) => prev + chunk);
        },
      });

      setStreamingText("");
    } catch (error) {
      console.error("发送消息失败", error);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAddTask = (task: string) => {
    setSelectedTasks((prev) => [...prev, task]);
  };

  const handleRemoveTask = (index: number) => {
    setSelectedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmPlan = () => {
    const newTodos = selectedTasks.map((task) => ({
      id: Date.now() + Math.random(),
      text: task,
      completed: false,
      createdAt: new Date().toISOString(),
    }));

    setTodos((prev) => [...prev, ...newTodos]);
    const newStorage = {
      ...storage,
      todoHistory: {
        ...storage.todoHistory,
        [new Date().toDateString()]: newTodos,
      },
    };
    saveStorage(newStorage);
    closeDailyPlanModal();
  };

  // Dashboard Page
  const renderDashboard = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
            GenToDo
          </h2>
          <p className="text-gray-500">{currentDate}</p>
        </div>
        <button
          onClick={() => openModal("dailyPlan")}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 py-3 font-semibold hover:bg-blue-700 transition-all"
        >
          <Zap className="w-5 h-5" />
          一键生成计划
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">今日完成</h3>
            <CheckSquare2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{todayProgress}%</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">总体进度</h3>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalProgress}%</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-semibold">待办任务</h3>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{todos.length}</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl shadow-sm p-8 text-center">
        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">一键生成今日学习计划</h3>
        <p className="text-gray-600 mb-6">
          AI 将根据你的总计划、学习目标、自动为你生成今日最优化的学习清单
        </p>
        <button
          onClick={() => openModal("dailyPlan")}
          className="bg-blue-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700 transition-all"
        >
          生成今日 ToDo
        </button>
      </div>
    </div>
  );

  // Todo List Page
  const renderTodoList = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800">
          待办清单
        </h2>
        <button
          onClick={() => openModal("dailyPlan")}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-full px-4 py-2 font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          添加
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无待办任务</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => {
                  const updated = todos.map((t) =>
                    t.id === todo.id ? { ...t, completed: !t.completed } : t
                  );
                  setTodos(updated);
                }}
                className="w-5 h-5 rounded-lg cursor-pointer"
              />
              <span
                className={`flex-1 ${
                  todo.completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => {
                  const updated = todos.filter((t) => t.id !== todo.id);
                  setTodos(updated);
                }}
                className="text-gray-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // AI Chat Page
  const renderAIChat = () => (
    <div className="animate-fadeIn">
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-8">
        AI 对话
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-6 h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-12 h-12" />
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-xs rounded-2xl px-4 py-2 bg-gray-100 text-gray-800">
                <MarkdownRenderer content={streamingText} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="输入你的问题..."
            className="flex-1 bg-gray-50 rounded-full px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={isStreaming}
            className="bg-blue-600 text-white rounded-full px-6 py-3 font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-all"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );

  // Settings Page
  const renderSettings = () => (
    <div className="animate-fadeIn">
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-8">
        设置
      </h2>
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">设置功能开发中...</p>
      </div>
    </div>
  );

  // Daily Plan Modal
  const renderDailyPlanModal = () => (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all ${
        showModals.dailyPlan ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            生成每日学习计划
          </h3>
          <button
            onClick={closeDailyPlanModal}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step <= currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">确认学习信息</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    总学习计划
                  </label>
                  <textarea
                    value={dailyPlanData.totalPlan}
                    onChange={(e) =>
                      setDailyPlanData({ ...dailyPlanData, totalPlan: e.target.value })
                    }
                    placeholder="输入你的总学习计划..."
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    考试范围
                  </label>
                  <textarea
                    value={dailyPlanData.examScope}
                    onChange={(e) =>
                      setDailyPlanData({ ...dailyPlanData, examScope: e.target.value })
                    }
                    placeholder="输入考试范围..."
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    考试时间
                  </label>
                  <input
                    type="date"
                    value={dailyPlanData.examDate}
                    onChange={(e) =>
                      setDailyPlanData({ ...dailyPlanData, examDate: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">设置今日学习目标</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    今日学习主题
                  </label>
                  <input
                    type="text"
                    value={dailyPlanData.dailyTheme}
                    onChange={(e) =>
                      setDailyPlanData({ ...dailyPlanData, dailyTheme: e.target.value })
                    }
                    placeholder="例如：数学第三章"
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    今日学习目标
                  </label>
                  <textarea
                    value={dailyPlanData.dailyGoal}
                    onChange={(e) =>
                      setDailyPlanData({ ...dailyPlanData, dailyGoal: e.target.value })
                    }
                    placeholder="输入今日的具体学习目标..."
                    className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">AI 生成的学习计划</h4>
              {aiLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 max-h-[300px] overflow-y-auto">
                  <MarkdownRenderer content={generatedPlan} />
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">确认任务清单</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl"
                  >
                    <span className="text-gray-800">{task}</span>
                    <button
                      onClick={() => handleRemoveTask(idx)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
            >
              上一步
            </button>
          )}
          {currentStep < 4 && (
            <button
              onClick={() => {
                if (currentStep === 3) {
                  // Parse generated plan into tasks
                  const lines = generatedPlan.split("\n").filter((line) => line.trim());
                  setSelectedTasks(lines);
                  setCurrentStep(4);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={aiLoading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {currentStep === 3 ? "生成任务" : "下一步"}
            </button>
          )}
          {currentStep === 1 && (
            <button
              onClick={() => {
                setCurrentStep(2);
              }}
              className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
            >
              下一步
            </button>
          )}
          {currentStep === 2 && (
            <button
              onClick={() => {
                setCurrentStep(3);
                handleGeneratePlan();
              }}
              disabled={aiLoading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {aiLoading ? "生成中..." : "生成计划"}
            </button>
          )}
          {currentStep === 4 && (
            <button
              onClick={handleConfirmPlan}
              className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
            >
              确认并添加
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "todos" && renderTodoList()}
        {currentPage === "chat" && renderAIChat()}
        {currentPage === "settings" && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex justify-around">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all ${
              currentPage === "dashboard"
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-400"
            }`}
          >
            <HomeIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">首页</span>
          </button>
          <button
            onClick={() => setCurrentPage("todos")}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all ${
              currentPage === "todos"
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-400"
            }`}
          >
            <CheckSquare2 className="w-6 h-6 mb-1" />
            <span className="text-xs">待办</span>
          </button>
          <button
            onClick={() => setCurrentPage("chat")}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all ${
              currentPage === "chat"
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-400"
            }`}
          >
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-xs">AI 对话</span>
          </button>
          <button
            onClick={() => setCurrentPage("settings")}
            className={`flex-1 flex flex-col items-center justify-center py-4 transition-all ${
              currentPage === "settings"
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-400"
            }`}
          >
            <SettingsIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">设置</span>
          </button>
        </div>
      </div>

      {/* Daily Plan Modal */}
      {renderDailyPlanModal()}
    </div>
  );
}
