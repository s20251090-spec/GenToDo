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
  Calendar,
  Shuffle,
  Send,
  ChevronLeft,
  ChevronRight,
  Check,
  ListChecks,
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

  // Daily plan modal state
  const [currentStep, setCurrentStep] = useState(1);
  const [planDate, setPlanDate] = useState("");
  const [todayTarget, setTodayTarget] = useState("");
  const [planRemark, setPlanRemark] = useState("");
  const [generatedPlanContent, setGeneratedPlanContent] = useState("");
  const [modifyInput, setModifyInput] = useState("");
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [editTaskModal, setEditTaskModal] = useState(false);
  const [editTaskInput, setEditTaskInput] = useState("");
  const [currentTaskElement, setCurrentTaskElement] = useState<any>(null);

  // Total plan library
  const totalPlanLibrary = [
    "高等数学 第三章 微分中值定理与导数的应用",
    "大学英语 四级核心词汇 第5-8单元 背诵与默写",
    "数据结构 线性表与链表 知识点梳理与习题练习",
    "专业课 第一章 核心考点 背诵与思维导图整理",
    "历年真题 2023年 选择题部分 刷题与错题整理",
    "英语听力 真题短篇新闻 专项训练",
    "政治 马原第二章 唯物辩证法 知识点精讲",
    "计算机网络 传输层 TCP协议 核心知识点梳理"
  ];

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

    // Format date
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    setCurrentDate(now.toLocaleDateString("zh-CN", options));

    // Initialize plan date
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setPlanDate(`${year}-${month}-${day}`);
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

  // Daily plan modal functions
  const openDailyPlanModal = () => {
    setCurrentStep(1);
    setTodayTarget("");
    setPlanRemark("");
    setGeneratedPlanContent("");
    setModifyInput("");
    openModal("dailyPlan");
  };

  const closeDailyPlanModal = () => {
    closeModal("dailyPlan");
    setCurrentStep(1);
    setTodayTarget("");
    setPlanRemark("");
  };

  const getRandomTarget = () => {
    const randomIndex = Math.floor(Math.random() * totalPlanLibrary.length);
    setTodayTarget(totalPlanLibrary[randomIndex]);
  };

  const switchStep = (targetStep: number) => {
    setCurrentStep(targetStep);
    if (targetStep === 2) {
      triggerAiGenerate();
    }
  };

  const triggerAiGenerate = async () => {
    setAiPlanLoading(true);
    try {
      // Mock AI response - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockContent = `
- 【背诵四级核心词汇第5-8单元，完成200个单词的背诵与默写】 | 预计耗时：60分钟 | 优先级：高
- 【完成词汇配套练习题，订正错题并整理生词本】 | 预计耗时：30分钟 | 优先级：中
- 【英语听力短篇新闻专项训练，完成3篇真题听力】 | 预计耗时：40分钟 | 优先级：中
- 【精听听力原文，标注生词与长难句，跟读模仿】 | 预计耗时：30分钟 | 优先级：低
- 【复盘今日学习内容，整理生词本，完成当日打卡】 | 预计耗时：20分钟 | 优先级：高
      `;
      setGeneratedPlanContent(mockContent);
    } catch (error) {
      console.error("AI生成失败", error);
    } finally {
      setAiPlanLoading(false);
    }
  };

  const triggerAiModify = async (command: string) => {
    if (!command.trim()) return;
    
    setAiPlanLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const modifiedContent = `
- 【背诵四级核心词汇第5-8单元，完成200个单词的背诵与默写】 | 预计耗时：60分钟 | 优先级：高
- 【完成词汇配套练习题，订正错题并整理生词本】 | 预计耗时：30分钟 | 优先级：中
- 【新增：背诵高频核心词组50个，完成配套填空练习】 | 预计耗时：40分钟 | 优先级：高
- 【英语听力短篇新闻专项训练，完成5篇真题听力】 | 预计耗时：50分钟 | 优先级：中
- 【精听听力原文，标注生词与长难句，跟读模仿】 | 预计耗时：30分钟 | 优先级：低
- 【复盘今日学习内容，整理生词本，完成当日打卡】 | 预计耗时：20分钟 | 优先级：高
      `;
      setGeneratedPlanContent(modifiedContent);
      setModifyInput("");
    } catch (error) {
      console.error("AI修改失败", error);
    } finally {
      setAiPlanLoading(false);
    }
  };

  const saveAndApplyPlan = () => {
    const planData = {
      planDate,
      todayTarget,
      remark: planRemark,
      planContent: generatedPlanContent,
      createTime: new Date().getTime()
    };

    localStorage.setItem(`genTodo_plan_${planDate}`, JSON.stringify(planData));
    closeDailyPlanModal();
    alert("计划已成功保存并应用到对应日期！");
  };

  const handleGeneratePlan = async () => {
    if (!examScope) {
      alert("请先输入考试范围");
      return;
    }

    setAiLoading(true);
    try {
      const response = await generatePlanMutation.mutateAsync({
        examScope,
        totalPlan: storage.totalPlan || "",
        chatHistory: storage.chatHistory || [],
      });

      const newTodo = {
        id: Date.now(),
        text: response.content,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      const newStorage = { ...storage, todoHistory: { ...storage.todoHistory, [new Date().toDateString()]: updatedTodos } };
      saveStorage(newStorage);
    } catch (error) {
      console.error("生成计划失败", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");

    try {
      resetStreaming();
      await stream({
        messages: newMessages,
        examScope: storage.examScope || "",
        totalPlan: storage.totalPlan || "",
      });

      const newStorage = { ...storage, chatHistory: newMessages };
      saveStorage(newStorage);
    } catch (error) {
      console.error("发送消息失败", error);
    }
  };

  const handleDeleteTodo = (id: number) => {
    const deletedTodo = todos.find(t => t.id === id);
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    
    const newStorage = {
      ...storage,
      recycleBin: [...storage.recycleBin, deletedTodo],
      todoHistory: { ...storage.todoHistory, [new Date().toDateString()]: updatedTodos }
    };
    saveStorage(newStorage);
  };

  const handleToggleTodo = (id: number) => {
    const updatedTodos = todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updatedTodos);
    
    const newStorage = { ...storage, todoHistory: { ...storage.todoHistory, [new Date().toDateString()]: updatedTodos } };
    saveStorage(newStorage);
  };

  // Dashboard page
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">GenToDo</h1>
          <p className="text-slate-500 mt-1">{currentDate}</p>
        </div>
        <button
          onClick={openDailyPlanModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all"
        >
          <Zap size={20} />
          生成今日ToDo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckSquare2 size={24} className="text-blue-500" />
            <span className="text-slate-600">今日完成</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{todayProgress}</p>
          <p className="text-sm text-slate-500 mt-2">个任务</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={24} className="text-blue-500" />
            <span className="text-slate-600">总进度</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalProgress}%</p>
          <p className="text-sm text-slate-500 mt-2">学习进度</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">一键生成今日学习计划</h3>
        <p className="text-slate-600 mb-4">AI将根据你的总计划、学习历史、自动为你生成今日最优ToDo清单</p>
        <button
          onClick={openDailyPlanModal}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all font-medium"
        >
          <Sparkles className="inline mr-2" size={20} />
          生成今日计划
        </button>
      </div>
    </div>
  );

  // Todo list page
  const renderTodoList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">待办清单</h2>
        <button
          onClick={openDailyPlanModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
        >
          <Zap size={18} />
          添加
        </button>
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare2 size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">暂无待办任务</p>
        </div>
      ) : (
        todos.map(todo => (
          <div
            key={todo.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)}
              className="w-5 h-5 rounded cursor-pointer"
            />
            <span className={`flex-1 ${todo.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
              {todo.text}
            </span>
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          </div>
        ))
      )}
    </div>
  );

  // AI chat page
  const renderAiChat = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">AI对话</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm h-96 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">开始与AI对话</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-900"
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
        {currentIsStreaming && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-2 rounded-2xl bg-slate-100 text-slate-900">
              <MarkdownRenderer content={currentStreamingText} />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="输入消息..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSendMessage}
          disabled={currentIsStreaming}
          className="px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );

  // Settings page
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">设置</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">考试范围</label>
          <textarea
            value={examScope}
            onChange={(e) => setExamScope(e.target.value)}
            placeholder="输入考试范围..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">总学习计划</label>
          <textarea
            value={storage.totalPlan || ""}
            onChange={(e) => {
              const newStorage = { ...storage, totalPlan: e.target.value };
              saveStorage(newStorage);
            }}
            placeholder="输入总学习计划..."
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            rows={4}
          />
        </div>

        <button
          onClick={() => openModal("scope")}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
        >
          查看存储数据
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentPage === "dashboard" && renderDashboard()}
        {currentPage === "todo" && renderTodoList()}
        {currentPage === "ai" && renderAiChat()}
        {currentPage === "settings" && renderSettings()}
      </div>

      {/* Daily Plan Modal - 100% replicated from HTML */}
      {showModals.dailyPlan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-90 max-w-2xl max-h-85vh overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="px-7 py-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <ListChecks size={24} className="text-blue-500" />
                每日学习计划生成
              </h2>
              <button
                onClick={closeDailyPlanModal}
                className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step bar */}
            <div className="px-7 pb-5 flex gap-3">
              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-500 transition-all ${currentStep >= 1 ? "w-full" : "w-0"}`}></div>
              </div>
              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-500 transition-all ${currentStep >= 2 ? "w-full" : "w-0"}`}></div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-7 pb-6 max-h-96 overflow-y-auto">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Calendar size={18} />
                      计划日期
                    </label>
                    <input
                      type="date"
                      value={planDate}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Target size={18} />
                      今日学习目标
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={todayTarget}
                        onChange={(e) => setTodayTarget(e.target.value)}
                        placeholder="请输入今日核心学习目标，可点击右侧按钮从总计划库随机获取"
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={getRandomTarget}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-all"
                      >
                        <Shuffle size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <FileText size={18} />
                      备注信息（选填）
                    </label>
                    <textarea
                      value={planRemark}
                      onChange={(e) => setPlanRemark(e.target.value)}
                      placeholder="可输入补充说明、学习要求、注意事项等内容"
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: AI Generation */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modifyInput}
                      onChange={(e) => setModifyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && triggerAiModify(modifyInput)}
                      placeholder="输入修改指令，AI将为你调整计划，例如：增加2道数学练习题、调整任务优先级、拆分复杂任务"
                      className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => triggerAiModify(modifyInput)}
                      className="w-11 h-11 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 flex items-center justify-center transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 min-h-48 max-h-48 overflow-y-auto">
                    {aiPlanLoading ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <div className="w-10 h-10 border-3 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-slate-600">AI正在为你生成学习计划...</p>
                      </div>
                    ) : generatedPlanContent ? (
                      <div className="space-y-2">
                        {generatedPlanContent.split('\n').filter(line => line.trim()).map((line, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                          >
                            {line.trim()}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              {currentStep === 2 && (
                <button
                  onClick={() => switchStep(1)}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft size={18} />
                  上一步
                </button>
              )}
              <div className="flex-1"></div>
              {currentStep === 1 && (
                <button
                  onClick={() => triggerAiGenerate()}
                  className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
                >
                  <Sparkles size={18} />
                  用AI生成计划
                </button>
              )}
              <button
                onClick={() => currentStep === 1 ? switchStep(2) : saveAndApplyPlan()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all"
              >
                {currentStep === 1 ? (
                  <>
                    下一步
                    <ChevronRight size={18} />
                  </>
                ) : (
                  <>
                    保存并应用计划
                    <Check size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-around max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${
            currentPage === "dashboard"
              ? "text-blue-500 bg-blue-50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <HomeIcon size={24} />
          <span className="text-xs font-medium">首页</span>
        </button>

        <button
          onClick={() => setCurrentPage("todo")}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${
            currentPage === "todo"
              ? "text-blue-500 bg-blue-50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CheckSquare2 size={24} />
          <span className="text-xs font-medium">待办</span>
        </button>

        <button
          onClick={() => setCurrentPage("ai")}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${
            currentPage === "ai"
              ? "text-blue-500 bg-blue-50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles size={24} />
          <span className="text-xs font-medium">AI管理</span>
        </button>

        <button
          onClick={() => setCurrentPage("settings")}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${
            currentPage === "settings"
              ? "text-blue-500 bg-blue-50"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <SettingsIcon size={24} />
          <span className="text-xs font-medium">设置</span>
        </button>
      </div>

      {/* Add padding to prevent content from being hidden behind navigation */}
      <div className="h-24"></div>
    </div>
  );
}
