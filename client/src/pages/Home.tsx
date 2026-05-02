import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useStreamingAI } from "@/hooks/useStreamingAI";
import Settings from "./Settings";
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
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<any>({});
  const [settings, setSettings] = useState<any>({});

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

    // Load AI prompts
    const savedPrompts = localStorage.getItem("gentodo_ai_prompts");
    if (savedPrompts) {
      try {
        const prompts = JSON.parse(savedPrompts);
        const promptMap: any = {};
        prompts.forEach((p: any) => {
          promptMap[p.id] = p.customPrompt || p.defaultPrompt;
        });
        setAiPrompts(promptMap);
      } catch (e) {
        console.error("加载 AI 提示词失败", e);
      }
    }

    // Load settings
    const savedSettings = localStorage.getItem("gentodo_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
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

  // Helper function to replace template variables
  const replacePromptVariables = (prompt: string): string => {
    let result = prompt;
    result = result.replace(/{totalPlan}/g, settings.totalPlan || "");
    result = result.replace(/{examScope}/g, settings.examScope || examScope || "");
    result = result.replace(/{examDate}/g, settings.examDate || "");
    result = result.replace(/{dailyTheme}/g, settings.dailyTheme || "");
    result = result.replace(/{dailyGoal}/g, settings.dailyGoal || "");
    result = result.replace(/{completedHistory}/g, JSON.stringify(storage.learningHistory || {}));
    result = result.replace(/{plan}/g, storage.totalPlan || "");
    result = result.replace(/{progress}/g, `${todayProgress}%`);
    return result;
  };

  const handleGeneratePlan = async () => {
    if (!examScope && !settings.examScope) {
      alert("请先输入考试范围");
      return;
    }

    setAiLoading(true);
    try {
      // Use custom prompt if available, otherwise use default
      let prompt = aiPrompts["daily-plan"] || `基于以下考试范围，生成一份详细的学习计划：\n\n{examScope}\n\n请提供：\n1. 学习目标\n2. 学习阶段划分\n3. 每个阶段的重点内容\n4. 复习策略\n5. 每日学习建议`;
      
      // Replace template variables
      prompt = replacePromptVariables(prompt);

      const result = await generatePlanMutation.mutateAsync({ prompt });
      const plan = result.result;

      const newStorage = { ...storage, totalPlan: plan };
      saveStorage(newStorage);
      closeModal("scope");
      alert("学习计划已生成！");
    } catch (error) {
      console.error("计划生成失败:", error);
      alert(`计划生成失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: inputValue,
      type: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    const userInput = inputValue;
    setInputValue("");
    setAiLoading(true);

    setIsStreaming(true);
    setStreamingText("");
    const aiMessageId = Date.now() + 1;

    try {
      // Build system prompt with custom AI chat prompt
      let systemPrompt = aiPrompts["ai-chat"] || `你是一个专业的学习助手。你的职责是：
1. 帮助用户理解学习内容
2. 提供学习建议和方法
3. 回答学习相关的问题
4. 鼓励用户坚持学习

请用友好、专业的语气与用户交流。`;
      
      // Replace template variables in system prompt
      systemPrompt = replacePromptVariables(systemPrompt);
      
      // Combine system prompt with user input
      const fullPrompt = `${systemPrompt}\n\n用户问题：${userInput}`;

      await stream(fullPrompt, {
        onChunk: () => {},
        onComplete: (fullText) => {
          setIsStreaming(false);
          const aiMessage = {
            id: aiMessageId,
            content: fullText,
            type: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== aiMessageId);
            return [...filtered, aiMessage];
          });
          setStreamingText("");

          const updatedStorage = {
            ...storage,
            chatHistory: [...(storage.chatHistory || []), userMessage, aiMessage],
          };
          saveStorage(updatedStorage);
        },
        onError: (error) => {
          setIsStreaming(false);
          console.error("AI生成失败:", error);
          alert(`AI生成失败：${error.message}`);
        },
      });
    } catch (error) {
      setIsStreaming(false);
      console.error("AI生成失败:", error);
      alert(`AI生成失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const navItems = [
    { id: "dashboard", label: "首页", icon: HomeIcon },
    { id: "todo-list", label: "待办", icon: CheckSquare2 },
    { id: "ai-editor", label: "AI管理", icon: Sparkles },
    { id: "settings", label: "设置", icon: SettingsIcon },
  ];

  const hasPlan = !!storage.totalPlan;

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto relative bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 md:px-6 pt-8">
        {/* Dashboard Page */}
        {currentPage === "dashboard" && (
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-bold text-blue-600 mb-1">
                  GenToDo
                </h1>
                <p className="text-gray-400">{currentDate}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span
                  className={`rounded-full px-4 py-2 font-medium text-sm ${
                    hasPlan
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {hasPlan ? "✓ 已配置学习计划" : "未配置学习计划"}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 mb-8 border border-blue-200">
              <div className="flex items-start gap-4 mb-6">
                <Sparkles className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">
                    一键生成今日学习计划
                  </h2>
                  <p className="text-blue-700">
                    AI将根据你的总计划、学习目标，自动为你生成今日最优化的学习清单
                  </p>
                </div>
              </div>
              <button
                onClick={() => openModal("plan")}
                className="bg-blue-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                生成今日ToDo
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">今日完成</p>
                    <p className="text-3xl font-bold text-blue-600">{todayProgress}%</p>
                  </div>
                  <Target className="w-12 h-12 text-blue-100" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">总体进度</p>
                    <p className="text-3xl font-bold text-blue-600">{totalProgress}%</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-blue-100" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">待办任务</p>
                    <p className="text-3xl font-bold text-blue-600">{todos.length}</p>
                  </div>
                  <CheckSquare2 className="w-12 h-12 text-blue-100" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ToDo List Page */}
        {currentPage === "todo-list" && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">待办清单</h2>
            {todos.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <CheckSquare2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">暂无待办任务</p>
                <button
                  onClick={() => openModal("plan")}
                  className="bg-blue-600 text-white rounded-full px-6 py-2 font-semibold hover:bg-blue-700 transition-all"
                >
                  生成计划
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
                  >
                    <input type="checkbox" className="w-5 h-5 rounded" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{todo.title}</p>
                      <p className="text-sm text-gray-500">{todo.description}</p>
                    </div>
                    <Edit2 className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Management Page */}
        {currentPage === "ai-editor" && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">AI管理</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chat Card */}
              <button
                onClick={() => openModal("chat")}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-1">AI对话</h3>
                <p className="text-gray-500 text-sm">与AI进行实时对话，获得学习建议</p>
              </button>

              {/* Plan Optimization Card */}
              <button
                onClick={() => openModal("scope")}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
              >
                <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-1">生成计划</h3>
                <p className="text-gray-500 text-sm">基于考试范围生成学习计划</p>
              </button>
            </div>
          </div>
        )}

        {/* Settings Page */}
        {currentPage === "settings" && (
          <Settings storage={storage} saveStorage={saveStorage} />
        )}
      </main>

      {/* Chat Modal */}
      {showModals.chat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">AI对话记录</h3>
              <button
                onClick={() => closeModal("chat")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>暂无对话记录</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.type === "ai" ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isStreaming && streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
                    <MarkdownRenderer content={streamingText} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
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
                disabled={aiLoading || isStreaming}
                className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Generation Modal */}
      {showModals.plan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">生成学习计划</h3>
              <button
                onClick={() => closeModal("plan")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  考试范围
                </label>
                <textarea
                  value={examScope || settings.examScope || ""}
                  onChange={(e) => setExamScope(e.target.value)}
                  placeholder="请输入考试范围..."
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all resize-none"
                  rows={6}
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => closeModal("plan")}
                className="flex-1 bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={aiLoading}
                className="flex-1 bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {aiLoading ? "生成中..." : "AI生成计划"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Modal */}
      {showModals.scope && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold">学习计划</h3>
              <button
                onClick={() => closeModal("scope")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {storage.totalPlan ? (
                <MarkdownRenderer content={storage.totalPlan} />
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>暂无学习计划，请先生成计划</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
              <button
                onClick={() => closeModal("scope")}
                className="flex-1 bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                关闭
              </button>
              <button
                onClick={() => openModal("plan")}
                className="flex-1 bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all"
              >
                重新生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle Modal */}
      {showModals.recycle && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">回收站</h3>
              <button
                onClick={() => closeModal("recycle")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center text-gray-400 py-12">
                <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>回收站为空</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => closeModal("recycle")}
                className="bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around max-w-6xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex-1 py-4 px-2 flex flex-col items-center gap-1 transition-all ${
                currentPage === item.id
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
