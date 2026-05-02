import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

export default function Chat({ storage, saveStorage }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: inputValue,
      type: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        content: "这是一个模拟的AI响应。需要后端API支持实现真实对话功能。",
        type: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div className="animate-fadeIn flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-gray-800 mb-2">
          对话助手
        </h2>
        <p className="text-gray-500">与AI讨论你的学习计划</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 mb-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-400">开始对话，获得AI学习建议</p>
          </div>
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

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 bg-gray-50 rounded-full px-4 py-3 outline-none border-2 border-transparent focus:border-blue-600 transition-all"
          placeholder="输入你的问题..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
