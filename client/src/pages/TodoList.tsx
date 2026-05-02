import { useState, useEffect } from "react";
import { CheckSquare2, Edit2, Trash2 } from "lucide-react";

export default function TodoList({ storage, saveStorage }: any) {
  const [currentDate, setCurrentDate] = useState("2026年05月02日");
  const [activeTab, setActiveTab] = useState("daily");
  const [todos, setTodos] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setCurrentDate(`${year}年${month}月${day}日`);
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
            ToDo 任务列表
          </h2>
          <p className="text-gray-500">按天管理你的学习待办任务</p>
        </div>
        <div className="mt-4 md:mt-0 text-lg font-semibold text-blue-600 bg-blue-50 px-5 py-2 rounded-full cursor-pointer select-none">
          {currentDate}
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex bg-white rounded-full shadow-sm p-1">
          <button
            onClick={() => setActiveTab("daily")}
            className={`rounded-full px-5 py-2 font-medium transition-all ${
              activeTab === "daily"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            当日待办
          </button>
          <button
            onClick={() => setActiveTab("total")}
            className={`rounded-full px-5 py-2 font-medium transition-all ${
              activeTab === "total"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
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

      {/* Todo Items */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <CheckSquare2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">暂无待办任务</p>
          </div>
        ) : (
          todos.map((todo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-all flex items-center gap-4"
            >
              <input
                type="checkbox"
                className="w-5 h-5 rounded cursor-pointer"
                defaultChecked={todo.completed}
              />
              <div className="flex-1">
                <p className={todo.completed ? "line-through text-gray-400" : "text-gray-800"}>
                  {todo.content}
                </p>
                {todo.deadline && (
                  <p className="text-sm text-gray-400 mt-1">{todo.deadline}</p>
                )}
              </div>
              <button className="text-gray-400 hover:text-blue-600 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="text-gray-400 hover:text-red-600 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
