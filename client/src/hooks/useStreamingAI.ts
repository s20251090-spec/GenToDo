import { useState, useCallback } from "react";

interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export const useStreamingAI = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const stream = useCallback(
    async (prompt: string, options: StreamingOptions = {}) => {
      const { onChunk, onComplete, onError } = options;

      setIsStreaming(true);
      setStreamingText("");
      let fullText = "";

      try {
        const response = await fetch("/api/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle Server-Sent Events (SSE)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Process complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();

            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6);
                const data = JSON.parse(jsonStr);

                if (data.done) {
                  // Streaming complete
                  setIsStreaming(false);
                  onComplete?.(fullText);
                } else if (data.char) {
                  // Add character to the stream
                  fullText += data.char;
                  setStreamingText(fullText);
                  onChunk?.(data.char);
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }

          // Keep the last incomplete line in the buffer
          buffer = lines[lines.length - 1];
        }

        // Process any remaining data in buffer
        if (buffer.trim().startsWith("data: ")) {
          try {
            const jsonStr = buffer.trim().slice(6);
            const data = JSON.parse(jsonStr);

            if (data.done) {
              setIsStreaming(false);
              onComplete?.(fullText);
            } else if (data.char) {
              fullText += data.char;
              setStreamingText(fullText);
              onChunk?.(data.char);
            }
          } catch (e) {
            console.error("Failed to parse final SSE data:", e);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Streaming error:", err);
        setIsStreaming(false);
        onError?.(err);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStreamingText("");
    setIsStreaming(false);
  }, []);

  return {
    stream,
    streamingText,
    isStreaming,
    reset,
  };
};
