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
} from "lucide-react";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentDate, setCurrentDate] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    todoComposer: false,
  });
  const [composerTab, setComposerTab] = useState<"ai" | "manual">("ai");
  const [manualMarkdown, setManualMarkdown] = useState("");
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanRange, setNewPlanRange] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dailyTheme, setDailyTheme] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [aiDetailView, setAiDetailView] = useState<"grid" | "chat" | "plan" | "scope" | "recycle">("grid");
  const [showWelcome, setShowWelcome] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [commandTemplates] = useState({
    A: "生成总计划: {{exam_scope}} {{exam_date}}",
    B: "每日生成: {{selected_date}} {{daily_theme}} {{master_plan}}",
    C: "AI对话调整: {{current_todo}} {{user_instruction}}",
  });
  const [variables] = useState([
    { key: "exam_scope", defaultValue: "数学:代数/几何" },
    { key: "exam_date", defaultValue: "2026-12-01" },
    { key: "selected_date", defaultValue: new Date().toISOString().slice(0, 10) },
    { key: "daily_theme", defaultValue: "函数专题冲刺" },
  ]);

  // tRPC mutations
  const generatePlanMutation = trpc.ai.generate.useMutation();
  
  // Streaming hook
  const { stream, streamingText: currentStreamingText, isStreaming: currentIsStreaming, reset: resetStreaming } = useStreamingAI();

  // Load storage from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gentodo_storage");
    const seenWelcome = localStorage.getItem("gentodo_onboarding_done");
    setShowWelcome(!seenWelcome);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStorage(parsed);
        setMessages(parsed.chatHistory || []);
      } catch (e) {
        console.error("加载存储失败", e);
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

  useEffect(() => {}, [storage?.examScope]);

  // Save storage to localStorage
  const saveStorage = (newStorage: any) => {
    setStorage(newStorage);
    localStorage.setItem("gentodo_storage", JSON.stringify(newStorage));
  };

  // keep a single source of truth for currently selected todo date key
  const getTodayKey = () => selectedDate;

  const extractTodosFromPlan = (planText: string) => {
    return planText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^([-*•]|\d+[.)、])\s+/.test(line))
      .map((line, idx) => ({
        id: Date.now() + idx,
        content: line.replace(/^([-*•]|\d+[.)、])\s+/, "").trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      }))
      .filter((todo) => todo.content.length > 0);
  };

  const openModal = (modalId: string) => {
    setShowModals((prev) => ({ ...prev, [modalId]: true }));
  };

  const closeModal = (modalId: string) => {
    setShowModals((prev) => ({ ...prev, [modalId]: false }));
  };

  const handleGeneratePlan = async () => {
    setGenerationError("");
    if (!selectedPlanId) {
      const msg = "请先选择一个总计划表，再生成每日待办。";
      setGenerationError(msg);
      alert(msg);
      return;
    }
    if (!selectedDate) {
      const msg = "请先选择日期，再生成每日待办。";
      setGenerationError(msg);
      alert(msg);
      return;
    }

    setAiLoading(true);
    try {
      const selectedPlan = (storage.planList || []).find((p: any) => p.id === selectedPlanId);
      if (!selectedPlan) {
        const msg = "未找到已选总计划，请重新选择。";
        setGenerationError(msg);
        alert(msg);
        return;
      }
      const prompt = `你是专业的备考学习计划规划师。请仅输出Markdown无序列表任务，不要输出任何解释。\n\n(总学习计划表):\n${selectedPlan.content}\n\n(考试截止日期): ${storage.examDate || "未设置"}\n(考试核心范围): ${storage.examScope || examScope || "未设置"}\n(当日指定学习主题): ${dailyTheme || "综合复习"}\n(用户已完成历史学习任务全量记录): ${JSON.stringify(storage.learningHistory || {})}\n(计划生成日期): ${selectedDate}\n\n输出格式强制：\n- 【任务内容】 | 预计耗时：(XX分钟) | 优先级：(高/中/低)`;

      const result = await generatePlanMutation.mutateAsync({ prompt });
      const plan = result.result;
      setGeneratedMarkdown(plan);
      alert("AI 计划已生成，点击「应用到今日待办」即可导入列表。");
    } catch (error) {
      console.error("计划生成失败:", error);
      const msg = `计划生成失败：${error instanceof Error ? error.message : "未知错误"}`;
      setGenerationError(msg);
      alert(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const applyMarkdownToTodayTodos = (markdown: string) => {
    const todayKey = getTodayKey();
    const generatedTodos = extractTodosFromPlan(markdown);
    const newStorage = {
      ...storage,
      examScope: storage.examScope || examScope,
      todoHistory: {
        ...(storage.todoHistory || {}),
        [todayKey]: generatedTodos,
      },
    };
    saveStorage(newStorage);
    setTodos(generatedTodos);
    setManualMarkdown("");
    setGeneratedMarkdown("");
    closeModal("scope");
    closeModal("todoComposer");
    alert(`已应用 ${generatedTodos.length} 条待办到今日列表`);
  };

  const handleApplyAiPlan = () => {
    if (!generatedMarkdown.trim()) {
      alert("请先生成 AI 计划");
      return;
    }
    applyMarkdownToTodayTodos(generatedMarkdown);
  };

  const handleApplyManualMarkdown = () => {
    if (!manualMarkdown.trim()) {
      alert("请先输入 Markdown");
      return;
    }
    applyMarkdownToTodayTodos(manualMarkdown);
  };

  const handleOpenTodoComposer = () => {
    setComposerTab("ai");
    openModal("todoComposer");
  };

  const handleOpenScopeModal = () => {
    setComposerTab("ai");
    openModal("scope");
  };

  const handleCreateMasterPlan = async () => {
    if (!newPlanName.trim() || !newPlanRange.trim()) return alert("请填写计划名称和范围");
    const prompt = `根据以下学习范围生成总计划（markdown列表）:\n${newPlanRange}`;
    setAiLoading(true);
    try {
      const result = await generatePlanMutation.mutateAsync({ prompt });
      const content = result.result;
      const plan = { id: String(Date.now()), name: newPlanName.trim(), content, time: new Date().toISOString().slice(0, 10) };
      const planList = [plan, ...(storage.planList || [])];
      const nextStorage = { ...storage, planList, totalPlan: content };
      saveStorage(nextStorage);
      setSelectedPlanId(plan.id);
      setNewPlanName("");
      setNewPlanRange("");
    } finally {
      setAiLoading(false);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("gentodo_onboarding_done", "1");
    setShowWelcome(false);
    setCurrentPage("settings");
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
      await stream(userInput, {
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

  useEffect(() => {
    const dayKey = getTodayKey();
    const todayTodos = storage?.todoHistory?.[dayKey] || [];
    setTodos(todayTodos);

    const completed = todayTodos.filter((todo: any) => todo.completed).length;
    const todayRate = todayTodos.length ? Math.round((completed / todayTodos.length) * 100) : 0;
    setTodayProgress(todayRate);
  }, [storage, selectedDate]);

  const hasPlan = !!storage.totalPlan;

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto relative bg-gray-50 overflow-hidden">
      {showWelcome && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-2">欢迎使用 GenToDo</h2>
            <p className="text-gray-500 mb-6">AI驱动学习计划系统，首次使用建议完成4步初始化。</p>
            <div className="space-y-2 text-sm mb-6">
              <p className={onboardingStep >= 1 ? "text-blue-600 font-medium" : "text-gray-400"}>1. 配置考试范围</p>
              <p className={onboardingStep >= 2 ? "text-blue-600 font-medium" : "text-gray-400"}>2. 创建总学习计划</p>
              <p className={onboardingStep >= 3 ? "text-blue-600 font-medium" : "text-gray-400"}>3. 选择日期与主题</p>
              <p className={onboardingStep >= 4 ? "text-blue-600 font-medium" : "text-gray-400"}>4. 生成首个每日待办</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowWelcome(false)} className="px-4 py-2 rounded-[999px] bg-gray-100">稍后</button>
              <button onClick={finishOnboarding} className="px-4 py-2 rounded-[999px] bg-blue-600 text-white">开始使用</button>
            </div>
          </div>
        </div>
      )}
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
                  className={`rounded-[999px] px-4 py-2 font-medium text-sm ${
                    hasPlan
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {hasPlan ? "学习计划进行中" : "未配置学习计划"}
                </span>
              </div>
            </div>

            {!hasPlan ? (
              <div className="bg-white rounded-[2rem] shadow-sm p-6 mb-8 hover:shadow-md transition-all">
                <div className="flex flex-col items-center text-center">
                  <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">一键生成今日学习计划</h3>
                  <p className="text-gray-500 mb-6">
                    AI将根据你的总计划、学习历史，自动为你生成今日最优ToDo清单
                  </p>
                  <button
                    onClick={handleOpenScopeModal}
                    className="bg-blue-600 text-white rounded-[999px] shadow-sm py-3 px-8 font-medium hover:shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    生成今日ToDo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-blue-600 text-white rounded-[2rem] shadow-sm p-6 mb-8 hover:shadow-md transition-all">
                  <div className="flex items-center mb-2">
                    <Target className="w-5 h-5 mr-2" />
                    <h3 className="font-semibold text-lg">今日核心聚焦目标</h3>
                  </div>
                  <p className="text-white/90 text-xl font-medium">
                    {storage.totalPlan ? String(storage.totalPlan).slice(0, 100) : "暂无目标"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-lg mb-4">当日任务完成率</h3>
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#E8F3FF"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#165DFF"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${282.74 * (todayProgress / 100)} 282.74`}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold text-blue-600">
                            {todayProgress}%
                          </span>
                          <span className="text-gray-400 text-sm">已完成 / 总任务</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-lg mb-4">整体学习计划进度</h3>
                    <div className="flex flex-col h-full justify-center">
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">总进度完成度</span>
                          <span className="text-blue-600 font-bold">{totalProgress}%</span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 rounded-[999px] overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-[999px] transition-all duration-500"
                            style={{ width: `${totalProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-400 text-sm mb-1">开始日期</p>
                          <p className="font-semibold">-</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-400 text-sm mb-1">截止日期</p>
                          <p className="font-semibold">-</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">近期待办预览</h3>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                      查看全部
                    </button>
                  </div>
                  <div className="text-center text-gray-400 py-8">
                    暂无待办任务，点击上方按钮生成今日计划
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ToDo List Page */}
        {currentPage === "todo-list" && (
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
                  ToDo 任务列表
                </h2>
                <p className="text-gray-500">按天管理你的学习待办任务</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-2">
                <button onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))} className="text-sm bg-white border border-gray-200 px-3 py-2 rounded-[999px]">返回今天</button>
                <button onClick={() => setShowDatePicker((v) => !v)} className="text-lg font-semibold text-blue-600 bg-blue-50 px-5 py-2 rounded-[999px] cursor-pointer select-none">
                  {selectedDate}
                </button>
                {showDatePicker && (
                  <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setShowDatePicker(false); }} className="bg-white border border-gray-200 rounded-[999px] px-3 py-2" />
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex bg-white rounded-[999px] shadow-sm p-1">
                <button className="rounded-[999px] px-5 py-2 font-medium transition-all bg-blue-600 text-white">
                  当日待办
                </button>
                <button className="rounded-[999px] px-5 py-2 font-medium transition-all text-gray-600 hover:bg-gray-50">
                  总清单
                </button>
              </div>
              <div className="flex gap-2">
                <select className="w-auto bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all">
                  <option>全部日期</option>
                  <option>今日</option>
                  <option>未来7天</option>
                  <option>已过期</option>
                </select>
                <select className="w-auto bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all">
                  <option>全部状态</option>
                  <option>未完成</option>
                  <option>已完成</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-sm p-8 text-center border border-gray-100">
                  <CheckSquare2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">暂无待办任务</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div key={todo.id} className="bg-white rounded-[2rem] shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                    <input type="checkbox" checked={!!todo.completed} readOnly className="w-5 h-5" />
                    <div className="text-gray-800 text-sm">
                      <MarkdownRenderer content={todo.content} />
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={handleOpenTodoComposer}
              className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-[999px] shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-3xl leading-none"
            >
              +
            </button>
          </div>
        )}

        {/* AI Editor Page */}
        {currentPage === "ai-editor" && (
          <div className="animate-fadeIn">
            <div className="mb-8 bg-white rounded-[2rem] p-4 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[999px] bg-blue-100 flex items-center justify-center text-blue-600 font-bold">U</div>
                <div>
                  <p className="font-semibold text-gray-800">学习者档案</p>
                  <p className="text-xs text-gray-500">{storage.examScope ? "考试范围已配置" : "请先配置考试范围"}</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-[999px] bg-gray-100 text-sm">编辑资料</button>
            </div>
            <div className="mb-8">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
                AI 学习计划管理
              </h2>
              <p className="text-gray-500">管理你的学习计划、对话记录、考试范围与回收站</p>
            </div>

            {aiDetailView === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Chat Card */}
              <button
                onClick={() => setAiDetailView("chat")}
                className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-[999px] flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">AI对话</h3>
                <p className="text-sm text-gray-500">与AI沟通调整计划</p>
                <span className="mt-3 inline-block text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-[999px]">
                  {storage.chatHistory.length}条记录
                </span>
              </button>

              {/* Plan Card */}
              <button
                onClick={() => setAiDetailView("plan")}
                className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-[999px] flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">总计划表</h3>
                <p className="text-sm text-gray-500">查看编辑总学习计划</p>
                <span className="mt-3 inline-block text-xs bg-emerald-100 text-emerald-500 px-3 py-1 rounded-[999px]">
                  {hasPlan ? "已配置" : "未配置"}
                </span>
              </button>

              {/* Scope Card */}
              <button
                onClick={() => setAiDetailView("scope")}
                className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-[999px] flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">考试范围</h3>
                <p className="text-sm text-gray-500">配置考试范围与PDF</p>
                <span className="mt-3 inline-block text-xs bg-orange-100 text-orange-500 px-3 py-1 rounded-[999px]">
                  {storage.examScope ? "已配置" : "未配置"}
                </span>
              </button>

              {/* Recycle Card */}
              <button
                onClick={() => setAiDetailView("recycle")}
                className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-red-100 rounded-[999px] flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">回收站</h3>
                <p className="text-sm text-gray-500">恢复或彻底删除记录</p>
                <span className="mt-3 inline-block text-xs bg-red-100 text-red-500 px-3 py-1 rounded-[999px]">
                  {storage.recycleBin?.length || 0}条记录
                </span>
              </button>
            </div>
            )}
            {aiDetailView !== "grid" && (
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100">
                <button onClick={() => setAiDetailView("grid")} className="mb-4 px-4 py-2 rounded-[999px] bg-gray-100">返回模块</button>
                <p className="text-lg font-semibold">当前详情页：{aiDetailView}</p>
                <p className="text-sm text-gray-500 mt-2">已切换为详情页模式，可在此继续操作对应模块。</p>
                <div className="mt-4">
                  {aiDetailView === "chat" && <button onClick={() => openModal("chat")} className="px-4 py-2 rounded-[999px] bg-blue-600 text-white">打开AI对话详情</button>}
                  {aiDetailView === "plan" && <button onClick={() => openModal("plan")} className="px-4 py-2 rounded-[999px] bg-blue-600 text-white">打开总计划详情</button>}
                  {aiDetailView === "scope" && <button onClick={() => openModal("scope")} className="px-4 py-2 rounded-[999px] bg-blue-600 text-white">打开考试范围详情</button>}
                  {aiDetailView === "recycle" && <button onClick={() => openModal("recycle")} className="px-4 py-2 rounded-[999px] bg-blue-600 text-white">打开回收站详情</button>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Page */}
        {currentPage === "settings" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
                系统设置
              </h2>
              <p className="text-gray-500">配置你的考试范围，生成标准化总学习计划</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-[2rem] shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  考试范围配置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">考试范围详情</label>
                    <textarea
                      className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all min-h-[180px] resize-none"
                      placeholder="请输入你的考试信息..."
                    />
                    <p className="text-xs text-gray-400 mt-1">必填项：考试核心范围，建议包含科目与题型范围。</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">上传考试范围PDF（可选）</label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button className="bg-blue-600 text-white rounded-[999px] py-3 px-8 font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      提交生成复习计划
                    </button>
                  </div>
                  <p className="text-xs text-emerald-600">保存后会同步到本地存储并用于AI生成。</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-blue-600" />
                  系统配置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">后端API基础地址</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                      placeholder="请输入API基础地址"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  数据管理
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gray-100 text-gray-700 rounded-[999px] py-3 px-6 font-medium hover:bg-gray-200 transition-all text-left flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    一键导出所有数据
                  </button>
                  <button className="w-full bg-gray-100 text-red-600 rounded-[999px] py-3 px-6 font-medium hover:bg-red-50 transition-all text-left flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空所有本地数据
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-[2rem] p-4 text-center text-sm text-gray-500">
                <p>产品名称：GenToDo | 版本号：v12.5.7 | © 2026 GenToDo 保留所有权利</p>
              </div>
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100">
                <h3 className="font-semibold mb-3">命令与变量库</h3>
                <div className="space-y-2 text-sm">
                  <p><b>A</b>: {commandTemplates.A}</p>
                  <p><b>B</b>: {commandTemplates.B}</p>
                  <p><b>C</b>: {commandTemplates.C}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <span key={v.key} className="px-3 py-1 rounded-[999px] bg-blue-50 text-blue-700 text-xs">{`{{${v.key}}}=${v.defaultValue}`}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModals.chat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">AI对话记录</h3>
              <button
                onClick={() => closeModal("chat")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">暂无对话记录</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-lg px-4 py-2 rounded-[2rem] ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.type === "user" ? (
                        msg.content
                      ) : (
                        <div className="text-sm">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isStreaming && streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-lg bg-gray-100 text-gray-800 px-4 py-2 rounded-[2rem]">
                    <div className="text-sm">
                      <MarkdownRenderer content={streamingText} />
                    </div>
                  </div>
                </div>
              )}
              {isStreaming && !streamingText && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-[2rem]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-600 rounded-[999px] animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-[999px] animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-gray-600 rounded-[999px] animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-2">
              <input
                type="text"
                className="flex-1 bg-gray-50 rounded-[999px] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                placeholder="输入你的调整需求..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !aiLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={aiLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={aiLoading}
                className="bg-blue-600 text-white rounded-[999px] p-3 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      {showModals.plan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">总学习计划</h3>
              <button
                onClick={() => closeModal("plan")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-[2rem] p-4 border border-gray-100">
                  <h4 className="font-semibold mb-3">总计划表列表</h4>
                  {(storage.planList || []).length === 0 ? (
                    <p className="text-sm text-gray-400">暂无总计划</p>
                  ) : (
                    <div className="space-y-2">
                      {(storage.planList || []).map((plan: any) => (
                        <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`w-full text-left p-3 rounded-[1.25rem] border ${selectedPlanId === plan.id ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-gray-500">{plan.time}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(storage.planList || []).find((p: any) => p.id === selectedPlanId)?.content || storage.totalPlan ? (
                  <MarkdownRenderer content={(storage.planList || []).find((p: any) => p.id === selectedPlanId)?.content || storage.totalPlan} className="prose prose-sm" />
                ) : (
                  <div className="text-center text-gray-400 py-12">暂无可查看计划</div>
                )}
                <div className="bg-white border border-gray-100 rounded-[2rem] p-4 space-y-3">
                  <h4 className="font-semibold">新建总计划</h4>
                  <input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} className="w-full bg-gray-50 rounded-[1.25rem] px-4 py-3" placeholder="计划名称" />
                  <textarea value={newPlanRange} onChange={(e) => setNewPlanRange(e.target.value)} className="w-full bg-gray-50 rounded-[1.25rem] px-4 py-3 min-h-[100px]" placeholder="考试范围 / 学习范围" />
                  <button onClick={handleCreateMasterPlan} disabled={aiLoading} className="bg-blue-600 text-white rounded-[999px] py-2 px-5">{aiLoading ? "生成中..." : "AI生成总计划"}</button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button className="bg-gray-100 text-gray-700 rounded-[999px] py-3 px-6 font-medium hover:bg-gray-200 transition-all">
                AI优化计划
              </button>
              <button
                onClick={() => closeModal("plan")}
                className="bg-blue-600 text-white rounded-[999px] py-3 px-6 font-medium hover:bg-blue-700 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {showModals.scope && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">考试范围配置</h3>
              <button
                onClick={() => closeModal("scope")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex bg-gray-100 rounded-[999px] p-1">
                <button onClick={() => setComposerTab("ai")} className={`flex-1 py-2 rounded-[999px] ${composerTab === "ai" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>AI计划生成</button>
                <button onClick={() => setComposerTab("manual")} className={`flex-1 py-2 rounded-[999px] ${composerTab === "manual" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>手动输入</button>
              </div>
              {composerTab === "ai" ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">考试范围文本</label>
                  <textarea
                    value={examScope}
                    onChange={(e) => setExamScope(e.target.value)}
                    className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all min-h-[200px] resize-none"
                    placeholder="请输入考试范围..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">当日学习主题</label>
                  <input
                    value={dailyTheme}
                    onChange={(e) => setDailyTheme(e.target.value)}
                    className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                    placeholder="例如：函数专题冲刺"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">上传PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">参考总计划（必选）</label>
                  <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600">
                    <option value="">请选择总计划</option>
                    {(storage.planList || []).map((plan: any) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                {generatedMarkdown && (
                  <div className="bg-gray-50 rounded-[2rem] p-4">
                    <p className="text-sm text-gray-500 mb-2">AI 生成预览（Markdown）</p>
                    <pre className="text-xs whitespace-pre-wrap text-gray-700 max-h-48 overflow-y-auto">{generatedMarkdown}</pre>
                  </div>
                )}
                {aiLoading && (
                  <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-4 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-[999px] animate-spin" />
                    <p className="text-sm text-blue-700">AI 正在生成每日待办，请稍候...</p>
                  </div>
                )}
                {generationError && (
                  <div className="bg-red-50 border border-red-100 rounded-[2rem] p-4">
                    <p className="text-sm text-red-700">{generationError}</p>
                  </div>
                )}
              </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-medium mb-1 block">Markdown 输入</label>
                  <textarea value={manualMarkdown} onChange={(e) => setManualMarkdown(e.target.value)} className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all min-h-[280px] resize-none" placeholder="- [ ] 复习代数第一章\n- 完成几何练习 10 题" />
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              {composerTab === "ai" ? (
                <>
                  <button onClick={handleGeneratePlan} disabled={aiLoading} className="bg-gray-100 text-gray-700 rounded-[999px] py-3 px-6 font-medium hover:bg-gray-200 transition-all disabled:opacity-50">AI生成</button>
                  <button onClick={handleApplyAiPlan} className="bg-blue-600 text-white rounded-[999px] py-3 px-6 font-medium hover:bg-blue-700 transition-all">应用到今日待办</button>
                </>
              ) : (
                <button onClick={handleApplyManualMarkdown} className="bg-blue-600 text-white rounded-[999px] py-3 px-6 font-medium hover:bg-blue-700 transition-all">导入 Markdown 到待办</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModals.todoComposer && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">添加今日待办</h3>
              <button onClick={() => closeModal("todoComposer")} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-4 flex bg-gray-100 rounded-[999px] p-1">
                <button onClick={() => setComposerTab("ai")} className={`flex-1 py-2 rounded-[999px] ${composerTab === "ai" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>AI计划生成</button>
                <button onClick={() => setComposerTab("manual")} className={`flex-1 py-2 rounded-[999px] ${composerTab === "manual" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>手动输入</button>
              </div>
              {composerTab === "ai" ? (
                <div className="space-y-4">
                  <textarea value={examScope} onChange={(e) => setExamScope(e.target.value)} className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 min-h-[160px]" placeholder="请输入考试范围..." />
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleGeneratePlan} disabled={aiLoading} className="bg-gray-100 text-gray-700 rounded-[999px] py-2 px-4">AI生成</button>
                    <button onClick={handleApplyAiPlan} className="bg-blue-600 text-white rounded-[999px] py-2 px-4">应用</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea value={manualMarkdown} onChange={(e) => setManualMarkdown(e.target.value)} className="w-full bg-gray-50 rounded-[2rem] px-4 py-3 min-h-[220px]" placeholder="- [ ] 任务1" />
                  <div className="flex justify-end"><button onClick={handleApplyManualMarkdown} className="bg-blue-600 text-white rounded-[999px] py-2 px-4">导入</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModals.recycle && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">回收站</h3>
              <button
                onClick={() => closeModal("recycle")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-center text-gray-400 py-12">
                <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>回收站为空</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button className="text-red-600 rounded-[999px] py-3 px-6 font-medium hover:bg-red-50 transition-all">
                清空回收站
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-6xl mx-auto w-full z-40">
        <div className="flex justify-around items-center h-20 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all ${
                  currentPage === item.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
