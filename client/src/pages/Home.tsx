import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  Loader,
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
  const [apiUrl, setApiUrl] = useState("http://localhost:8080/api");
  const [showModals, setShowModals] = useState({
    chat: false,
    plan: false,
    scope: false,
    recycle: false,
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [genAI, setGenAI] = useState<GoogleGenerativeAI | null>(null);

  // Initialize Gemini AI
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      setGenAI(new GoogleGenerativeAI(apiKey));
    }
  }, []);

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
      year: "numeric" as const,
      month: "long" as const,
      day: "numeric" as const,
      weekday: "long" as const,
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

  const handleSaveScope = () => {
    const newStorage = { ...storage, examScope };
    saveStorage(newStorage);
    closeModal("scope");
    alert("考试范围已保存");
  };

  const handleGeneratePlan = async () => {
    if (!examScope || !genAI) {
      alert("请先输入考试范围");
      return;
    }

    setAiLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `基于以下考试范围，生成一份详细的学习计划：\n\n${examScope}\n\n请提供：\n1. 学习目标\n2. 学习阶段划分\n3. 每个阶段的重点内容\n4. 复习策略\n5. 每日学习建议`;
      
      const result = await model.generateContent(prompt);
      const plan = result.response.text();

      const newStorage = { ...storage, totalPlan: plan };
      saveStorage(newStorage);
      closeModal("scope");
      alert("学习计划已生成！");
    } catch (error) {
      console.error("计划生成失败:", error);
      alert("计划生成失败，请检查API密钥");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !genAI) return;

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

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(userInput);
      const aiResponse = result.response.text();

      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        type: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      const updatedStorage = {
        ...storage,
        chatHistory: [...(storage.chatHistory || []), userMessage, aiMessage],
      };
      saveStorage(updatedStorage);
    } catch (error) {
      console.error("AI生成失败:", error);
      const errorMessage = {
        id: Date.now() + 1,
        content: "抱歉，AI生成失败。请检查API密钥是否正确配置。",
        type: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
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
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {hasPlan ? "学习计划进行中" : "未配置学习计划"}
                </span>
              </div>
            </div>

            {!hasPlan ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 hover:shadow-md transition-all">
                <div className="flex flex-col items-center text-center">
                  <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">一键生成今日学习计划</h3>
                  <p className="text-gray-500 mb-6">
                    AI将根据你的总计划、学习历史，自动为你生成今日最优ToDo清单
                  </p>
                  <button className="bg-blue-600 text-white rounded-full shadow-sm py-3 px-8 font-medium hover:shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    生成今日ToDo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-blue-600 text-white rounded-2xl shadow-sm p-6 mb-8 hover:shadow-md transition-all">
                  <div className="flex items-center mb-2">
                    <Target className="w-5 h-5 mr-2" />
                    <h3 className="font-semibold text-lg">今日核心聚焦目标</h3>
                  </div>
                  <p className="text-white/90 text-xl font-medium">
                    {storage.totalPlan ? String(storage.totalPlan).slice(0, 100) : "暂无目标"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
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

                  <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-lg mb-4">整体学习计划进度</h3>
                    <div className="flex flex-col h-full justify-center">
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">总进度完成度</span>
                          <span className="text-blue-600 font-bold">{totalProgress}%</span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
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

                <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
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
              <div className="mt-4 md:mt-0 text-lg font-semibold text-blue-600 bg-blue-50 px-5 py-2 rounded-full cursor-pointer select-none">
                2026年05月02日
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex bg-white rounded-full shadow-sm p-1">
                <button className="rounded-full px-5 py-2 font-medium transition-all bg-blue-600 text-white">
                  当日待办
                </button>
                <button className="rounded-full px-5 py-2 font-medium transition-all text-gray-600 hover:bg-gray-50">
                  总清单
                </button>
              </div>
              <div className="flex gap-2">
                <select className="w-auto bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all">
                  <option>全部日期</option>
                  <option>今日</option>
                  <option>未来7天</option>
                  <option>已过期</option>
                </select>
                <select className="w-auto bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all">
                  <option>全部状态</option>
                  <option>未完成</option>
                  <option>已完成</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <CheckSquare2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">暂无待办任务</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Editor Page */}
        {currentPage === "ai-editor" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
                AI 学习计划管理
              </h2>
              <p className="text-gray-500">管理你的学习计划、对话记录、考试范围与回收站</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Chat Card */}
              <button
                onClick={() => openModal("chat")}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">AI对话</h3>
                <p className="text-sm text-gray-500">与AI沟通调整计划</p>
                <span className="mt-3 inline-block text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                  {storage.chatHistory.length}条记录
                </span>
              </button>

              {/* Plan Card */}
              <button
                onClick={() => openModal("plan")}
                className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">总计划表</h3>
                <p className="text-sm text-gray-500">查看编辑总学习计划</p>
                <span className="mt-3 inline-block text-xs bg-emerald-100 text-emerald-500 px-3 py-1 rounded-full">
                  {hasPlan ? "已配置" : "未配置"}
                </span>
              </button>

              {/* Scope Card */}
              <button
                onClick={() => openModal("scope")}
                className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">考试范围</h3>
                <p className="text-sm text-gray-500">配置考试范围与PDF</p>
                <span className="mt-3 inline-block text-xs bg-orange-100 text-orange-500 px-3 py-1 rounded-full">
                  {storage.examScope ? "已配置" : "未配置"}
                </span>
              </button>

              {/* Recycle Card */}
              <button
                onClick={() => openModal("recycle")}
                className="bg-gradient-to-br from-red-50 to-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-center group"
              >
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">回收站</h3>
                <p className="text-sm text-gray-500">恢复或彻底删除记录</p>
                <span className="mt-3 inline-block text-xs bg-red-100 text-red-500 px-3 py-1 rounded-full">
                  {storage.recycleBin?.length || 0}条记录
                </span>
              </button>
            </div>
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
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  考试范围配置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">考试范围详情</label>
                    <textarea
                      className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all min-h-[180px] resize-none"
                      placeholder="请输入你的考试信息..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">上传考试范围PDF（可选）</label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button className="bg-blue-600 text-white rounded-full py-3 px-8 font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      提交生成复习计划
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-blue-600" />
                  系统配置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">后端API基础地址</label>
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                      placeholder="请输入API基础地址"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  数据管理
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all text-left flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    一键导出所有数据
                  </button>
                  <button className="w-full bg-gray-100 text-red-600 rounded-full py-3 px-6 font-medium hover:bg-red-50 transition-all text-left flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空所有本地数据
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 rounded-2xl p-4 text-center text-sm text-gray-500">
                <p>产品名称：GenToDo | 版本号：v2.0.0 | © 2026 GenToDo 保留所有权利</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showModals.chat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
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
                <div className="text-center text-gray-400 py-8">开始对话，获得AI学习建议</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 border-t flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-gray-50 rounded-full px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                placeholder="输入你的调整需求..."
                disabled={aiLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={aiLoading || !inputValue.trim()}
                className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageSquare className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModals.plan && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col animate-slideUp">
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
              <div className="text-center text-gray-400 py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>暂无总学习计划，去配置考试范围生成计划吧</p>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button className="bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all">
                AI优化计划
              </button>
              <button
                onClick={() => closeModal("plan")}
                className="bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {showModals.scope && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
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
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">考试范围文本</label>
                  <textarea
                    value={examScope}
                    onChange={(e) => setExamScope(e.target.value)}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all min-h-[200px] resize-none"
                    placeholder="请输入考试范围..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">上传PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={handleSaveScope}
                className="bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                仅保存
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={aiLoading}
                className="bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI生成计划
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModals.recycle && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
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
              <button className="text-red-600 rounded-full py-3 px-6 font-medium hover:bg-red-50 transition-all">
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
