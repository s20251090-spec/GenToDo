import { Sparkles, Zap, Target, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function Dashboard({ storage, saveStorage }: any) {
  const [currentDate, setCurrentDate] = useState("");
  const [todayProgress, setTodayProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { year: "numeric" as const, month: "long" as const, day: "numeric" as const, weekday: "long" as const };
    setCurrentDate(now.toLocaleDateString("zh-CN", options));
  }, []);

  const handleGenerateToDo = async () => {
    // Placeholder for AI generation
    alert("生成今日ToDo功能 - 需要后端API支持");
  };

  const hasPlan = !!storage.totalPlan;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
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
        // Generate ToDo Card
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 hover:shadow-md transition-all">
          <div className="flex flex-col items-center text-center">
            <Sparkles className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">一键生成今日学习计划</h3>
            <p className="text-gray-500 mb-6">
              AI将根据你的总计划、学习历史，自动为你生成今日最优ToDo清单
            </p>
            <button
              onClick={handleGenerateToDo}
              className="bg-blue-600 text-white rounded-full shadow-sm py-3 px-8 font-medium hover:shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              生成今日ToDo
            </button>
          </div>
        </div>
      ) : (
        // Dashboard Stats
        <div>
          {/* Today Focus Card */}
          <div className="bg-blue-600 text-white rounded-2xl shadow-sm p-6 mb-8 hover:shadow-md transition-all">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 mr-2" />
              <h3 className="font-semibold text-lg">今日核心聚焦目标</h3>
            </div>
            <p className="text-white/90 text-xl font-medium">
              {storage.totalPlan?.slice(0, 100) || "暂无目标"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Today Progress */}
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

            {/* Overall Progress */}
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

          {/* Recent ToDo Preview */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">近期待办预览</h3>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-center text-gray-400 py-8">
                暂无待办任务，点击上方按钮生成今日计划
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
