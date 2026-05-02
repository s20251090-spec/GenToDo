import { useState } from "react";
import { FileText, BookOpen, Trash2, Save } from "lucide-react";

export default function Settings({ storage, saveStorage }: any) {
  const [examScope, setExamScope] = useState(storage.examScope || "");
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRecycleModal, setShowRecycleModal] = useState(false);

  const handleSaveScope = () => {
    const newStorage = { ...storage, examScope };
    saveStorage(newStorage);
    setShowScopeModal(false);
    alert("考试范围已保存");
  };

  const settingsCards = [
    {
      id: "scope",
      title: "考试范围配置",
      status: storage.examScope ? "已配置" : "未配置",
      icon: BookOpen,
      color: "bg-orange-50 text-orange-600",
      onClick: () => setShowScopeModal(true),
    },
    {
      id: "plan",
      title: "总学习计划",
      status: storage.totalPlan ? "已配置" : "未配置",
      icon: FileText,
      color: "bg-cyan-50 text-cyan-600",
      onClick: () => setShowPlanModal(true),
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowScopeModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveScope}
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
