import { useState, useEffect } from "react";
import { FileText, BookOpen, Trash2, Save, Database, Eye, Sparkles } from "lucide-react";

interface LearningSettings {
  totalPlan: string;
  examScope: string;
  examDate: string;
  dailyTheme: string;
  dailyGoal: string;
}

interface AIPrompt {
  id: string;
  name: string;
  description: string;
  defaultPrompt: string;
  customPrompt: string;
}

export default function Settings({ storage, saveStorage }: any) {
  const [settings, setSettings] = useState<LearningSettings>({
    totalPlan: "",
    examScope: "",
    examDate: "",
    dailyTheme: "",
    dailyGoal: "",
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStorageViewer, setShowStorageViewer] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [storageData, setStorageData] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRecycleModal, setShowRecycleModal] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([
    {
      id: "daily-plan",
      name: "每日计划生成",
      description: "用于生成每日学习计划的 AI 提示词",
      defaultPrompt: `根据以下信息生成一份详细的每日学习计划：
总学习计划：{totalPlan}
考试范围：{examScope}
考试时间：{examDate}
当日主题：{dailyTheme}
当日目标：{dailyGoal}
已完成任务：{completedHistory}

请生成具体、可执行的每日学习任务清单，每个任务包含时间估计和具体内容。`,
      customPrompt: "",
    },
    {
      id: "plan-optimize",
      name: "计划优化",
      description: "用于优化学习计划的 AI 提示词",
      defaultPrompt: `请根据以下学习计划和完成情况进行优化：
原计划：{plan}
完成情况：{completedHistory}
当前进度：{progress}

请提供改进建议，包括：
1. 哪些任务可以加快
2. 哪些任务需要调整
3. 整体计划是否需要重新安排`,
      customPrompt: "",
    },
    {
      id: "ai-chat",
      name: "AI 对话",
      description: "用于 AI 对话的系统提示词",
      defaultPrompt: `你是一个专业的学习助手。你的职责是：
1. 帮助用户理解学习内容
2. 提供学习建议和方法
3. 回答学习相关的问题
4. 鼓励用户坚持学习

请用友好、专业的语气与用户交流。`,
      customPrompt: "",
    },
  ]);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gentodo_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("加载设置失败", e);
      }
    }

    // Load AI prompts
    const savedPrompts = localStorage.getItem("gentodo_ai_prompts");
    if (savedPrompts) {
      try {
        setAiPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error("加载 AI 提示词失败", e);
      }
    }
  }, []);

  // Save settings
  const handleSaveSettings = () => {
    localStorage.setItem("gentodo_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // View storage
  const handleViewStorage = () => {
    const allStorage = {
      settings: localStorage.getItem("gentodo_settings"),
      storage: localStorage.getItem("gentodo_storage"),
      chatHistory: localStorage.getItem("gentodo_chatHistory"),
    };
    setStorageData(allStorage);
    setShowStorageViewer(!showStorageViewer);
  };

  // Clear all storage
  const handleClearStorage = () => {
    if (window.confirm("确定要清除所有数据吗？此操作不可撤销。")) {
      localStorage.clear();
      setSettings({
        totalPlan: "",
        examScope: "",
        examDate: "",
        dailyTheme: "",
        dailyGoal: "",
      });
      setStorageData(null);
    }
  };

  // Save AI prompt
  const handleSavePrompt = () => {
    if (!selectedPrompt) return;
    const updated = aiPrompts.map((p) =>
      p.id === selectedPrompt.id ? { ...p, customPrompt: editingPrompt } : p
    );
    setAiPrompts(updated);
    localStorage.setItem("gentodo_ai_prompts", JSON.stringify(updated));
    setSelectedPrompt(null);
    setEditingPrompt("");
  };

  // Reset prompt to default
  const handleResetPrompt = () => {
    if (!selectedPrompt) return;
    setEditingPrompt(selectedPrompt.defaultPrompt);
  };

  const settingsCards = [
    {
      id: "core",
      title: "核心学习信息",
      status: settings.examDate ? "已配置" : "未配置",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-600",
      onClick: () => setShowSettingsModal(true),
    },
    {
      id: "prompts",
      title: "AI 提示词管理",
      status: `${aiPrompts.filter((p) => p.customPrompt).length} 个已自定义`,
      icon: Sparkles,
      color: "bg-amber-50 text-amber-600",
      onClick: () => setShowPromptsModal(true),
    },
    {
      id: "storage",
      title: "查看存储数据",
      status: "本地存储",
      icon: Database,
      color: "bg-purple-50 text-purple-600",
      onClick: handleViewStorage,
    },
    {
      id: "recycle",
      title: "回收站",
      status: `${storage.recycleBin?.length || 0}条记录`,
      icon: Trash2,
      color: "bg-red-50 text-red-600",
      onClick: () => setShowRecycleModal(true),
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
          设置
        </h2>
        <p className="text-gray-500">管理你的学习计划和配置</p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
            >
              <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-1">
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm">{card.status}</p>
            </button>
          );
        })}
      </div>

      {/* AI Prompts Modal */}
      {showPromptsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-600" />
                AI 提示词管理
              </h3>
              <button
                onClick={() => {
                  setShowPromptsModal(false);
                  setSelectedPrompt(null);
                  setEditingPrompt("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {!selectedPrompt ? (
              <div className="p-6 space-y-3">
                {aiPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setEditingPrompt(prompt.customPrompt || prompt.defaultPrompt);
                    }}
                    className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{prompt.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{prompt.description}</p>
                      </div>
                      <div className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                        {prompt.customPrompt ? "已自定义" : "使用默认"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{selectedPrompt.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{selectedPrompt.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    提示词内容
                  </label>
                  <textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    rows={10}
                  />
                </div>

                <div className="flex gap-2 text-xs text-gray-500">
                  <p>💡 提示：可以使用 {'{'} totalPlan {'}'} {'{'} examScope {'}'} {'{'} examDate {'}'} 等变量</p>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
              {selectedPrompt ? (
                <>
                  <button
                    onClick={() => {
                      setSelectedPrompt(null);
                      setEditingPrompt("");
                    }}
                    className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleResetPrompt}
                    className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
                  >
                    恢复默认
                  </button>
                  <button
                    onClick={handleSavePrompt}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
                  >
                    保存修改
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowPromptsModal(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Core Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold">核心学习信息配置</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 全周期总学习计划表 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  全周期总学习计划表 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={settings.totalPlan}
                  onChange={(e) => setSettings({ ...settings, totalPlan: e.target.value })}
                  placeholder="例如：第1周复习基础知识，第2周做题训练，第3周查漏补缺..."
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">描述整个学习周期的总体计划和目标分配</p>
              </div>

              {/* 考试范围 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  考试范围 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={settings.examScope}
                  onChange={(e) => setSettings({ ...settings, examScope: e.target.value })}
                  placeholder="例如：第1-5章，重点是第3章的核心概念和公式推导..."
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-2">明确考试涵盖的知识范围和重点</p>
              </div>

              {/* 考试时间 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  考试时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={settings.examDate}
                  onChange={(e) => setSettings({ ...settings, examDate: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">设置考试日期，系统将自动计算倒计时</p>
              </div>

              {/* 当日学习主题 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  当日学习主题
                </label>
                <input
                  type="text"
                  value={settings.dailyTheme}
                  onChange={(e) => setSettings({ ...settings, dailyTheme: e.target.value })}
                  placeholder="例如：第3章重点知识梳理"
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">指定今天的学习主题，作为 AI 生成计划的方向</p>
              </div>

              {/* 当日核心目标 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  当日核心目标
                </label>
                <input
                  type="text"
                  value={settings.dailyGoal}
                  onChange={(e) => setSettings({ ...settings, dailyGoal: e.target.value })}
                  placeholder="例如：掌握核心概念，完成 10 道练习题"
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">明确今天的学习目标，帮助 AI 生成更精准的计划</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                className={`flex-1 py-3 rounded-full font-semibold transition flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save className="w-5 h-5" />
                {saved ? "已保存" : "保存设置"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Viewer Modal */}
      {showStorageViewer && storageData && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white flex justify-between items-center p-6 border-b rounded-t-3xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                本地存储数据
              </h3>
              <button
                onClick={() => setShowStorageViewer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Settings */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">学习计划设置</h3>
                <pre className="bg-gray-50 p-4 rounded-xl overflow-auto max-h-48 text-xs">
                  {storageData.settings
                    ? JSON.stringify(JSON.parse(storageData.settings), null, 2)
                    : "无数据"}
                </pre>
              </div>

              {/* General Storage */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">通用存储</h3>
                <pre className="bg-gray-50 p-4 rounded-xl overflow-auto max-h-48 text-xs">
                  {storageData.storage
                    ? JSON.stringify(JSON.parse(storageData.storage), null, 2)
                    : "无数据"}
                </pre>
              </div>

              {/* Chat History */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">聊天历史</h3>
                <pre className="bg-gray-50 p-4 rounded-xl overflow-auto max-h-48 text-xs">
                  {storageData.chatHistory
                    ? JSON.stringify(JSON.parse(storageData.chatHistory), null, 2)
                    : "无数据"}
                </pre>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t flex gap-3 rounded-b-3xl">
              <button
                onClick={() => setShowStorageViewer(false)}
                className="flex-1 py-3 border border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition"
              >
                关闭
              </button>
              <button
                onClick={handleClearStorage}
                className="flex-1 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition"
              >
                清除所有数据
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scope Modal */}
      {showScopeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">考试范围配置</h3>
              <button
                onClick={() => setShowScopeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-1 block">考试范围文本</label>
                <textarea
                  value={settings.examScope}
                  onChange={(e) => setSettings({ ...settings, examScope: e.target.value })}
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowScopeModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const newStorage = { ...storage, examScope: settings.examScope };
                  saveStorage(newStorage);
                  setShowScopeModal(false);
                  alert("考试范围已保存");
                }}
                className="flex-1 bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">总学习计划</h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
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
                onClick={() => setShowPlanModal(false)}
                className="bg-blue-600 text-white rounded-full py-3 px-6 font-medium hover:bg-blue-700 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle Modal */}
      {showRecycleModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">回收站</h3>
              <button
                onClick={() => setShowRecycleModal(false)}
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
            <div className="p-6 border-t flex justify-end">
              <button className="text-red-600 rounded-full py-3 px-6 font-medium hover:bg-red-50 transition-all">
                清空回收站
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
