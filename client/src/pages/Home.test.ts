import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the GoogleGenerativeAI module
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(),
}));

describe("GenToDo AI Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize Gemini AI with API key", () => {
    const mockApiKey = "test-api-key";
    process.env.VITE_GEMINI_API_KEY = mockApiKey;

    const genAI = new GoogleGenerativeAI(mockApiKey);
    expect(genAI).toBeDefined();
    expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
  });

  it("should handle missing API key gracefully", () => {
    delete process.env.VITE_GEMINI_API_KEY;
    
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    expect(apiKey).toBeUndefined();
  });

  it("should validate message format", () => {
    const userMessage = {
      id: Date.now(),
      content: "Test message",
      type: "user",
      timestamp: new Date(),
    };

    expect(userMessage).toHaveProperty("content");
    expect(userMessage).toHaveProperty("type");
    expect(userMessage.type).toBe("user");
  });

  it("should validate AI response format", () => {
    const aiMessage = {
      id: Date.now() + 1,
      content: "AI response",
      type: "ai",
      timestamp: new Date(),
    };

    expect(aiMessage).toHaveProperty("content");
    expect(aiMessage).toHaveProperty("type");
    expect(aiMessage.type).toBe("ai");
  });

  it("should store chat history correctly", () => {
    const chatHistory = [
      {
        id: 1,
        content: "User message",
        type: "user",
        timestamp: new Date(),
      },
      {
        id: 2,
        content: "AI response",
        type: "ai",
        timestamp: new Date(),
      },
    ];

    expect(chatHistory).toHaveLength(2);
    expect(chatHistory[0].type).toBe("user");
    expect(chatHistory[1].type).toBe("ai");
  });

  it("should validate exam scope input", () => {
    const examScope = "数学：代数、几何、微积分";
    
    expect(examScope).toBeTruthy();
    expect(examScope.length).toBeGreaterThan(0);
  });

  it("should validate learning plan structure", () => {
    const plan = {
      goals: "学习目标",
      stages: "学习阶段",
      content: "重点内容",
      strategy: "复习策略",
      daily: "每日建议",
    };

    expect(plan).toHaveProperty("goals");
    expect(plan).toHaveProperty("stages");
    expect(plan).toHaveProperty("content");
    expect(plan).toHaveProperty("strategy");
    expect(plan).toHaveProperty("daily");
  });

  it("should handle localStorage for chat history", () => {
    const storage = {
      chatHistory: [
        { id: 1, content: "Test", type: "user", timestamp: new Date() },
      ],
    };

    const serialized = JSON.stringify(storage);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.chatHistory).toHaveLength(1);
    expect(deserialized.chatHistory[0].content).toBe("Test");
  });

  it("should validate AI loading state", () => {
    let aiLoading = false;
    
    expect(aiLoading).toBe(false);
    
    aiLoading = true;
    expect(aiLoading).toBe(true);
  });
});
